import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

type UpdateChildProfilePayload = {
  childId?: unknown
  firstName?: unknown
  lastName?: unknown
  dateOfBirth?: unknown
  photoConsent?: unknown
}

const NAME_PATTERN = /^[A-Za-z]+$/

const sanitizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

function isPastDate(value: string) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return parsed < today
}

async function resolveAccountId({
  request,
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceRoleKey,
}: {
  request: NextRequest
  supabaseUrl: string
  supabaseAnonKey: string
  supabaseServiceRoleKey: string
}) {
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
    return {
      errorResponse: applyCookies(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      ),
    }
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
    return {
      errorResponse: applyCookies(
        NextResponse.json({ error: webAccountError.message }, { status: 500 })
      ),
    }
  }

  let accountId = webAccount?.account_id ?? null
  if (!accountId && userEmail) {
    const { data: legacyAccount, error: legacyError } = await serviceRole
      .from("Accounts")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle()

    if (legacyError) {
      return {
        errorResponse: applyCookies(
          NextResponse.json({ error: legacyError.message }, { status: 500 })
        ),
      }
    }

    accountId = legacyAccount?.id ?? null
    if (accountId) {
      if (webAccount?.id) {
        const { error: linkError } = await serviceRole
          .from("web_accounts")
          .update({ account_id: accountId })
          .eq("id", webAccount.id)
        if (linkError) {
          return {
            errorResponse: applyCookies(
              NextResponse.json({ error: linkError.message }, { status: 500 })
            ),
          }
        }
      } else {
        const { error: createLinkError } = await serviceRole
          .from("web_accounts")
          .insert({
            auth_user_id: authUserId,
            email: userEmail,
            account_id: accountId,
          })
        if (createLinkError) {
          return {
            errorResponse: applyCookies(
              NextResponse.json({ error: createLinkError.message }, { status: 500 })
            ),
          }
        }
      }
    }
  }

  if (!accountId) {
    return {
      errorResponse: applyCookies(
        NextResponse.json({ error: "Account profile not found." }, { status: 404 })
      ),
    }
  }

  return { accountId, serviceRole, applyCookies, errorResponse: null }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Supabase is not configured." },
        { status: 500 }
      )
    }

    const payload = (await request.json()) as UpdateChildProfilePayload
    const childId = sanitizeString(payload.childId)
    const firstName = sanitizeString(payload.firstName)
    const lastName = sanitizeString(payload.lastName)
    const dateOfBirth = sanitizeString(payload.dateOfBirth)
    const photoConsent =
      typeof payload.photoConsent === "boolean" ? payload.photoConsent : null

    if (
      !childId ||
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      photoConsent === null
    ) {
      return NextResponse.json(
        {
          error:
            "childId, firstName, lastName, dateOfBirth and photoConsent are required.",
        },
        { status: 400 }
      )
    }
    if (!NAME_PATTERN.test(firstName)) {
      return NextResponse.json(
        { error: "First name can contain letters only." },
        { status: 400 }
      )
    }
    if (!NAME_PATTERN.test(lastName)) {
      return NextResponse.json(
        { error: "Last name can contain letters only." },
        { status: 400 }
      )
    }
    if (!isPastDate(dateOfBirth)) {
      return NextResponse.json(
        { error: "Date of birth must be in the past." },
        { status: 400 }
      )
    }

    const accountResolution = await resolveAccountId({
      request,
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceRoleKey,
    })
    if (accountResolution.errorResponse) {
      return accountResolution.errorResponse
    }

    const { accountId, serviceRole, applyCookies } = accountResolution

    const { data: childForAccount, error: childFetchError } = await serviceRole
      .from("Children")
      .select("id")
      .eq("id", childId)
      .eq("accountId", accountId)
      .maybeSingle()

    if (childFetchError) {
      return applyCookies(
        NextResponse.json({ error: childFetchError.message }, { status: 500 })
      )
    }
    if (!childForAccount?.id) {
      return applyCookies(
        NextResponse.json(
          { error: "Child record not found for this account." },
          { status: 404 }
        )
      )
    }

    const { data: child, error: updateError } = await serviceRole
      .from("Children")
      .update({
        firstName,
        lastName,
        dateOfBirth,
        photoConsent,
      })
      .eq("id", childId)
      .eq("accountId", accountId)
      .select("id,firstName,lastName,dateOfBirth,photoConsent")
      .maybeSingle()

    if (updateError) {
      return applyCookies(
        NextResponse.json({ error: updateError.message }, { status: 500 })
      )
    }

    return applyCookies(NextResponse.json({ ok: true, child }))
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
