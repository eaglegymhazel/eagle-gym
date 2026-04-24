import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

type DeleteChildPayload = {
  childId?: unknown
  confirmDelete?: unknown
}

const BLOCKING_BOOKING_STATUSES = ["active", "confirmed", "current"] as const

const sanitizeString = (value: unknown) =>
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
        cookiesToPersist.push(...cookies)
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

    const payload = (await request.json()) as DeleteChildPayload
    const childId = sanitizeString(payload.childId)
    const confirmDelete = payload.confirmDelete === true

    if (!childId) {
      return NextResponse.json({ error: "childId is required." }, { status: 400 })
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

    const { data: childRecord, error: childError } = await serviceRole
      .from("Children")
      .select("id,firstName,lastName,isArchived")
      .eq("id", childId)
      .eq("accountId", accountId)
      .maybeSingle()

    if (childError) {
      return applyCookies(
        NextResponse.json({ error: childError.message }, { status: 500 })
      )
    }

    if (!childRecord?.id) {
      return applyCookies(
        NextResponse.json(
          { error: "Child record not found for this account." },
          { status: 404 }
        )
      )
    }

    if (childRecord.isArchived === true) {
      return applyCookies(
        NextResponse.json({
          ok: true,
          deleted: true,
          childId,
        })
      )
    }

    const { data: activeBookings, error: bookingError } = await serviceRole
      .from("Bookings")
      .select("id,status,Classes(className,weekday,startTime,endTime)")
      .eq("childId", childId)
      .in("status", [...BLOCKING_BOOKING_STATUSES])

    if (bookingError) {
      return applyCookies(
        NextResponse.json({ error: bookingError.message }, { status: 500 })
      )
    }

    const blockingBookings = (activeBookings ?? []).map((booking) => {
      const bookingClass = Array.isArray(booking.Classes)
        ? booking.Classes[0]
        : booking.Classes
      return {
        id: booking.id,
        status: booking.status,
        className: bookingClass?.className ?? null,
        weekday: bookingClass?.weekday ?? null,
        startTime: bookingClass?.startTime ?? null,
        endTime: bookingClass?.endTime ?? null,
      }
    })

    if (blockingBookings.length > 0) {
      return applyCookies(
        NextResponse.json({
          ok: true,
          blocked: true,
          child: childRecord,
          activeBookings: blockingBookings,
          message:
            "This child cannot be removed while they still have an active or future booking.",
        })
      )
    }

    if (!confirmDelete) {
      return applyCookies(
        NextResponse.json({
          ok: true,
          blocked: false,
          child: childRecord,
        })
      )
    }

    const archivedAt = new Date().toISOString()

    const { error: waitlistDeleteError } = await serviceRole
      .from("WaitlistEntries")
      .delete()
      .eq("childId", childId)

    if (waitlistDeleteError) {
      return applyCookies(
        NextResponse.json({ error: waitlistDeleteError.message }, { status: 500 })
      )
    }

    const { error: childArchiveError } = await serviceRole
      .from("Children")
      .update({
        isArchived: true,
        archivedAt,
      })
      .eq("id", childId)
      .eq("accountId", accountId)

    if (childArchiveError) {
      return applyCookies(
        NextResponse.json({ error: childArchiveError.message }, { status: 500 })
      )
    }

    return applyCookies(
      NextResponse.json({
        ok: true,
        deleted: true,
        archived: true,
        childId,
      })
    )
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
