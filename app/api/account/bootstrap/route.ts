import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

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

    const email = data.user.email;

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

    const { data: account, error: accountError } = await serviceRole
      .from("Accounts")
      .select(
        "id,email,accFirstName,accLastName,accTelNo,accEmergencyTelNo,accAddress"
      )
      .eq("email", email)
      .maybeSingle();

    if (accountError) {
      return applyCookies(
        NextResponse.json({ error: accountError.message }, { status: 500 })
      );
    }

    if (account?.id) {
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
        })
      );
    }

    return applyCookies(
      NextResponse.json({
        ok: true,
        status: "missing",
        account: null,
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
