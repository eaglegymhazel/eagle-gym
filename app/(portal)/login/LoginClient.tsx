'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [msgType, setMsgType] = useState<'error' | 'success' | null>(null)
  const router = useRouter()

  const onLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMsg(null)
    setMsgType(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMsg('Incorrect email or password. Please try again.')
      setMsgType('error')
    } else {
      router.push('/account')
    }
  }

  const onLogout = async () => {
    setMsg(null)
    await supabase.auth.signOut()
    setMsg('Logged out.')
  }

  return (
    <section className="w-full bg-[#faf7fb] px-6 pb-16 pt-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 text-center">
        <div className="mx-auto h-1 w-16 rounded-full bg-[#6c35c3] shadow-[0_6px_14px_rgba(108,53,195,0.25)]" />
        <h1 className="text-3xl font-black tracking-tight text-[#1f1a25] sm:text-4xl">
          Welcome Back
        </h1>
        <p className="text-sm font-medium text-[#2E2A33]/60 sm:text-base">
          Log in to book classes and manage your children.
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-[#e1d7ee] bg-white shadow-[0_18px_42px_rgba(22,12,47,0.1)]">
        <div className="grid grid-cols-1 sm:grid-cols-[18%_82%]">
          <aside className="relative min-h-[120px] bg-gradient-to-br from-[#5e2eb0] via-[#5530a8] to-[#3a1f7a] after:pointer-events-none after:absolute after:inset-0 after:bg-black/16" aria-hidden="true" />
          <div className="p-6 sm:p-8">
        <form className="flex flex-col gap-4" onSubmit={onLogin}>
            <div className="flex flex-col">
              <label>Email</label>
              <input
                className="w-full rounded-xl border border-[#cfc6de] bg-white px-4 py-3.5 text-sm text-[#2E2A33] placeholder:text-[#2E2A33]/55 transition duration-200 focus:border-[#6c35c3]/60 focus:outline-none focus:ring-2 focus:ring-[#6c35c3]/25"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@email.com"
              />
            </div>

            <div className="flex flex-col">
              <label>Password</label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-[#cfc6de] bg-white px-4 py-3.5 pr-12 text-sm text-[#2E2A33] placeholder:text-[#2E2A33]/55 transition duration-200 focus:border-[#6c35c3]/60 focus:outline-none focus:ring-2 focus:ring-[#6c35c3]/25"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#5b5264] transition hover:text-[#2E2A33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/35"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0112 20C7 20 2.73 16.89 1 12c.73-2.03 2.07-3.8 3.86-5.1M9.9 4.24A10.87 10.87 0 0112 4c5 0 9.27 3.11 11 8a11.05 11.05 0 01-2.51 4.06M14.12 14.12a3 3 0 01-4.24-4.24" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary mt-2">
              Log in
            </button>

            <div
              className={[
                'overflow-hidden rounded-xl border border-[#f2c6cf] bg-[#fdf2f4] bg-clip-padding shadow-[0_6px_14px_rgba(143,45,61,0.1)] transition-all duration-200',
                msgType === 'error'
                  ? 'mt-2 max-h-40 opacity-100'
                  : 'max-h-0 opacity-0 pointer-events-none',
              ].join(' ')}
              aria-live="polite"
            >
              <div className="flex w-full items-start gap-3 px-4 py-3 text-sm !text-rose-700">
                <span
                  className="mt-0.5 inline-flex h-5 w-5 items-center justify-center text-[#b24a5c]"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M12 2.5c5.25 0 9.5 4.25 9.5 9.5s-4.25 9.5-9.5 9.5-9.5-4.25-9.5-9.5S6.75 2.5 12 2.5zm0 5.1c-.62 0-1.12.5-1.12 1.12v4.68c0 .62.5 1.12 1.12 1.12s1.12-.5 1.12-1.12V8.72c0-.62-.5-1.12-1.12-1.12zm0 9.16a1.3 1.3 0 100-2.6 1.3 1.3 0 000 2.6z" />
                  </svg>
                </span>
                <div className="flex flex-1 flex-col gap-2">
                  <p>{msg}</p>
                  <Link
                    href="/reset-password"
                    className="w-fit font-semibold text-[#6c35c3] underline-offset-4 transition hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>
            </div>

            {msgType === 'success' && (
              <p className="text-sm text-[#2E2A33]/75">{msg}</p>
            )}

            <p className="-mt-1 text-sm text-[#2E2A33]/70">
              Forgot your password?{' '}
              <Link
                href="/reset-password"
                className="font-semibold text-[#6c35c3] underline-offset-4 transition hover:underline"
              >
                Reset it
              </Link>
            </p>

            <p className="-mt-1 text-sm text-[#2E2A33]/70">
              Don&apos;t have an account?{' '}
              <Link
                href="/register?redirect=/book"
                className="font-semibold text-[#6c35c3] underline-offset-4 transition hover:underline"
              >
                Create one
              </Link>
            </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
