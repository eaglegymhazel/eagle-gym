import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

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
const ADDRESS_PATTERN = /^[A-Za-z0-9 ]*$/

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
    const accTelNo = sanitize(payload.accTelNo)
    const accEmergencyTelNo = sanitize(payload.accEmergencyTelNo)
    const accAddress = sanitize(payload.accAddress)

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
      options?: Parameters<typeof cookieStore.set>[2]
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
        setAll(cookies) {
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
    const userEmail = authData.user.email ?? null

    const serviceRole = createServerClient(supabaseUrl, supabaseServiceRoleKey, {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    })

    const { data: webAccount, error: webAccountError } = await serviceRole
      .from("web_accounts")
      .select("id,account_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle()

    if (webAccountError) {
      return applyCookies(NextResponse.json({ error: webAccountError.message }, { status: 500 }))
    }

    let accountId = webAccount?.account_id ?? null
    if (!accountId && userEmail) {
      const { data: legacyAccount, error: legacyError } = await serviceRole
        .from("Accounts")
        .select("id")
        .eq("email", userEmail)
        .maybeSingle()

      if (legacyError) {
        return applyCookies(NextResponse.json({ error: legacyError.message }, { status: 500 }))
      }

      accountId = legacyAccount?.id ?? null

      if (accountId) {
        if (webAccount?.id) {
          const { error: linkError } = await serviceRole
            .from("web_accounts")
            .update({ account_id: accountId })
            .eq("id", webAccount.id)
          if (linkError) {
            return applyCookies(NextResponse.json({ error: linkError.message }, { status: 500 }))
          }
        } else {
          const { error: createLinkError } = await serviceRole.from("web_accounts").insert({
            auth_user_id: authUserId,
            email: userEmail,
            account_id: accountId,
          })
          if (createLinkError) {
            return applyCookies(
              NextResponse.json({ error: createLinkError.message }, { status: 500 })
            )
          }
        }
      }
    }

    if (!accountId) {
      return applyCookies(
        NextResponse.json({ error: "Account profile not found." }, { status: 404 })
      )
    }

    const { data: account, error: updateError } = await serviceRole
      .from("Accounts")
      .update({
        accFirstName,
        accLastName,
        accTelNo,
        accEmergencyTelNo,
        accAddress: accAddress || null,
      })
      .eq("id", accountId)
      .select("id,email,accFirstName,accLastName,accTelNo,accEmergencyTelNo,accAddress")
      .maybeSingle()

    if (updateError) {
      return applyCookies(NextResponse.json({ error: updateError.message }, { status: 500 }))
    }

    return applyCookies(NextResponse.json({ ok: true, account }))
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
