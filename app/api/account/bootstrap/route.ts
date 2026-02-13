import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getChildrenForAccount } from "@/lib/server/children";
import { getMedicalInfoForChildren } from "@/lib/server/medical";
import { getActiveBookingsForChildren } from "@/lib/server/bookings";

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const cookieStore = request.cookies;
    const cookiesToPersist: Array<{
      name: string;
      value: string;
      options?: Parameters<typeof cookieStore.set>[2];
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
          setAll(cookies) {
            cookies.forEach((cookie) => {
              cookiesToPersist.push(cookie);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return applyCookies(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      );
    }

    const authUserId = data.user.id;
    let email = data.user.email;

    if (
      process.env.NODE_ENV === "development" &&
      process.env.DEV_IMPERSONATE_EMAIL
    ) {
      email = process.env.DEV_IMPERSONATE_EMAIL;
    }

    if (
      process.env.NODE_ENV === "production" &&
      process.env.DEV_IMPERSONATE_EMAIL
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
        return applyCookies(
          NextResponse.json({ error: insertError.message }, { status: 500 })
        );
      }

      webAccount = inserted ?? {
        id: "",
        auth_user_id: authUserId,
        email,
        account_id: null,
      };
    }

    let account = null;

    if (!webAccount.account_id) {
      const { data: legacyAccount, error: legacyError } = await serviceRole
        .from("Accounts")
        .select(
          "id,email,accFirstName,accLastName,accTelNo,accEmergencyTelNo,accAddress"
        )
        .eq("email", email)
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
            bookingsByChildId: {},
            accountExists: false,
            profileComplete: false,
            nextRoute: "/account/setup",
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
      let children = [];
      let medicalByChildId = {};
      let bookingsByChildId = {};

      try {
        children = await getChildrenForAccount(account.id);
      } catch {}

      try {
        medicalByChildId = await getMedicalInfoForChildren(
          children.map((child) => child.id)
        );
      } catch {}

      try {
        bookingsByChildId = await getActiveBookingsForChildren(
          children.map((child) => child.id)
        );
      } catch {}

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
          bookingsByChildId,
          accountExists: true,
          profileComplete,
          nextRoute: profileComplete ? "/account" : "/account/setup",
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
        bookingsByChildId: {},
        accountExists: false,
        profileComplete: false,
        nextRoute: "/account/setup",
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
