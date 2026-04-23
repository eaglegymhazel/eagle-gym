import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { unstable_cache } from 'next/cache'

export type ChildSummary = {
  id: string
  firstName: string | null
  lastName: string | null
  dateOfBirth: string | null
  photoConsent: boolean | null
  pickedUp: string | null
  competitionEligible: boolean | null
}

const getChildrenForAccountCached = unstable_cache(
  async (accountId: string): Promise<ChildSummary[]> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const serviceRole = createServerClient(supabaseUrl!, supabaseServiceRoleKey!, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })

  const { data, error } = await serviceRole
    .from('Children')
    .select('id,firstName,lastName,dateOfBirth,photoConsent,pickedUp,competitionEligible')
    .eq('accountId', accountId)
    .or('isArchived.is.null,isArchived.eq.false')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((child) => ({
    id: child.id,
    firstName: child.firstName ?? null,
    lastName: child.lastName ?? null,
    dateOfBirth: child.dateOfBirth ?? null,
    photoConsent: child.photoConsent ?? null,
    pickedUp: child.pickedUp ?? null,
    competitionEligible: child.competitionEligible ?? null,
  }))
  },
  ['children-for-account'],
  { revalidate: 30, tags: ['children-for-account'] }
)

export async function getChildrenForAccount(
  accountId: string
): Promise<ChildSummary[]> {
  return getChildrenForAccountCached(accountId)
}
