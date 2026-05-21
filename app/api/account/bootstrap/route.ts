import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getChildrenForAccount } from "@/lib/server/children";
import { getMedicalInfoForChildren } from "@/lib/server/medical";
import {
  getActiveBookingsForAccount,
  getBillingSummariesForSubscriptions,
  type AccountBillingSummary,
  type AccountBookingSummary,
} from "@/lib/server/bookings";
import { getAssignedBadgesForChildren } from "@/lib/server/badges";
import {
  getServerAuthRequestKey,
  logAuthValidation,
} from "@/lib/authValidationDebug";

export async function POST(request: NextRequest) {
  try {
    let includeChildDetails = true;
    try {
      const parsed = await request.json();
      if (
        parsed &&
        typeof parsed === "object" &&
        "includeChildDetails" in parsed
      ) {
        includeChildDetails = Boolean(
          (parsed as { includeChildDetails?: unknown }).includeChildDetails
        );
      }
    } catch {
      includeChildDetails = true;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured" },
        { status: 500 }
      );
    }

    const cookieStore = request.cookies;
    const cookiesToPersist: Array<{
      name: string;
      value: string;
      options?: CookieOptions;
    }> = [];
    const applyCookies = (response: NextResponse) => {
      cookiesToPersist.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    };

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookies: Array<{ name: string; value: string; options?: CookieOptions }>) {
            cookies.forEach((cookie) => {
              cookiesToPersist.push(cookie);
            });
          },
        },
      }
    );

    logAuthValidation({
      method: "getUser",
      source: "app/api/account/bootstrap/route.ts",
      requestKey: getServerAuthRequestKey(
        request.headers,
        request.nextUrl.pathname
      ),
    });
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return applyCookies(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const authUserId = data.user.id;
    const devImpersonateEmail = process.env.DEV_IMPERSONATE_EMAIL?.trim() || null;
    const isDevImpersonating =
      process.env.NODE_ENV !== "production" &&
      !!devImpersonateEmail;
    let email = data.user.email;

    if (isDevImpersonating) {
      email = devImpersonateEmail;
    }

    if (
      process.env.NODE_ENV === "production" &&
      devImpersonateEmail
    ) {
      throw new Error("DEV_IMPERSONATE_EMAIL must not be set in production");
    }

    const serviceRole = createServerClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {},
        },
      }
    );

    let webAccount: {
      id: string;
      auth_user_id: string;
      email: string | null;
      account_id: string | null;
    } | null = null;

    const { data: webAccountData, error: webAccountError } = await serviceRole
      .from("web_accounts")
      .select("id,auth_user_id,email,account_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (webAccountError) {
      return applyCookies(
        NextResponse.json({ error: webAccountError.message }, { status: 500 })
      );
    }

    webAccount = webAccountData ?? null;

    if (!webAccount) {
      const { data: inserted, error: insertError } = await serviceRole
        .from("web_accounts")
        .insert({
          auth_user_id: authUserId,
          email,
        })
        .select("id,auth_user_id,email,account_id")
        .maybeSingle();

      if (insertError) {
        const isDuplicateAuthUserInsert =
          insertError.code === "23505" &&
          insertError.message.includes("web_accounts_auth_user_id_key");

        if (!isDuplicateAuthUserInsert) {
          return applyCookies(
            NextResponse.json({ error: insertError.message }, { status: 500 })
          );
        }

        const { data: existingAfterDuplicate, error: existingAfterDuplicateError } =
          await serviceRole
            .from("web_accounts")
            .select("id,auth_user_id,email,account_id")
            .eq("auth_user_id", authUserId)
            .maybeSingle();

        if (existingAfterDuplicateError || !existingAfterDuplicate) {
          return applyCookies(
            NextResponse.json(
              {
                error:
                  existingAfterDuplicateError?.message ??
                  "Unable to load account link after duplicate insert.",
              },
              { status: 500 }
            )
          );
        }

        webAccount = existingAfterDuplicate;
      } else {
        webAccount = inserted ?? {
          id: "",
          auth_user_id: authUserId,
          email,
          account_id: null,
        };
      }
    }

    let account = null;

    if (isDevImpersonating) {
      const { data: legacyAccount, error: legacyError } = await serviceRole
        .from("Accounts")
        .select(
          "id,email,accFirstName,accLastName,accTelNo,accEmergencyTelNo,accAddress"
        )
        .ilike("email", email ?? "")
        .maybeSingle();

      if (legacyError) {
        if (legacyError.code === "PGRST116") {
          return applyCookies(
            NextResponse.json(
              { error: "Multiple accounts found for this email." },
              { status: 409 }
            )
          );
        }
        return applyCookies(
          NextResponse.json({ error: legacyError.message }, { status: 500 })
        );
      }

      if (!legacyAccount?.id) {
        return applyCookies(
          NextResponse.json({
            ok: true,
            status: "missing",
            account: null,
            children: [],
            medicalByChildId: {},
            accountBookings: [],
            accountBillingSummaries: [],
            badgesByChildId: {},
            childDetailsIncluded: false,
            accountExists: false,
            profileComplete: false,
            nextRoute: "/account/setup",
            devImpersonatedEmail: isDevImpersonating ? email ?? null : null,
          })
        );
      }

      account = legacyAccount;
    }

    if (!account && !webAccount.account_id) {
      const { data: legacyAccount, error: legacyError } = await serviceRole
        .from("Accounts")
        .select(
          "id,email,accFirstName,accLastName,accTelNo,accEmergencyTelNo,accAddress"
        )
        .ilike("email", email ?? "")
        .maybeSingle();

      if (legacyError) {
        if (legacyError.code === "PGRST116") {
          return applyCookies(
            NextResponse.json(
              { error: "Multiple accounts found for this email." },
              { status: 409 }
            )
          );
        }
        return applyCookies(
          NextResponse.json({ error: legacyError.message }, { status: 500 })
        );
      }

      if (legacyAccount?.id) {
        const { error: updateError } = await serviceRole
          .from("web_accounts")
          .update({ account_id: legacyAccount.id })
          .eq("auth_user_id", authUserId);

        if (updateError) {
          return applyCookies(
            NextResponse.json({ error: updateError.message }, { status: 500 })
          );
        }

        account = legacyAccount;
      } else {
        return applyCookies(
          NextResponse.json({
            ok: true,
            status: "missing",
            account: null,
            children: [],
            medicalByChildId: {},
            accountBookings: [],
            accountBillingSummaries: [],
            badgesByChildId: {},
            childDetailsIncluded: false,
            accountExists: false,
            profileComplete: false,
            nextRoute: "/account/setup",
            devImpersonatedEmail: isDevImpersonating ? email ?? null : null,
          })
        );
      }
    }

    if (!account) {
      const { data: accountData, error: accountError } = await serviceRole
        .from("Accounts")
        .select(
          "id,email,accFirstName,accLastName,accTelNo,accEmergencyTelNo,accAddress"
        )
        .eq("id", webAccount.account_id)
        .maybeSingle();

      if (accountError) {
        return applyCookies(
          NextResponse.json({ error: accountError.message }, { status: 500 })
        );
      }

      account = accountData ?? null;
    }

    if (account?.id) {
      let children: Awaited<ReturnType<typeof getChildrenForAccount>> = [];
      let medicalByChildId = {};
      let accountBookings: AccountBookingSummary[] = [];
      let accountBillingSummaries: AccountBillingSummary[] = [];
      let badgesByChildId = {};
      let childIds: string[] = [];

      try {
        children = await getChildrenForAccount(account.id);
        childIds = children.map((child) => child.id);
      } catch {}

      if (includeChildDetails && childIds.length > 0) {
        const [medicalResult, bookingsResult, badgesResult] = await Promise.allSettled([
          getMedicalInfoForChildren(childIds),
          getActiveBookingsForAccount(account.id, childIds),
          getAssignedBadgesForChildren(childIds),
        ]);

        if (medicalResult.status === "fulfilled") {
          medicalByChildId = medicalResult.value;
        }
        if (bookingsResult.status === "fulfilled") {
          accountBookings = bookingsResult.value;
          accountBillingSummaries = await getBillingSummariesForSubscriptions(
            bookingsResult.value
              .filter(
                (booking) =>
                  booking.bookingKind === "class" &&
                  (booking.programme === "recreational" ||
                    booking.programme === "competition")
              )
              .map((booking) => ({
                programme: booking.programme as "recreational" | "competition",
                subscriptionId: booking.stripeSubscriptionId,
              }))
          );
        }
        if (badgesResult.status === "fulfilled") {
          badgesByChildId = badgesResult.value;
        }
      } else if (includeChildDetails) {
        const bookingsResult = await Promise.allSettled([
          getActiveBookingsForAccount(account.id, childIds),
        ]);
        if (bookingsResult[0].status === "fulfilled") {
          accountBookings = bookingsResult[0].value;
          accountBillingSummaries = await getBillingSummariesForSubscriptions(
            bookingsResult[0].value
              .filter(
                (booking) =>
                  booking.bookingKind === "class" &&
                  (booking.programme === "recreational" ||
                    booking.programme === "competition")
              )
              .map((booking) => ({
                programme: booking.programme as "recreational" | "competition",
                subscriptionId: booking.stripeSubscriptionId,
              }))
          );
        }
      }

      const profileComplete = !!(
        account.accFirstName &&
        account.accLastName &&
        account.accTelNo &&
        account.accEmergencyTelNo
      );

      return applyCookies(
        NextResponse.json({
          ok: true,
          status: "existing",
          account: {
            id: account.id,
            email: account.email,
            accFirstName: account.accFirstName ?? null,
            accLastName: account.accLastName ?? null,
            accTelNo: account.accTelNo ?? null,
            accEmergencyTelNo: account.accEmergencyTelNo ?? null,
            accAddress: account.accAddress ?? null,
          },
          children,
          medicalByChildId,
          accountBookings,
          accountBillingSummaries,
          badgesByChildId,
          childDetailsIncluded: includeChildDetails,
          accountExists: true,
          profileComplete,
          nextRoute: profileComplete ? "/account" : "/account/setup",
          devImpersonatedEmail: isDevImpersonating ? email ?? null : null,
        })
      );
    }

    return applyCookies(
      NextResponse.json({
        ok: true,
        status: "missing",
        account: null,
        children: [],
        medicalByChildId: {},
        accountBookings: [],
        accountBillingSummaries: [],
        badgesByChildId: {},
        childDetailsIncluded: false,
        accountExists: false,
        profileComplete: false,
        nextRoute: "/account/setup",
        devImpersonatedEmail: isDevImpersonating ? email ?? null : null,
      })
    );
  } catch (err) {
    const response = NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
    return response;
  }
}
