import "server-only";

import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/admin";

export type AdminMissedPaymentRow = {
  id: string;
  programme: "Recreational" | "Competition";
  accountFullName: string;
  email: string;
  accTelNo: string;
  subscriptionId: string;
  customerId: string;
  status: string;
  subscriptionState: "active" | "cancel_at_period_end" | "cancelled";
  amountDue: number | null;
  currency: string;
  invoiceId: string;
  invoiceCreated: string | null;
  nextPaymentAttempt: string | null;
};

export type DelinquentAccountFlag = {
  accountId: string;
  accountFullName: string;
  email: string;
  accTelNo: string;
  statuses: string[];
  programmes: Array<"Recreational" | "Competition">;
  latestInvoiceCreated: string | null;
  nextPaymentAttempt: string | null;
  totalAmountDue: number | null;
  recreationalSubscriptionId: string | null;
  recreationalCustomerId: string | null;
  competitionSubscriptionId: string | null;
  competitionCustomerId: string | null;
};

type ProgrammeConfig = {
  programme: "Recreational" | "Competition";
  secretKey: string | undefined;
};

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2026-01-28.clover";
const TARGET_STATUSES: Stripe.SubscriptionListParams.Status[] = ["past_due", "unpaid"];

function normalizeCurrency(currency: string | null | undefined): string {
  return typeof currency === "string" && currency.trim()
    ? currency.trim().toUpperCase()
    : "GBP";
}

function normalizeEmail(email: string | null | undefined): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function extractCustomerEmail(customer: Stripe.Customer | Stripe.DeletedCustomer | string | null) {
  if (!customer || typeof customer === "string") return "";
  return customer.deleted ? "" : customer.email?.trim() ?? "";
}

function extractCustomerId(customer: Stripe.Customer | Stripe.DeletedCustomer | string | null) {
  if (!customer) return "";
  if (typeof customer === "string") return customer;
  return customer.id;
}

function extractInvoice(invoice: Stripe.Invoice | string | null) {
  if (!invoice || typeof invoice === "string") return null;
  return invoice;
}

function getSubscriptionState(
  subscription: Stripe.Subscription
): "active" | "cancel_at_period_end" | "cancelled" {
  if (subscription.status === "canceled" || subscription.canceled_at) {
    return "cancelled";
  }
  if (subscription.cancel_at_period_end) {
    return "cancel_at_period_end";
  }
  return "active";
}

async function listLateSubscriptionsForProgramme(
  config: ProgrammeConfig
): Promise<AdminMissedPaymentRow[]> {
  const secretKey = config.secretKey?.trim();
  if (!secretKey) return [];

  const stripe = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
  const rows = new Map<string, AdminMissedPaymentRow>();

  for (const status of TARGET_STATUSES) {
    let startingAfter: string | undefined;

    for (;;) {
      const page = await stripe.subscriptions.list({
        status,
        limit: 100,
        starting_after: startingAfter,
        expand: ["data.customer", "data.latest_invoice"],
      });

      for (const subscription of page.data) {
        const invoice = extractInvoice(subscription.latest_invoice);
        const email = extractCustomerEmail(subscription.customer) || "No email on Stripe customer";
        const customerId = extractCustomerId(subscription.customer);

        rows.set(subscription.id, {
          id: `${config.programme}:${subscription.id}`,
          programme: config.programme,
          accountFullName: "Unknown parent or guardian",
          email,
          accTelNo: "",
          subscriptionId: subscription.id,
          customerId,
          status: subscription.status,
          subscriptionState: getSubscriptionState(subscription),
          amountDue: typeof invoice?.amount_due === "number" ? invoice.amount_due : null,
          currency: normalizeCurrency(invoice?.currency ?? subscription.currency),
          invoiceId: invoice?.id ?? "",
          invoiceCreated:
            typeof invoice?.created === "number"
              ? new Date(invoice.created * 1000).toISOString()
              : null,
          nextPaymentAttempt:
            typeof invoice?.next_payment_attempt === "number"
              ? new Date(invoice.next_payment_attempt * 1000).toISOString()
              : null,
        });
      }

      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data[page.data.length - 1]?.id;
    }
  }

  return Array.from(rows.values());
}

export async function getAdminMissedPayments(): Promise<AdminMissedPaymentRow[]> {
  const [recreationalRows, competitionRows] = await Promise.all([
    listLateSubscriptionsForProgramme({
      programme: "Recreational",
      secretKey: process.env.LIVE_STRIPE_SECRET_KEY,
    }),
    listLateSubscriptionsForProgramme({
      programme: "Competition",
      secretKey: process.env.LIVE_COMP_STRIPE_SECRET_KEY,
    }),
  ]);

  const combinedRows = [...recreationalRows, ...competitionRows];
  const emails = [...new Set(combinedRows.map((row) => normalizeEmail(row.email)).filter(Boolean))];
  const accountDetailsByEmail = new Map<string, { accountFullName: string; accTelNo: string }>();

  if (emails.length > 0) {
    const { data: accountRows, error } = await supabaseAdmin
      .from("Accounts")
      .select("email,accFirstName,accLastName,accTelNo")
      .in("email", emails);

    if (error) {
      throw new Error(error.message);
    }

    for (const account of (accountRows ?? []) as Array<{
      email: string | null;
      accFirstName: string | null;
      accLastName: string | null;
      accTelNo: string | null;
    }>) {
      const emailKey = normalizeEmail(account.email);
      if (!emailKey) continue;
      const fullName = `${account.accFirstName?.trim() ?? ""} ${account.accLastName?.trim() ?? ""}`.trim();
      accountDetailsByEmail.set(emailKey, {
        accountFullName: fullName || "Unknown parent or guardian",
        accTelNo: account.accTelNo?.trim() ?? "",
      });
    }
  }

  return combinedRows.map((row) => ({
    ...row,
    accountFullName:
      accountDetailsByEmail.get(normalizeEmail(row.email))?.accountFullName ??
      "Unknown parent or guardian",
    accTelNo: accountDetailsByEmail.get(normalizeEmail(row.email))?.accTelNo ?? "",
  })).sort((a, b) => {
    const aTime = a.invoiceCreated ? Date.parse(a.invoiceCreated) : 0;
    const bTime = b.invoiceCreated ? Date.parse(b.invoiceCreated) : 0;
    return bTime - aTime;
  });
}

export async function getDelinquentAccountFlags(): Promise<Map<string, DelinquentAccountFlag>> {
  const paymentRows = await getAdminMissedPayments();
  const emails = [...new Set(paymentRows.map((row) => normalizeEmail(row.email)).filter(Boolean))];
  if (emails.length === 0) return new Map();

  const { data: accountRows, error } = await supabaseAdmin
    .from("Accounts")
    .select("id,email,accFirstName,accLastName,accTelNo")
    .in("email", emails);

  if (error) {
    throw new Error(error.message);
  }

  const rowsByEmail = new Map<string, AdminMissedPaymentRow[]>();
  paymentRows.forEach((row) => {
    const emailKey = normalizeEmail(row.email);
    if (!emailKey) return;
    const bucket = rowsByEmail.get(emailKey) ?? [];
    bucket.push(row);
    rowsByEmail.set(emailKey, bucket);
  });

  const flags = new Map<string, DelinquentAccountFlag>();

  for (const account of (accountRows ?? []) as Array<{
    id: string | number;
    email: string | null;
    accFirstName: string | null;
    accLastName: string | null;
    accTelNo: string | null;
  }>) {
    const emailKey = normalizeEmail(account.email);
    const matches = rowsByEmail.get(emailKey) ?? [];
    if (matches.length === 0) continue;
    const accountFullName = `${account.accFirstName?.trim() ?? ""} ${account.accLastName?.trim() ?? ""}`
      .trim();

    const statuses = [...new Set(matches.map((row) => row.status))];
    const programmes = [...new Set(matches.map((row) => row.programme))] as Array<
      "Recreational" | "Competition"
    >;
    const latestInvoiceCreated =
      matches
        .map((row) => row.invoiceCreated)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null;
    const nextPaymentAttempt =
      matches
        .map((row) => row.nextPaymentAttempt)
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? null;
    const totalAmountDue = matches.reduce((sum, row) => sum + (row.amountDue ?? 0), 0);
    const recreationalMatch =
      matches
        .filter((row) => row.programme === "Recreational")
        .sort((a, b) => {
          const aTime = a.invoiceCreated ? Date.parse(a.invoiceCreated) : 0;
          const bTime = b.invoiceCreated ? Date.parse(b.invoiceCreated) : 0;
          return bTime - aTime;
        })[0] ?? null;
    const competitionMatch =
      matches
        .filter((row) => row.programme === "Competition")
        .sort((a, b) => {
          const aTime = a.invoiceCreated ? Date.parse(a.invoiceCreated) : 0;
          const bTime = b.invoiceCreated ? Date.parse(b.invoiceCreated) : 0;
          return bTime - aTime;
        })[0] ?? null;

    flags.set(String(account.id), {
      accountId: String(account.id),
      accountFullName: accountFullName || "Unknown parent or guardian",
      email: account.email?.trim() ?? "",
      accTelNo: account.accTelNo?.trim() ?? "",
      statuses,
      programmes,
      latestInvoiceCreated,
      nextPaymentAttempt,
      totalAmountDue,
      recreationalSubscriptionId: recreationalMatch?.subscriptionId ?? null,
      recreationalCustomerId: recreationalMatch?.customerId ?? null,
      competitionSubscriptionId: competitionMatch?.subscriptionId ?? null,
      competitionCustomerId: competitionMatch?.customerId ?? null,
    });
  }

  return flags;
}
