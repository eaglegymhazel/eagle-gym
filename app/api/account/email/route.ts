import { NextRequest, NextResponse } from "next/server"
import { createAuthRouteClient } from "@/lib/server/authRouteClient"
import { EMAIL_CHANGE_CALLBACK, normaliseEmail, validateEmailChange, type AccountEmailStatus } from "@/lib/accountEmail"

async function handle(request: NextRequest, change: boolean) {
  try {
    const { supabase, applyCookies } = createAuthRouteClient(request)
    const respond = (body: unknown, status = 200) => applyCookies(NextResponse.json(body, { status }))
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth.user) return respond({ error: "Please sign in to change your account email." }, 401)

    const { data, error: statusError } = await supabase.rpc("get_account_email_change_status")
    if (statusError || !data) {
      return respond({ error: "Account email changes are not available yet. Please contact us." }, 503)
    }
    const status = data as AccountEmailStatus
    if (!change) return respond(status)

    if (request.headers.get("origin") !== request.nextUrl.origin) {
      return respond({ error: "Invalid request origin." }, 403)
    }
    if (!status.canChange || !status.email) {
      return respond({ error: "Your account link needs to be verified before changing email. Please contact us." }, 409)
    }

    const body = await request.json().catch(() => null)
    const validationError = validateEmailChange(body?.email, body?.confirmation, status.email)
    if (validationError) return respond({ error: validationError }, 400)

    // Keep preview/local confirmations on the requesting deployment even when
    // NEXT_PUBLIC_SITE_URL is shared with production. Supabase must allow this
    // exact callback; no redirect URL is accepted from the submitted form.
    // Secure Email Change must remain enabled in Supabase; never use admin APIs.
    const useRequestOrigin = process.env.VERCEL_ENV === "preview"
      || process.env.VERCEL_ENV === "development"
      || process.env.NODE_ENV === "development"
    const origin = useRequestOrigin
      ? request.nextUrl.origin
      : process.env.NEXT_PUBLIC_SITE_URL?.trim() || request.nextUrl.origin
    const { error } = await supabase.auth.updateUser(
      { email: normaliseEmail(body.email) },
      { emailRedirectTo: new URL(EMAIL_CHANGE_CALLBACK, origin).toString() }
    )
    if (error) {
      return respond({ error: error.status === 429
        ? "Please wait before requesting more confirmation emails."
        : "Unable to request this email change. The address may already be in use. Please try again or contact us.",
      }, error.status === 429 ? 429 : 400)
    }

    // Do not trust updateUser's user snapshot or display the proposed address as
    // confirmed. Only a fresh database read may report the active email.
    const { data: fresh, error: freshError } = await supabase.rpc("get_account_email_change_status")
    if (freshError || !fresh) {
      return respond({ error: "The request was sent, but its status could not be checked. Refresh before trying again." }, 503)
    }
    return respond(fresh)
  } catch {
    return NextResponse.json({ error: "Unable to check your account email. Please try again." }, {
      status: 500, headers: { "Cache-Control": "no-store" },
    })
  }
}

export const GET = (request: NextRequest) => handle(request, false)
export const POST = (request: NextRequest) => handle(request, true)
