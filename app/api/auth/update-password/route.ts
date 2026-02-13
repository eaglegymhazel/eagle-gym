import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { validatePassword } from "@/lib/passwordPolicy";

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const { password } = await request.json();

  if (!password || typeof password !== "string") {
    return NextResponse.json(
      { error: "Password is required." },
      { status: 400 }
    );
  }

  const validation = validatePassword(password);
  if (!validation.isValid) {
    return NextResponse.json(
      { error: "Password does not meet requirements." },
      { status: 400 }
    );
  }

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

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
  });

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return applyCookies(
      NextResponse.json({ error: error.message }, { status: 400 })
    );
  }

  return applyCookies(NextResponse.json({ ok: true }));
}
