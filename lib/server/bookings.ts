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
