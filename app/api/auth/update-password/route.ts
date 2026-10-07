import { NextRequest, NextResponse } from "next/server";
import { createAuthRouteClient } from "@/lib/server/authRouteClient";
import { validatePassword } from "@/lib/passwordPolicy";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const { supabase, applyCookies } = createAuthRouteClient(request);
    const respond = (body: unknown, status = 200) => applyCookies(NextResponse.json(body, { status }));
    const body = await request.json().catch(() => null);
    if (typeof body?.password !== "string" || !validatePassword(body.password).isValid) {
      return respond({ error: "Password does not meet requirements." }, 400);
    }
    let recoveredUserId: string | null = null;
    if (body.tokenHash !== undefined) {
      if (typeof body.tokenHash !== "string" || !body.tokenHash || body.tokenHash.length > 512) {
        return respond({ error: "This reset link is invalid. Request a new password reset email.", code: "recovery_link" }, 400);
      }
      const { data, error } = await supabase.auth.verifyOtp({ token_hash: body.tokenHash, type: "recovery" });
      if (error || !data.user || !data.session || data.session.user.id !== data.user.id) {
        return respond({ error: "This reset link is invalid, expired or already used. Request a new password reset email.", code: "recovery_link" }, 400);
      }
      recoveredUserId = data.user.id;
    }
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || (recoveredUserId && auth.user.id !== recoveredUserId)) {
      return respond({ error: "Unable to verify your reset session. Request a new password reset email.", code: "recovery_link" }, 401);
    }
    const { error } = await supabase.auth.updateUser({ password: body.password });
    if (error) return respond({ error: error.message, ...(recoveredUserId ? { recoveryVerified: true } : {}) }, 400);
    return respond({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to update your password. Please try again." }, {
      status: 500, headers: { "Cache-Control": "no-store" },
    });
  }
}
