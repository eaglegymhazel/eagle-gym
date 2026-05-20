import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { unstable_cache } from 'next/cache'

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

const getActiveBookingsForAccountCached = unstable_cache(
  async (
    accountId: string,
    childIdsKey: string
  ): Promise<AccountBookingSummary[]> => {
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
          'childId:"childId",campDate:"campDate",status,created_at,slug,SummerCampSessions!inner(title,startTime:"startTime",endTime:"endTime")'
        )
        .in('childId', childIds)
        .eq('status', 'active')

      if (summerCampError) {
        throw new Error(summerCampError.message)
      }

      ;(data ?? []).forEach((row) => {
        const cls = Array.isArray(row.Classes) ? row.Classes[0] : row.Classes
        bookings.push({
          bookingKind: 'class',
          childId: row.childId,
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
  },
  ['active-bookings-for-account'],
  { revalidate: 30 }
)

export async function getActiveBookingsForAccount(
  accountId: string,
  childIds: string[]
): Promise<AccountBookingSummary[]> {
  const childIdsKey = childIds.slice().sort().join(',')
  return getActiveBookingsForAccountCached(accountId, childIdsKey)
}
