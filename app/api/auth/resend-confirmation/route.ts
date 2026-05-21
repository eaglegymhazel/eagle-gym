import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const { email } = await request.json().catch(() => ({}));
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 }
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

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
  });

  const redirectTo =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: normalizedEmail,
    options: {
      emailRedirectTo: `${redirectTo}/auth/callback?next=/login%3Fverified%3Dsignup%26redirect%3D%252Faccount`,
    },
  });

  if (error) {
    return applyCookies(
      NextResponse.json({ error: error.message }, { status: 400 })
    );
  }

  return applyCookies(NextResponse.json({ ok: true }));
}
