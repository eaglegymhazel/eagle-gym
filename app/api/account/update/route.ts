import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

type UpdatePayload = {
  accFirstName?: unknown
  accLastName?: unknown
  accTelNo?: unknown
  accEmergencyTelNo?: unknown
  accAddress?: unknown
}

const sanitize = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const NAME_PATTERN = /^[A-Za-z]+$/
const PHONE_PATTERN = /^[0-9]+$/
const ADDRESS_PATTERN = /^[A-Za-z0-9\s.'\-/#]*$/
const normalizePhoneForStorage = (value: string) => value.replace(/\D/g, "")
const normalizeAddressForStorage = (value: string) =>
  value
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim()

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 })
    }

    const payload = (await request.json()) as UpdatePayload
    const accFirstName = sanitize(payload.accFirstName)
    const accLastName = sanitize(payload.accLastName)
    const accTelNoRaw = sanitize(payload.accTelNo)
    const accEmergencyTelNoRaw = sanitize(payload.accEmergencyTelNo)
    const accAddressRaw = sanitize(payload.accAddress)
    const accTelNo = normalizePhoneForStorage(accTelNoRaw)
    const accEmergencyTelNo = normalizePhoneForStorage(accEmergencyTelNoRaw)
    const accAddress = normalizeAddressForStorage(accAddressRaw)

    if (!accFirstName || !accLastName || !accTelNo || !accEmergencyTelNo) {
      return NextResponse.json(
        {
          error:
            "First name, last name, contact number and emergency contact number are required.",
        },
        { status: 400 }
      )
    }

    if (!NAME_PATTERN.test(accFirstName)) {
      return NextResponse.json(
        { error: "First name can contain letters only (no spaces)." },
        { status: 400 }
      )
    }

    if (!NAME_PATTERN.test(accLastName)) {
      return NextResponse.json(
        { error: "Last name can contain letters only (no spaces)." },
        { status: 400 }
      )
    }

    if (!PHONE_PATTERN.test(accTelNo)) {
      return NextResponse.json(
        { error: "Contact number can contain numbers only." },
        { status: 400 }
      )
    }

    if (!PHONE_PATTERN.test(accEmergencyTelNo)) {
      return NextResponse.json(
        { error: "Emergency contact number can contain numbers only." },
        { status: 400 }
      )
    }

    if (accTelNo === accEmergencyTelNo) {
      return NextResponse.json(
        { error: "Emergency contact number must be different from the contact number." },
        { status: 400 }
      )
    }

    if (accAddress && !ADDRESS_PATTERN.test(accAddress)) {
      return NextResponse.json(
        { error: "Address can contain letters, numbers and spaces only." },
        { status: 400 }
      )
    }

    const cookieStore = request.cookies
    const cookiesToPersist: Array<{
      name: string
      value: string
      options?: CookieOptions
    }> = []
    const applyCookies = (response: NextResponse) => {
      cookiesToPersist.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options)
      })
      return response
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookies: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookies.forEach((cookie) => {
            cookiesToPersist.push(cookie)
          })
        },
      },
    })

    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      return applyCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const authUserId = authData.user.id

    const serviceRole = createServerClient(supabaseUrl, supabaseServiceRoleKey, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    // The database serialises profile setup with Auth confirmation and preserves
    // established account IDs and legacy userId values. Never link by email.
    const { data: account, error: updateError } = await serviceRole.rpc(
      "save_linked_account_profile",
      { p_auth_user_id: authUserId, p_profile: {
        accFirstName,
        accLastName,
        accTelNo,
        accEmergencyTelNo,
        accAddress,
      } }
    )

    if (updateError) {
      return applyCookies(NextResponse.json({
        error: updateError.code === "23505"
          ? "This email is already associated with an account. Please contact us to verify your account link."
          : "Unable to save account details. Please try again or contact us.",
      }, { status: updateError.code === "23505" ? 409 : 500 }))
    }

    return applyCookies(NextResponse.json({ ok: true, account }))
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
