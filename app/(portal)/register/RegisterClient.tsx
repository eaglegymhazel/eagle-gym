'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import PasswordField from '@/app/components/auth/PasswordField'
import { validatePassword } from '@/lib/passwordPolicy'

const RESEND_COOLDOWN_SECONDS = 120

export default function RegisterClient() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [registrationEmail, setRegistrationEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [passwordValid, setPasswordValid] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldownUntil, setResendCooldownUntil] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const emailValid = /.+@.+\..+/.test(email)
  const passwordsMatch = password === confirmPassword
  const resendSecondsRemaining =
    resendCooldownUntil == null
      ? 0
      : Math.max(0, Math.ceil((resendCooldownUntil - now) / 1000))

  useEffect(() => {
    if (resendCooldownUntil == null) return
    if (resendCooldownUntil <= now) return

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [now, resendCooldownUntil])

  const onRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setRegistrationEmail(null)
    setError(null)
    setResendMessage(null)

    const validation = validatePassword(password)
    if (!validation.isValid) {
      setError('Password does not meet requirements.')
      return
    }

    if (!emailValid) {
      setError('Please enter a valid email address.')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match.')
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

    const cooldownStartedAt = Date.now()
    setRegistrationEmail(email.trim())
    setNow(cooldownStartedAt)
    setResendCooldownUntil(cooldownStartedAt + RESEND_COOLDOWN_SECONDS * 1000)
    setSubmitting(false)
  }

  const onResendConfirmation = async () => {
    if (!registrationEmail || resendSecondsRemaining > 0 || resending) return

    setError(null)
    setResendMessage(null)
    setResending(true)

    const response = await fetch('/api/auth/resend-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: registrationEmail }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      setError(data?.error ?? 'Unable to resend confirmation email.')
      setResending(false)
      return
    }

    const cooldownStartedAt = Date.now()
    setResendMessage(`A new confirmation email has been sent to ${registrationEmail}.`)
    setNow(cooldownStartedAt)
    setResendCooldownUntil(cooldownStartedAt + RESEND_COOLDOWN_SECONDS * 1000)
    setResending(false)
  }

  return (
    <section className="w-full bg-[#faf7fb] px-6 pb-16 pt-4 sm:pt-5">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 text-center">
        <div className="mx-auto h-1 w-16 rounded-full bg-[#6c35c3] shadow-[0_6px_14px_rgba(108,53,195,0.25)]" />
        <h1 className="text-3xl font-black tracking-tight text-[#1f1a25] sm:text-4xl">
          Create Your Account
        </h1>
        <p className="text-sm font-medium text-[#2E2A33]/60 sm:text-base">
          Set up your account to book classes.
        </p>
      </div>

      <div className="mx-auto mt-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-[#e1d7ee] bg-white shadow-[0_18px_42px_rgba(22,12,47,0.1)]">
        <div className="p-6 sm:p-8">
          {registrationEmail ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-[#d8ceeb] bg-[#f7f2ff] px-5 py-5">
                <p className="text-base font-bold text-[#4f2390]">
                  Thank you for registering
                </p>
                <p className="mt-2 text-sm font-medium leading-7 text-[#2E2A33]/82 sm:text-[15px]">
                  A confirmation email has been sent to <span className="font-semibold text-[#2E2A33]">{registrationEmail}</span>.
                  Please click the link in that email to verify your account sign-up.
                </p>
              </div>

              <div className="space-y-2 text-sm text-[#2E2A33]/72">
                <p>
                  Once your email is confirmed, you can return here and log in to access your account.
                </p>
                <p>
                  If you don&apos;t see the email, check your spam or junk folder.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/login?redirect=/book"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#6c35c3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5f2eb6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/40 focus-visible:ring-offset-2"
                >
                  Go to login
                </Link>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={onResendConfirmation}
                    disabled={resendSecondsRemaining > 0 || resending}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d9cdef] bg-white px-5 py-2.5 text-sm font-semibold text-[#4d2d79] transition hover:bg-[#f8f3ff] disabled:cursor-not-allowed disabled:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/40 focus-visible:ring-offset-2"
                  >
                    {resending ? 'Resending...' : 'Resend confirmation email'}
                  </button>
                  {resendSecondsRemaining > 0 ? (
                    <p className="pl-1 text-xs font-medium text-[#2E2A33]/62">
                      Available again in {resendSecondsRemaining}s
                    </p>
                  ) : null}
                </div>
              </div>

              {resendMessage ? (
                <p className="text-sm font-medium text-[#2E2A33]/78">
                  {resendMessage}
                </p>
              ) : null}
            </div>
          ) : (
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

              <div className="flex flex-col">
                <PasswordField
                  label="Confirm password"
                  name="confirm-password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                />
              </div>

              {confirmPassword && !passwordsMatch ? (
                <p className="-mt-2 text-sm font-semibold text-rose-600">
                  Passwords do not match.
                </p>
              ) : null}

              <button
                type="submit"
                className="btn-primary mt-2"
                disabled={!emailValid || !passwordValid || !passwordsMatch || submitting}
              >
                Create account
              </button>

              {error && (
                <p className="text-sm font-bold !text-rose-600">*{error}</p>
              )}

              <p className="-mt-1 text-sm text-[#2E2A33]/70">
                Already have an account?{" "}
                <Link
                  href="/login?redirect=/book"
                  className="font-semibold text-[#6c35c3] underline-offset-4 transition hover:underline"
                >
                  Log in
                </Link>
              </p>
              <p className="-mt-2 text-sm text-[#2E2A33]/70">
                Forgotten your password?{" "}
                <Link
                  href="/reset-password"
                  className="font-semibold text-[#6c35c3] underline-offset-4 transition hover:underline"
                >
                  Reset it here
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
