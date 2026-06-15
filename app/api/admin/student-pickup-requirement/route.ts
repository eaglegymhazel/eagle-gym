import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabaseAdmin } from "@/lib/admin";
import { getWebAccountRoleForUser, isAdminRole } from "@/lib/server/webAccountRole";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonError("Supabase is not configured.", 500);
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
      return applyCookies(jsonError("Unauthorized", 401));
    }

    const role = await getWebAccountRoleForUser({
      authUserId: authData.user.id,
    });
    if (!isAdminRole(role)) {
      return applyCookies(jsonError("Forbidden", 403));
    }

    const body = (await request.json().catch(() => null)) as {
      childId?: unknown;
      pickedUp?: unknown;
    } | null;
    const childId = typeof body?.childId === "string" ? body.childId.trim() : "";
    const pickedUp =
      body?.pickedUp === "Yes" || body?.pickedUp === "No" ? body.pickedUp : null;

    if (!childId || !pickedUp) {
      return applyCookies(jsonError("childId and pickedUp are required.", 400));
    }

    const { data, error } = await supabaseAdmin
      .from("Children")
      .update({ pickedUp })
      .eq("id", childId)
      .select("id,pickedUp")
      .maybeSingle();

    if (error) {
      return applyCookies(jsonError(error.message, 500));
    }
    if (!data?.id) {
      return applyCookies(jsonError("Student not found.", 404));
    }

    return applyCookies(
      NextResponse.json({
        ok: true,
        child: {
          id: data.id,
          pickedUp: data.pickedUp,
        },
      })
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unknown error", 500);
  }
}
