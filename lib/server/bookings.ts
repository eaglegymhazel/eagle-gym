import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cache } from 'react'

export type BookingSummary = {
  childId: string
  className: string | null
  weekday: string | null
  startTime: string | null
  endTime: string | null
  durationMinutes: number | null
}

const getActiveBookingsForChildrenCached = cache(
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
        'childId,status,Classes(className,weekday,startTime,endTime,durationMinutes)'
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
  }
)

export async function getActiveBookingsForChildren(
  childIds: string[]
): Promise<Record<string, BookingSummary[]>> {
  const key = childIds.slice().sort().join(',')
  return getActiveBookingsForChildrenCached(key)
}
