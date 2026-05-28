import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const { email } = await request.json();
  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!normalizedEmail) {
    return NextResponse.json(
      { error: "Email is required." },
      { status: 400 }
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });

  const perPage = 1000;
  let page = 1;
  let authUserExists = false;

  while (true) {
    const { data: authUserData, error: authError } =
      await supabase.auth.admin.listUsers({ page, perPage });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const users = authUserData.users ?? [];

    authUserExists = users.some(
      (user) => user.email?.toLowerCase() === normalizedEmail
    );

    if (authUserExists || users.length < perPage) {
      break;
    }

    page += 1;
  }

  if (authUserExists) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
