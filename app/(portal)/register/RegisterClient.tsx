'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import PasswordField from '@/app/components/auth/PasswordField'
import { validatePassword } from '@/lib/passwordPolicy'

export default function RegisterClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [passwordValid, setPasswordValid] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const emailValid = /.+@.+\..+/.test(email)

  const onRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMsg(null)
    setError(null)

    const validation = validatePassword(password)
    if (!validation.isValid) {
      setError('Password does not meet requirements.')
      return
    }

    if (!emailValid) {
      setError('Please enter a valid email address.')
      return
    }

    setSubmitting(true)

    const availability = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (availability.status === 409) {
      const data = await availability.json().catch(() => ({}))
      setError(data?.error ?? 'An account with this email already exists.')
      setSubmitting(false)
      return
    }

    if (!availability.ok) {
      const data = await availability.json().catch(() => ({}))
      setError(data?.error ?? 'Unable to verify email.')
      setSubmitting(false)
      return
    }

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data?.error ?? 'Unable to create account.')
      setSubmitting(false)
      return
    }

    setMsg(
      'Confirmation sent. Please check your email and follow the link to complete registration.'
    )
    setSubmitting(false)
  }

  return (
    <section className="w-full bg-[#faf7fb] px-6 pb-16 pt-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 text-center">
        <div className="mx-auto h-1 w-16 rounded-full bg-[#6c35c3] shadow-[0_6px_14px_rgba(108,53,195,0.25)]" />
        <h1 className="text-3xl font-black tracking-tight text-[#1f1a25] sm:text-4xl">
          Create Your Account
        </h1>
        <p className="text-sm font-medium text-[#2E2A33]/60 sm:text-base">
          Set up your account to book classes and manage your children.
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-[#e1d7ee] bg-white shadow-[0_18px_42px_rgba(22,12,47,0.1)]">
        <div className="grid grid-cols-1 sm:grid-cols-[18%_82%]">
          <aside className="relative min-h-[120px] bg-gradient-to-br from-[#5e2eb0] via-[#5530a8] to-[#3a1f7a] after:pointer-events-none after:absolute after:inset-0 after:bg-black/16" aria-hidden="true" />
          <div className="p-6 sm:p-8">
            <form className="flex flex-col gap-4" onSubmit={onRegister}>
              <div className="flex flex-col">
                <label>Email</label>
                <input
                  className="w-full rounded-xl border border-[#cfc6de] bg-white px-4 py-3.5 text-sm text-[#2E2A33] placeholder:text-[#2E2A33]/55 transition duration-200 focus:border-[#6c35c3]/60 focus:outline-none focus:ring-2 focus:ring-[#6c35c3]/25"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@email.com"
                  type="email"
                  required
                />
              </div>

              <div className="flex flex-col">
                <PasswordField
                  label="Password"
                  name="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  placeholder="Create a secure password"
                  showRequirements
                  onValidityChange={setPasswordValid}
                />
              </div>

              <button
                type="submit"
                className="btn-primary mt-2"
                disabled={!emailValid || !passwordValid || submitting}
              >
                Create account
              </button>

              {error && (
                <p className="text-sm font-bold !text-rose-600">*{error}</p>
              )}
              {msg && <p className="text-sm text-[#2E2A33]/75">{msg}</p>}

              <p className="-mt-1 text-sm text-[#2E2A33]/70">
                Already have an account?{" "}
                <Link
                  href="/login?redirect=/book"
                  className="font-semibold text-[#6c35c3] underline-offset-4 transition hover:underline"
                >
                  Log in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
