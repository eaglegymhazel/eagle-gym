import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/admin";
import { createAuthRouteClient } from "@/lib/server/authRouteClient";
import { getWebAccountRoleForUser, isAdminRole } from "@/lib/server/webAccountRole";

const input = z.object({
  bookingId: z.string().uuid(),
  subscriptionId: z.string().trim().regex(/^sub_[a-zA-Z0-9]+$/).optional(),
  action: z.literal("list").optional(),
  includeLinked: z.boolean().optional(),
  confirm: z.boolean().optional(),
}).strict();

export async function POST(request: NextRequest) {
  const { supabase, applyCookies } = createAuthRouteClient(request);
  const respond = (body: unknown, status = 200) => applyCookies(NextResponse.json(body, { status }));
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return respond({ error: "Unauthorized" }, 401);
    if (!isAdminRole(await getWebAccountRoleForUser({ authUserId: data.user.id }))) {
      return respond({ error: "Forbidden" }, 403);
    }
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) return respond({ error: "Invalid request origin." }, 403);
    const parsed = input.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return respond({ error: "Enter a valid booking and Stripe subscription ID (sub_...)." }, 400);
    const { bookingId, subscriptionId, confirm, action, includeLinked } = parsed.data;
    if (action !== "list" && !subscriptionId) return respond({ error: "Enter a Stripe subscription ID." }, 400);
    if (action === "list" && confirm) return respond({ error: "Select a subscription before confirming." }, 400);
    const { data: booking, error: bookingError } = await supabaseAdmin.from("Bookings")
      .select("id,accountId,childId,status,bookingType,stripeCustomerId,stripeSubscriptionId")
      .eq("id", bookingId).maybeSingle();
    if (bookingError) throw bookingError;
    if (!booking) return respond({ error: "Booking not found." }, 404);
    if (booking.status !== "active" || !["recreational", "competition"].includes(booking.bookingType)) {
      return respond({ error: "Only active class bookings can be linked." }, 409);
    }
    if (booking.stripeSubscriptionId) return respond({ error: "This booking already has a subscription link." }, 409);
    const secret = booking.bookingType === "recreational"
      ? process.env.LIVE_REC_STRIPE_SECRET_KEY : process.env.LIVE_COMP_STRIPE_SECRET_KEY;
    if (!secret) return respond({ error: "Stripe is not configured for this programme." }, 503);
    const stripe = new Stripe(secret, { apiVersion: "2026-01-28.clover" });
    const { data: account, error: accountError } = await supabaseAdmin.from("Accounts")
      .select("id,email").eq("id", booking.accountId).maybeSingle();
    if (accountError) throw accountError;
    const normalize = (value: string | null | undefined) => value?.trim().toLowerCase() || "";
    const matchesAccount = (customer: Stripe.Customer) => !!account && (customer.metadata.accountId
      ? customer.metadata.accountId === String(account.id)
      : !!normalize(account.email) && normalize(account.email) === normalize(customer.email));
    if (action === "list") {
      const { data: history, error: historyError } = await supabaseAdmin.from("Bookings")
        .select("stripeCustomerId,stripeSubscriptionId,status,Children(firstName,lastName),Classes(className)")
        .eq("accountId", booking.accountId).eq("bookingType", booking.bookingType);
      if (historyError) throw historyError;
      const customers = new Map<string, Stripe.Customer>();
      const knownIds = new Set<string>((history ?? []).map(row => row.stripeCustomerId).filter((id): id is string => !!id));
      for (const id of knownIds) {
        try {
          const customer = await stripe.customers.retrieve(id);
          if (!customer.deleted && matchesAccount(customer)) customers.set(customer.id, customer);
        } catch (error) {
          if (!(error instanceof Stripe.errors.StripeInvalidRequestError) || error.code !== "resource_missing") throw error;
        }
      }
      if (account?.email?.trim()) {
        for await (const customer of stripe.customers.list({ email: account.email.trim(), limit: 100 })) {
          if (matchesAccount(customer)) customers.set(customer.id, customer);
        }
      }
      const subscriptions = [];
      let hiddenLinkedCount = 0;
      for (const customer of customers.values()) {
        if (booking.stripeCustomerId && booking.stripeCustomerId !== customer.id) continue;
        for await (const subscription of stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 100 })) {
          if (!["active", "trialing", "past_due", "unpaid"].includes(subscription.status)) continue;
          const linkedBookings = (history ?? [])
            .filter(row => row.status === "active" && row.stripeSubscriptionId === subscription.id)
            .map(row => {
              const child = Array.isArray(row.Children) ? row.Children[0] : row.Children;
              const cls = Array.isArray(row.Classes) ? row.Classes[0] : row.Classes;
              return `${child?.firstName ?? ""} ${child?.lastName ?? ""} - ${cls?.className ?? "Class"}`.trim();
            });
          if (linkedBookings.length && !includeLinked) {
            hiddenLinkedCount++;
            continue;
          }
          subscriptions.push({
            linkedBookings,
            id: subscription.id, status: subscription.status, description: subscription.description,
            studentName: [subscription.metadata.childFirstName, subscription.metadata.childLastName].filter(Boolean).join(" "),
            customerName: customer.name, customerEmail: customer.email,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            items: subscription.items.data.map(item => ({
              name: item.price.nickname || "Subscription item", amount: item.price.unit_amount,
              currency: item.price.currency, quantity: item.quantity ?? 1,
              interval: item.price.recurring?.interval, intervalCount: item.price.recurring?.interval_count,
            })),
          });
        }
      }
      return respond({ subscriptions, hiddenLinkedCount });
    }
    const subscription = await stripe.subscriptions.retrieve(subscriptionId!, {
      expand: ["customer", "items.data.price.product"],
    });
    if (!["active", "trialing", "past_due", "unpaid"].includes(subscription.status)) {
      return respond({ error: `This subscription is ${subscription.status} and cannot be linked.` }, 409);
    }
    const customer = subscription.customer;
    if (typeof customer === "string" || customer.deleted) return respond({ error: "Stripe customer is unavailable." }, 409);
    // Explicit account metadata takes precedence over a matching email.
    if (!account || (customer.metadata.accountId
      ? customer.metadata.accountId !== String(account.id)
      : !normalize(account.email) || normalize(account.email) !== normalize(customer.email))) {
      return respond({ error: "This Stripe customer does not match the booking's parent account." }, 409);
    }
    if (booking.stripeCustomerId && booking.stripeCustomerId !== customer.id) {
      return respond({ error: "This booking is already linked to a different Stripe customer." }, 409);
    }
    const { data: linked, error: linkedError } = await supabaseAdmin.from("Bookings")
      .select("id,accountId,childId,bookingType,Children(firstName,lastName),Classes(className)")
      .eq("stripeSubscriptionId", subscription.id).eq("status", "active").neq("id", bookingId);
    if (linkedError) throw linkedError;
    if ((linked ?? []).some(row => row.accountId !== booking.accountId || row.bookingType !== booking.bookingType)) {
      return respond({ error: "This subscription is already linked to another account or programme." }, 409);
    }
    const preview = {
      subscriptionId: subscription.id,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      description: subscription.description,
      items: subscription.items.data.map(item => ({
        name: typeof item.price.product === "object" && !item.price.product.deleted ? item.price.product.name : "Subscription item",
        amount: item.price.unit_amount,
        currency: item.price.currency,
        quantity: item.quantity ?? 1,
        interval: item.price.recurring?.interval,
        intervalCount: item.price.recurring?.interval_count,
      })),
      linkedBookings: (linked ?? []).map(row => {
        const child = Array.isArray(row.Children) ? row.Children[0] : row.Children;
        const cls = Array.isArray(row.Classes) ? row.Classes[0] : row.Classes;
        return `${child?.firstName ?? ""} ${child?.lastName ?? ""} � ${cls?.className ?? "Class"}`.trim();
      }),
    };
    if (!confirm) return respond({ preview });
    // Repeat all validation on confirmation; never trust preview details from the browser.
    const { data: saved, error: saveError } = await supabaseAdmin.from("Bookings")
      .update({ stripeCustomerId: customer.id, stripeSubscriptionId: subscription.id, updatedAt: new Date().toISOString() })
      .eq("id", bookingId).eq("status", "active").eq("accountId", booking.accountId)
      .eq("bookingType", booking.bookingType).is("stripeSubscriptionId", null)
      .select("id").maybeSingle();
    if (saveError) throw saveError;
    if (!saved) return respond({ error: "The booking changed. Reload the profile and try again." }, 409);
    console.info("[admin-link-stripe-subscription]", { adminUserId: data.user.id, bookingId, subscriptionId, customerId: customer.id });
    return respond({ ok: true });
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      return respond({ error: "Subscription not found in this programme's Stripe account. Check the ID." }, 400);
    }
    console.error("[admin-link-stripe-subscription] Failed", error);
    return respond({ error: "Unable to link the subscription. Please try again." }, 500);
  }
}
