import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import {
  getServerAuthRequestKey,
  logAuthValidation,
} from '@/lib/authValidationDebug'
import LoginClient from './LoginClient'

export default async function LoginPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
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

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookiesFromHeader
        },
        setAll() {},
      },
    })

    logAuthValidation({
      method: 'getSession',
      source: 'app/(portal)/login/page.tsx',
      requestKey: getServerAuthRequestKey(resolvedHeaders as Headers, '/login'),
    })
    const { data } = await supabase.auth.getSession()

    if (data?.session) {
      redirect('/account')
    }
  }

  return <LoginClient />
}
