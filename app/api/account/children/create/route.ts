import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

type CreateChildPayload = {
  firstName?: unknown
  lastName?: unknown
  dateOfBirth?: unknown
  photoConsent?: unknown
  waiverAccepted?: unknown
  pickedUp?: unknown
  medicalConditions?: unknown
  medications?: unknown
  disabilities?: unknown
  behaviouralConditions?: unknown
  allergies?: unknown
  dietaryNeeds?: unknown
  doctorName?: unknown
  surgeryAddress?: unknown
  surgeryTelephone?: unknown
}

const NAME_PATTERN = /^[A-Za-z]+$/
const PICKED_UP_VALUES = new Set(["Yes", "No"])

const sanitizeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const toNullable = (value: string) => {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

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
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 })
    }

    const payload = (await request.json()) as CreateChildPayload
    const firstName = sanitizeString(payload.firstName)
    const lastName = sanitizeString(payload.lastName)
    const dateOfBirth = sanitizeString(payload.dateOfBirth)
    const pickedUp = sanitizeString(payload.pickedUp)
    const photoConsent =
      typeof payload.photoConsent === "boolean" ? payload.photoConsent : null
    const waiverAccepted =
      typeof payload.waiverAccepted === "boolean" ? payload.waiverAccepted : null
    const medicalConditions = toNullable(sanitizeString(payload.medicalConditions))
    const medications = toNullable(sanitizeString(payload.medications))
    const disabilities = toNullable(sanitizeString(payload.disabilities))
    const behaviouralConditions = toNullable(
      sanitizeString(payload.behaviouralConditions)
    )
    const allergies = toNullable(sanitizeString(payload.allergies))
    const dietaryNeeds = toNullable(sanitizeString(payload.dietaryNeeds))
    const doctorName = toNullable(sanitizeString(payload.doctorName))
    const surgeryAddress = toNullable(sanitizeString(payload.surgeryAddress))
    const surgeryTelephone = toNullable(
      sanitizeString(payload.surgeryTelephone).replace(/\D/g, "")
    )

    if (
      !firstName ||
      !lastName ||
      !dateOfBirth ||
      photoConsent === null ||
      waiverAccepted !== true ||
      !PICKED_UP_VALUES.has(pickedUp)
    ) {
      return NextResponse.json(
        {
          error:
            "firstName, lastName, dateOfBirth, photoConsent, waiverAccepted and pickedUp are required.",
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

    const { data: child, error: insertError } = await serviceRole
      .from("Children")
      .insert({
        accountId,
        firstName,
        lastName,
        dateOfBirth,
        photoConsent,
        waiverAccepted,
        pickedUp,
      })
      .select(
        "id,accountId,firstName,lastName,dateOfBirth,photoConsent,waiverAccepted,pickedUp"
      )
      .single()

    if (insertError) {
      return applyCookies(
        NextResponse.json({ error: insertError.message }, { status: 500 })
      )
    }

    const medicalValues = {
      medicalConditions,
      medications,
      disabilities,
      behaviouralConditions,
      allergies,
      dietaryNeeds,
      doctorName,
      surgeryAddress,
      surgeryTelephone,
    }

    const { error: medicalInsertError } = await serviceRole
      .from("MedicalInformation")
      .insert({
        childId: child.id,
        ...medicalValues,
      })

    if (medicalInsertError) {
      return applyCookies(
        NextResponse.json({ error: medicalInsertError.message }, { status: 500 })
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
