import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function createAuthContext(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: jsonError("Supabase is not configured.", 500) };
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
        cookies.forEach((cookie) => cookiesToPersist.push(cookie));
      },
    },
  });

  return { supabase, applyCookies };
}

export async function DELETE(request: NextRequest) {
  try {
    const authContext = createAuthContext(request);
    if ("error" in authContext) return authContext.error;

    const { data: authData, error: authError } = await authContext.supabase.auth.getUser();
    if (authError || !authData?.user) {
      return authContext.applyCookies(jsonError("Unauthorized", 401));
    }

    const body = (await request.json()) as { childId?: unknown; classId?: unknown };
    const childId = typeof body.childId === "string" ? body.childId.trim() : "";
    const classId = typeof body.classId === "string" ? body.classId.trim() : "";

    if (!childId || !classId) {
      return authContext.applyCookies(jsonError("childId and classId are required.", 400));
    }

    const { data, error } = await supabaseAdmin
      .from("WaitlistEntries")
      .delete()
      .eq("childId", childId)
      .eq("classId", classId)
      .eq("status", "waiting")
      .select("childId,classId");

    if (error) return authContext.applyCookies(jsonError(error.message, 500));
    if (!data || data.length === 0) {
      return authContext.applyCookies(jsonError("Waitlist entry not found.", 404));
    }

    return authContext.applyCookies(NextResponse.json({ ok: true }));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
