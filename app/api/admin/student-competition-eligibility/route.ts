import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";
import { getWebAccountRoleForUser, isAdminRole } from "@/lib/server/webAccountRole";

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

  return { supabase, applyCookies };
}

export async function POST(request: NextRequest) {
  try {
    const authContext = createAuthContext(request);
    if ("error" in authContext) return authContext.error;

    const { data: authData, error: authError } = await authContext.supabase.auth.getUser();
    if (authError || !authData?.user) {
      return authContext.applyCookies(jsonError("Unauthorized", 401));
    }

    const role = await getWebAccountRoleForUser({
      authUserId: authData.user.id,
      email: authData.user.email ?? null,
    });
    if (!isAdminRole(role)) {
      return authContext.applyCookies(jsonError("Forbidden", 403));
    }

    const body = (await request.json()) as {
      childId?: unknown;
      competitionEligible?: unknown;
    };

    const childId = typeof body.childId === "string" ? body.childId.trim() : "";
    const competitionEligible =
      typeof body.competitionEligible === "boolean" ? body.competitionEligible : null;

    if (!childId || competitionEligible === null) {
      return authContext.applyCookies(
        jsonError("childId and competitionEligible are required.", 400)
      );
    }

    const { data, error } = await supabaseAdmin
      .from("Children")
      .update({ competitionEligible })
      .eq("id", childId)
      .select("id,competitionEligible")
      .maybeSingle();

    if (error) {
      return authContext.applyCookies(jsonError(error.message, 500));
    }
    if (!data?.id) {
      return authContext.applyCookies(jsonError("Student not found.", 404));
    }

    return authContext.applyCookies(
      NextResponse.json({
        ok: true,
        child: {
          id: data.id,
          competitionEligible: data.competitionEligible === true,
        },
      })
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
