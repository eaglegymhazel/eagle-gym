import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

type UpdateMedicalPayload = {
  childId?: unknown
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

const sanitize = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

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

const toNullable = (value: string) => {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
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

    const payload = (await request.json()) as UpdateMedicalPayload
    const childId = sanitize(payload.childId)
    if (!childId) {
      return NextResponse.json(
        { error: "childId is required." },
        { status: 400 }
      )
    }

    const medicalConditions = toNullable(sanitize(payload.medicalConditions))
    const medications = toNullable(sanitize(payload.medications))
    const disabilities = toNullable(sanitize(payload.disabilities))
    const behaviouralConditions = toNullable(sanitize(payload.behaviouralConditions))
    const allergies = toNullable(sanitize(payload.allergies))
    const dietaryNeeds = toNullable(sanitize(payload.dietaryNeeds))
    const doctorName = toNullable(sanitize(payload.doctorName))
    const surgeryAddress = toNullable(sanitize(payload.surgeryAddress))
    const surgeryTelephoneRaw = sanitize(payload.surgeryTelephone)
    const surgeryTelephone = toNullable(surgeryTelephoneRaw.replace(/\D/g, ""))

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

    const updateValues = {
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

    const { data: existingMedical, error: existingError } = await serviceRole
      .from("MedicalInformation")
      .select("childId")
      .eq("childId", childId)
      .maybeSingle()

    if (existingError && existingError.code !== "PGRST116") {
      return applyCookies(
        NextResponse.json({ error: existingError.message }, { status: 500 })
      )
    }

    if (existingMedical?.childId) {
      const { error: updateError } = await serviceRole
        .from("MedicalInformation")
        .update(updateValues)
        .eq("childId", childId)
      if (updateError) {
        return applyCookies(
          NextResponse.json({ error: updateError.message }, { status: 500 })
        )
      }
    } else {
      const { error: insertError } = await serviceRole
        .from("MedicalInformation")
        .insert({
          childId,
          ...updateValues,
        })
      if (insertError) {
        return applyCookies(
          NextResponse.json({ error: insertError.message }, { status: 500 })
        )
      }
    }

    const { data: medical, error: selectError } = await serviceRole
      .from("MedicalInformation")
      .select(
        "childId,medicalConditions,medications,disabilities,behaviouralConditions,allergies,dietaryNeeds,doctorName,surgeryAddress,surgeryTelephone"
      )
      .eq("childId", childId)
      .maybeSingle()

    if (selectError) {
      return applyCookies(
        NextResponse.json({ error: selectError.message }, { status: 500 })
      )
    }

    return applyCookies(NextResponse.json({ ok: true, medical }))
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
