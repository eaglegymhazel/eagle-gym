import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function authenticateWithAccount(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: jsonError("Supabase is not configured.", 500) };
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
        cookies.forEach((cookie) => cookiesToPersist.push(cookie));
      },
    },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return { error: applyCookies(jsonError("Unauthorized", 401)) };
  }

  const { data: webAccount, error: webAccountError } = await supabaseAdmin
    .from("web_accounts")
    .select("account_id")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (webAccountError) return { error: applyCookies(jsonError(webAccountError.message, 500)) };
  if (!webAccount?.account_id) {
    return { error: applyCookies(jsonError("No account linked to this user.", 403)) };
  }

  return { applyCookies, accountId: String(webAccount.account_id) };
}

async function assertChildOwnership(childId: string, accountId: string) {
  const { data: child, error: childError } = await supabaseAdmin
    .from("Children")
    .select("id,accountId")
    .eq("id", childId)
    .maybeSingle();

  if (childError) return jsonError(childError.message, 500);
  if (!child) return jsonError("Child not found.", 404);
  if (String(child.accountId ?? "") !== String(accountId)) {
    return jsonError("You cannot manage this child.", 403);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateWithAccount(request);
    if ("error" in auth) return auth.error;

    const childId = request.nextUrl.searchParams.get("childId")?.trim() ?? "";
    if (!childId) {
      return auth.applyCookies(jsonError("childId is required.", 400));
    }

    const childOwnershipError = await assertChildOwnership(childId, auth.accountId);
    if (childOwnershipError) {
      return auth.applyCookies(childOwnershipError);
    }

    const { data, error } = await supabaseAdmin
      .from("WaitlistEntries")
      .select("classId,status")
      .eq("childId", childId)
      .eq("status", "waiting");

    if (error) return auth.applyCookies(jsonError(error.message, 500));

    const classIds = (data ?? [])
      .map((entry) => (typeof entry.classId === "string" ? entry.classId : ""))
      .filter(Boolean);

    return auth.applyCookies(NextResponse.json({ classIds }));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateWithAccount(request);
    if ("error" in auth) return auth.error;

    const body = (await request.json()) as {
      childId?: unknown;
      classId?: unknown;
    };
    const childId = typeof body.childId === "string" ? body.childId.trim() : "";
    const classId = typeof body.classId === "string" ? body.classId.trim() : "";

    if (!childId || !classId) {
      return auth.applyCookies(jsonError("childId and classId are required.", 400));
    }

    const childOwnershipError = await assertChildOwnership(childId, auth.accountId);
    if (childOwnershipError) {
      return auth.applyCookies(childOwnershipError);
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("WaitlistEntries")
      .select("childId,classId")
      .eq("childId", childId)
      .eq("classId", classId)
      .maybeSingle();

    if (existingError) return auth.applyCookies(jsonError(existingError.message, 500));
    if (existing) {
      return auth.applyCookies(NextResponse.json({ status: "already_exists" }));
    }

    const { error: insertError } = await supabaseAdmin.from("WaitlistEntries").insert({
      childId,
      classId,
      timestamp: new Date().toISOString(),
      status: "waiting",
    });

    if (insertError) {
      if (insertError.code === "23505") {
        return auth.applyCookies(NextResponse.json({ status: "already_exists" }));
      }
      return auth.applyCookies(jsonError(insertError.message, 500));
    }

    return auth.applyCookies(NextResponse.json({ status: "added" }));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
