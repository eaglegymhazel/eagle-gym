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

  const resolvedHeaders = await headers()
  const cookieHeader = resolvedHeaders.get('cookie') ?? ''
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
    requestKey: getServerAuthRequestKey(resolvedHeaders, '/account'),
  })
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    return { status: 'unauthorized' }
  }

  const devImpersonateEmail = process.env.DEV_IMPERSONATE_EMAIL?.trim() || null
  let email = data.user.email

  if (
    process.env.NODE_ENV !== 'production' &&
    devImpersonateEmail
  ) {
    email = devImpersonateEmail
  }

  if (
    process.env.NODE_ENV === 'production' &&
    devImpersonateEmail
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

  const { data: webAccount, error: linkError } = await serviceRole
    .from('web_accounts')
    .select('account_id')
    .eq('auth_user_id', data.user.id)
    .maybeSingle()

  if (linkError) throw new Error(linkError.message)
  const isDevImpersonating = process.env.NODE_ENV !== 'production' && !!devImpersonateEmail
  if (!isDevImpersonating && !webAccount?.account_id) return { status: 'missing' }

  const accountQuery = serviceRole
    .from('Accounts')
    .select(
      'id,email,accFirstName,accLastName,accTelNo,accEmergencyTelNo,accAddress'
    )
  const { data: account, error: accountError } = await (
    isDevImpersonating
      ? accountQuery.ilike('email', email ?? '')
      : accountQuery.eq('id', webAccount!.account_id)
  ).maybeSingle()

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
      email: data.user.email ?? null,
      accFirstName: account.accFirstName ?? null,
      accLastName: account.accLastName ?? null,
      accTelNo: account.accTelNo ?? null,
      accEmergencyTelNo: account.accEmergencyTelNo ?? null,
      accAddress: account.accAddress ?? null,
    },
  }
  }
)
