import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { unstable_cache } from 'next/cache'
import Stripe from 'stripe'

export type BookingSummary = {
  childId: string
  bookingKind: 'class' | 'summer-camp'
  className: string | null
  weekday: string | null
  startTime: string | null
  endTime: string | null
  durationMinutes: number | null
  campDate: string | null
  createdAt: string | null
}

export type AccountBookingSummary = {
  bookingKind: 'class' | 'summer-camp' | 'birthday-party'
  childId: string | null
  programme: 'recreational' | 'competition' | null
  stripeSubscriptionId: string | null
  className: string | null
  weekday: string | null
  startTime: string | null
  endTime: string | null
  durationMinutes: number | null
  campDate: string | null
  createdAt: string | null
  status: string | null
  partySize: number | null
  totalAmountPence: number | null
  birthdayChildFirstName: string | null
  birthdayChildLastName: string | null
  birthdayChildDateOfBirth: string | null
  slotDate: string | null
}

export type AccountBillingSummary = {
  subscriptionId: string
  programme: 'recreational' | 'competition'
  subscriptionStatus: string | null
  latestInvoiceDate: string | null
  latestInvoicePaidAt: string | null
  latestInvoiceAmountPence: number | null
  nextInvoiceDate: string | null
  nextInvoiceAmountPence: number | null
  currency: string | null
}

const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2026-01-28.clover'
const SUBSCRIPTION_STATUS_PRIORITY: Record<string, number> = {
  active: 5,
  trialing: 4,
  past_due: 3,
  unpaid: 2,
  incomplete: 1,
  canceled: 0,
  incomplete_expired: 0,
  paused: 0,
}

function toIsoDateFromUnix(timestamp: number | null | undefined) {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return null
  return new Date(timestamp * 1000).toISOString()
}

function pickPreferredSubscription(
  current: Stripe.Subscription | null,
  candidate: Stripe.Subscription
) {
  if (!current) return candidate
  const currentScore = SUBSCRIPTION_STATUS_PRIORITY[current.status] ?? -1
  const candidateScore = SUBSCRIPTION_STATUS_PRIORITY[candidate.status] ?? -1
  if (candidateScore !== currentScore) {
    return candidateScore > currentScore ? candidate : current
  }
  return candidate.created > current.created ? candidate : current
}

async function getSubscriptionBillingSummary(
  secretKey: string | null,
  subscriptionId: string,
  programme: 'recreational' | 'competition'
): Promise<AccountBillingSummary | null> {
  if (!secretKey || !subscriptionId) return null

  const stripe = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION })
  let chosenSubscription: Stripe.Subscription | null = null

  try {
    chosenSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice'],
    })
  } catch {
    return null
  }

  const latestInvoice =
    chosenSubscription.latest_invoice &&
    typeof chosenSubscription.latest_invoice !== 'string'
      ? chosenSubscription.latest_invoice
      : null

  let upcomingInvoice: Stripe.Invoice | null = null

  try {
    upcomingInvoice = await stripe.invoices.createPreview({
      customer:
        typeof chosenSubscription.customer === 'string'
          ? chosenSubscription.customer
          : chosenSubscription.customer?.id,
      subscription: chosenSubscription.id,
      preview_mode: 'next',
    })
  } catch {
    upcomingInvoice = null
  }

  const subscriptionCurrentPeriodEnd =
    typeof (chosenSubscription as { current_period_end?: unknown }).current_period_end === 'number'
      ? ((chosenSubscription as unknown as { current_period_end: number }).current_period_end)
      : null

  return {
    subscriptionId,
    programme,
    subscriptionStatus: chosenSubscription.status ?? null,
    latestInvoiceDate: latestInvoice ? toIsoDateFromUnix(latestInvoice.created) : null,
    latestInvoicePaidAt: latestInvoice?.status_transitions?.paid_at
      ? toIsoDateFromUnix(latestInvoice.status_transitions.paid_at)
      : null,
    latestInvoiceAmountPence:
      latestInvoice && typeof latestInvoice.amount_paid === 'number'
        ? latestInvoice.amount_paid
        : latestInvoice && typeof latestInvoice.total === 'number'
          ? latestInvoice.total
          : null,
    nextInvoiceDate:
      upcomingInvoice && 'period_end' in upcomingInvoice
        ? toIsoDateFromUnix(
            typeof upcomingInvoice.period_end === 'number'
              ? upcomingInvoice.period_end
              : subscriptionCurrentPeriodEnd
          )
        : toIsoDateFromUnix(subscriptionCurrentPeriodEnd),
    nextInvoiceAmountPence:
      upcomingInvoice && typeof upcomingInvoice.total === 'number'
        ? upcomingInvoice.total
        : null,
    currency:
      (upcomingInvoice?.currency ?? latestInvoice?.currency ?? chosenSubscription.currency ?? null) ??
      null,
  }
}

const getBillingSummariesForSubscriptionsCached = unstable_cache(
  async (
    subscriptionPairsKey: string
  ): Promise<AccountBillingSummary[]> => {
    if (!subscriptionPairsKey) return []

    const recreationalSecret = process.env.LIVE_REC_STRIPE_SECRET_KEY?.trim() || null
    const competitionSecret = process.env.LIVE_COMP_STRIPE_SECRET_KEY?.trim() || null

    const pairs = subscriptionPairsKey
      .split('|')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const [programme, subscriptionId] = pair.split(':')
        return {
          programme: programme === 'competition' ? 'competition' : 'recreational',
          subscriptionId: subscriptionId?.trim() ?? '',
        } as { programme: 'recreational' | 'competition'; subscriptionId: string }
      })
      .filter((item) => item.subscriptionId)

    const results = await Promise.all(
      pairs.map((item) =>
        getSubscriptionBillingSummary(
          item.programme === 'competition' ? competitionSecret : recreationalSecret,
          item.subscriptionId,
          item.programme
        )
      )
    )

    return results.filter((item): item is AccountBillingSummary => !!item)
  },
  ['billing-summaries-for-subscriptions'],
  { revalidate: 60 }
)

export async function getBillingSummariesForSubscriptions(
  items: Array<{ programme: 'recreational' | 'competition'; subscriptionId: string | null | undefined }>
): Promise<AccountBillingSummary[]> {
  const uniquePairs = Array.from(
    new Set(
      items
        .map((item) => {
          const subscriptionId = item.subscriptionId?.trim() ?? ''
          if (!subscriptionId) return ''
          return `${item.programme}:${subscriptionId}`
        })
        .filter(Boolean)
        .sort()
    )
  )

  if (uniquePairs.length === 0) return []
  return getBillingSummariesForSubscriptionsCached(uniquePairs.join('|'))
}

const getActiveBookingsForChildrenCached = unstable_cache(
  async (childIdsKey: string): Promise<Record<string, BookingSummary[]>> => {
    if (!childIdsKey) {
      return {}
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const serviceRole = createServerClient(
      supabaseUrl!,
      supabaseServiceRoleKey!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {},
        },
      }
    )

    const childIds = childIdsKey.split(',')

    const { data, error } = await serviceRole
      .from('Bookings')
      .select(
        'childId,status,created_at,Classes(className,weekday,startTime,endTime,durationMinutes)'
      )
      .in('childId', childIds)
      .eq('status', 'active')

    if (error) {
      throw new Error(error.message)
    }

    const { data: summerCampData, error: summerCampError } = await serviceRole
      .from('SummerCampBookings')
      .select(
        'childId:"childId",campDate:"campDate",created_at,slug,SummerCampSessions!inner(title,startTime:"startTime",endTime:"endTime")'
      )
      .in('childId', childIds)
      .eq('status', 'active')

    if (summerCampError) {
      throw new Error(summerCampError.message)
    }

    const map: Record<string, BookingSummary[]> = {}
    ;(data ?? []).forEach((row) => {
      const cls = Array.isArray(row.Classes) ? row.Classes[0] : row.Classes
      const booking: BookingSummary = {
        childId: row.childId,
        bookingKind: 'class',
        className: cls?.className ?? null,
        weekday: cls?.weekday ?? null,
        startTime: cls?.startTime ?? null,
        endTime: cls?.endTime ?? null,
        campDate: null,
        createdAt: row.created_at ?? null,
        durationMinutes:
          typeof cls?.durationMinutes === 'number'
            ? cls.durationMinutes
            : cls?.durationMinutes ?? null,
      }
      if (!map[row.childId]) {
        map[row.childId] = []
      }
      map[row.childId].push(booking)
    })

    ;(summerCampData ?? []).forEach((row) => {
      const session = Array.isArray(row.SummerCampSessions)
        ? row.SummerCampSessions[0]
        : row.SummerCampSessions
      const booking: BookingSummary = {
        childId: row.childId,
        bookingKind: 'summer-camp',
        className: session?.title ?? 'Summer Camp 2026',
        weekday: null,
        startTime: session?.startTime ?? null,
        endTime: session?.endTime ?? null,
        durationMinutes: null,
        campDate: row.campDate ?? null,
        createdAt: row.created_at ?? null,
      }
      if (!map[row.childId]) {
        map[row.childId] = []
      }
      map[row.childId].push(booking)
    })

    Object.values(map).forEach((bookings) => {
      bookings.sort((a, b) => {
        const aDate = a.campDate ?? a.createdAt ?? ''
        const bDate = b.campDate ?? b.createdAt ?? ''
        return aDate.localeCompare(bDate)
      })
    })

    return map
  },
  ['active-bookings-for-children'],
  { revalidate: 30 }
)

export async function getActiveBookingsForChildren(
  childIds: string[]
): Promise<Record<string, BookingSummary[]>> {
  const key = childIds.slice().sort().join(',')
  return getActiveBookingsForChildrenCached(key)
}

async function getActiveBookingsForAccountFresh(
  accountId: string,
  childIdsKey: string
): Promise<AccountBookingSummary[]> {
  if (!accountId) {
    return []
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const serviceRole = createServerClient(
    supabaseUrl!,
    supabaseServiceRoleKey!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {},
      },
    }
  )

  const childIds = childIdsKey ? childIdsKey.split(',') : []
  const bookings: AccountBookingSummary[] = []

  if (childIds.length > 0) {
    const { data, error } = await serviceRole
      .from('Bookings')
      .select(
        'childId,status,created_at,bookingType,stripeSubscriptionId,Classes(className,weekday,startTime,endTime,durationMinutes,isCompetitionClass)'
      )
      .in('childId', childIds)
      .eq('status', 'active')

    if (error) {
      throw new Error(error.message)
    }

    const { data: summerCampData, error: summerCampError } = await serviceRole
      .from('SummerCampBookings')
      .select(
        'childId:"childId",campDate:"campDate",status,created_at,slug,SummerCampSessions!inner(title,startTime:"startTime",endTime:"endTime")'
      )
      .in('childId', childIds)
      .eq('status', 'active')

    if (summerCampError) {
      throw new Error(summerCampError.message)
    }

    ;(data ?? []).forEach((row) => {
      const cls = Array.isArray(row.Classes) ? row.Classes[0] : row.Classes
      const programme =
        row.bookingType === 'competition' || cls?.isCompetitionClass === true
          ? 'competition'
          : 'recreational'
      bookings.push({
        bookingKind: 'class',
        childId: row.childId,
        programme,
        stripeSubscriptionId: row.stripeSubscriptionId?.trim() ?? null,
        className: cls?.className ?? null,
        weekday: cls?.weekday ?? null,
        startTime: cls?.startTime ?? null,
        endTime: cls?.endTime ?? null,
        durationMinutes:
          typeof cls?.durationMinutes === 'number'
            ? cls.durationMinutes
            : cls?.durationMinutes ?? null,
        campDate: null,
        createdAt: row.created_at ?? null,
        status: row.status ?? null,
        partySize: null,
        totalAmountPence: null,
        birthdayChildFirstName: null,
        birthdayChildLastName: null,
        birthdayChildDateOfBirth: null,
        slotDate: null,
      })
    })

    ;(summerCampData ?? []).forEach((row) => {
      const session = Array.isArray(row.SummerCampSessions)
        ? row.SummerCampSessions[0]
        : row.SummerCampSessions
      bookings.push({
        bookingKind: 'summer-camp',
        childId: row.childId,
        programme: null,
        stripeSubscriptionId: null,
        className: session?.title ?? 'Summer Camp 2026',
        weekday: null,
        startTime: session?.startTime ?? null,
        endTime: session?.endTime ?? null,
        durationMinutes: null,
        campDate: row.campDate ?? null,
        createdAt: row.created_at ?? null,
        status: row.status ?? null,
        partySize: null,
        totalAmountPence: null,
        birthdayChildFirstName: null,
        birthdayChildLastName: null,
        birthdayChildDateOfBirth: null,
        slotDate: null,
      })
    })
  }

  const { data: birthdayPartyData, error: birthdayPartyError } = await serviceRole
    .from('BirthdayPartyBookings')
    .select(
      'status,created_at,slot_date,start_time,end_time,partySize,totalAmountPence,birthdayChildFirstName,birthdayChildLastName,birthdayChildDateOfBirth'
    )
    .eq('accountId', accountId)
    .in('status', ['pending', 'paid', 'confirmed'])

  if (birthdayPartyError) {
    throw new Error(birthdayPartyError.message)
  }

  ;(birthdayPartyData ?? []).forEach((row) => {
    bookings.push({
      bookingKind: 'birthday-party',
      childId: null,
      programme: null,
      stripeSubscriptionId: null,
      className: 'Birthday Party',
      weekday: null,
      startTime: row.start_time ?? null,
      endTime: row.end_time ?? null,
      durationMinutes: null,
      campDate: null,
      createdAt: row.created_at ?? null,
      status: row.status ?? null,
      partySize:
        typeof row.partySize === 'number' ? row.partySize : row.partySize ?? null,
      totalAmountPence:
        typeof row.totalAmountPence === 'number'
          ? row.totalAmountPence
          : row.totalAmountPence ?? null,
      birthdayChildFirstName: row.birthdayChildFirstName ?? null,
      birthdayChildLastName: row.birthdayChildLastName ?? null,
      birthdayChildDateOfBirth: row.birthdayChildDateOfBirth ?? null,
      slotDate: row.slot_date ?? null,
    })
  })

  bookings.sort((a, b) => {
    const aDate = a.slotDate ?? a.campDate ?? a.createdAt ?? ''
    const bDate = b.slotDate ?? b.campDate ?? b.createdAt ?? ''
    return aDate.localeCompare(bDate)
  })

  return bookings
}

const getActiveBookingsForAccountCached = unstable_cache(
  getActiveBookingsForAccountFresh,
  ['active-bookings-for-account'],
  { revalidate: 30 }
)

export async function getActiveBookingsForAccount(
  accountId: string,
  childIds: string[],
  options: { forceFresh?: boolean } = {}
): Promise<AccountBookingSummary[]> {
  const childIdsKey = childIds.slice().sort().join(',')
  if (options.forceFresh) {
    return getActiveBookingsForAccountFresh(accountId, childIdsKey)
  }
  return getActiveBookingsForAccountCached(accountId, childIdsKey)
}
