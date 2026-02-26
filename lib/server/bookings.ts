import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { unstable_cache } from 'next/cache'

export type BookingSummary = {
  childId: string
  className: string | null
  weekday: string | null
  startTime: string | null
  endTime: string | null
  durationMinutes: number | null
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

    const map: Record<string, BookingSummary[]> = {}
    ;(data ?? []).forEach((row) => {
      const cls = Array.isArray(row.Classes) ? row.Classes[0] : row.Classes
      const booking: BookingSummary = {
        childId: row.childId,
        className: cls?.className ?? null,
        weekday: cls?.weekday ?? null,
        startTime: cls?.startTime ?? null,
        endTime: cls?.endTime ?? null,
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
