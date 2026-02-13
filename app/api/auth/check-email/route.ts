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

  const { data: account, error: accountError } = await supabase
    .from("Accounts")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (accountError) {
    return NextResponse.json(
      { error: accountError.message },
      { status: 500 }
    );
  }

  if (account?.id) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const { data: authUserData, error: authError } =
    await supabase.auth.admin.getUserByEmail(normalizedEmail);

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  if (authUserData?.user) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
