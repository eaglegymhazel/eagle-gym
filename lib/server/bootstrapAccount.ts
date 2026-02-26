import 'server-only'

import { headers } from 'next/headers'
import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import {
  getServerAuthRequestKey,
  logAuthValidation,
} from '../authValidationDebug'

export type BootstrapAccountResult =
  | { status: 'unauthorized' }
  | { status: 'missing' }
  | {
      status: 'existing'
      account: {
        id: string
        email: string | null
        accFirstName: string | null
        accLastName: string | null
        accTelNo: string | null
        accEmergencyTelNo: string | null
        accAddress: string | null
      }
    }

export const getBootstrapAccount = cache(
  async (): Promise<BootstrapAccountResult> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return { status: 'unauthorized' }
  }

  const headersList = headers()
  const resolvedHeaders =
    typeof (headersList as unknown as Promise<Headers>).then === 'function'
      ? await (headersList as Promise<Headers>)
      : (headersList as Headers)
  const cookieHeader =
    typeof (resolvedHeaders as Headers).get === 'function'
      ? resolvedHeaders.get('cookie') ?? ''
      : ''
  let cookiesFromHeader: Array<{ name: string; value: string }> = []

  if (cookieHeader) {
    cookiesFromHeader = cookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf('=')
        const name = index >= 0 ? part.slice(0, index) : part
        const value = index >= 0 ? part.slice(index + 1) : ''
        return { name, value }
      })
  }

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookiesFromHeader
      },
      setAll() {},
    },
  })

  logAuthValidation({
    method: 'getUser',
    source: 'lib/server/bootstrapAccount.ts',
    requestKey: getServerAuthRequestKey(resolvedHeaders as Headers, '/account'),
  })
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    return { status: 'unauthorized' }
  }

  let email = data.user.email

  if (
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_IMPERSONATE_EMAIL
  ) {
    email = process.env.DEV_IMPERSONATE_EMAIL
  }

  if (
    process.env.NODE_ENV === 'production' &&
    process.env.DEV_IMPERSONATE_EMAIL
  ) {
    throw new Error('DEV_IMPERSONATE_EMAIL must not be set in production')
  }

  const serviceRole = createServerClient(supabaseUrl!, supabaseServiceRoleKey!, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })

  const { data: account, error: accountError } = await serviceRole
    .from('Accounts')
    .select(
      'id,email,accFirstName,accLastName,accTelNo,accEmergencyTelNo,accAddress'
    )
    .eq('email', email)
    .maybeSingle()

  if (accountError) {
    throw new Error(accountError.message)
  }

  if (!account?.id) {
    return { status: 'missing' }
  }

  return {
    status: 'existing',
    account: {
      id: account.id,
      email: account.email ?? null,
      accFirstName: account.accFirstName ?? null,
      accLastName: account.accLastName ?? null,
      accTelNo: account.accTelNo ?? null,
      accEmergencyTelNo: account.accEmergencyTelNo ?? null,
      accAddress: account.accAddress ?? null,
    },
  }
  }
)
