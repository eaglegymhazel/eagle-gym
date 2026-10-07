import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

export function createAuthRouteClient(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error("Supabase is not configured.")

  const cookiesToPersist: Array<{ name: string; value: string; options?: CookieOptions }> = []
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach((cookie) => {
          request.cookies.set(cookie.name, cookie.value)
          cookiesToPersist.push(cookie)
        })
      },
    },
  })
  const applyCookies = (response: NextResponse) => {
    cookiesToPersist.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
    response.headers.set("Cache-Control", "no-store")
    return response
  }
  return { supabase, applyCookies }
}
