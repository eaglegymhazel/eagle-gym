import { NextRequest, NextResponse } from "next/server"
import { createAuthRouteClient } from "@/lib/server/authRouteClient"
import { safeAuthNext, type AccountEmailStatus } from "@/lib/accountEmail"

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  if (params.get("flow") === "email-change" || params.get("type") === "email_change") {
    // Verify on explicit submission so email scanners do not consume the link.
    const target = new URL("/auth/email-change", request.url)
    for (const key of ["token_hash", "code", "error", "error_code"]) {
      const value = params.get(key)
      if (value) target.searchParams.set(key, value)
    }
    return NextResponse.redirect(target)
  }

  // Keep the existing signup/password recovery PKCE flow.
  const code = params.get("code")
  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", request.url))
  try {
    const { supabase, applyCookies } = createAuthRouteClient(request)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    const target = error ? "/login?error=auth_callback" : safeAuthNext(params.get("next"))
    return applyCookies(NextResponse.redirect(new URL(target, request.url)))
  } catch {
    return NextResponse.redirect(new URL("/login?error=supabase_config", request.url))
  }
}

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ status: "error" }, { status: 403 })
  }
  try {
    const { supabase, applyCookies } = createAuthRouteClient(request)
    const respond = (body: unknown, status = 200) => applyCookies(NextResponse.json(body, { status }))
    const body = await request.json().catch(() => null)
    const tokenHash = typeof body?.tokenHash === "string" ? body.tokenHash : null
    const code = typeof body?.code === "string" ? body.code : null
    if ((!tokenHash && !code) || (tokenHash && code)) return respond({ status: "error" }, 400)

    const { data, error } = tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email_change" })
      : await supabase.auth.exchangeCodeForSession(code!)
    if (error) return respond({ status: "error" }, 400)

    // First secure confirmation returns no user/session. An existing session
    // must never be mistaken for the link's subject.
    if (!data.user || !data.session || data.user.new_email) return respond({ status: "partial" })

    // A legacy PKCE code does not identify its verification type here. Exchange
    // it to retain the session, then show the authoritative account status;
    // never claim an email change based on a signup/recovery code.
    if (!tokenHash) return respond({ status: "check" })

    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth.user || auth.user.id !== data.user.id) return respond({ status: "check" })
    const { data: rawStatus, error: statusError } = await supabase.rpc("get_account_email_change_status")
    const status = rawStatus as AccountEmailStatus | null
    if (statusError || !status?.email || status.pendingEmail || !status.synchronised || status.email !== auth.user.email) {
      return respond({ status: "check" })
    }
    return respond({ status: "confirmed", email: status.email })
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500, headers: { "Cache-Control": "no-store" } })
  }
}
