"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { supabase } from "@/lib/supabaseClient"
import { validateEmailChange, type AccountEmailStatus } from "@/lib/accountEmail"
import styles from "../account.module.css"

export default function AccountEmailPanel({ initialEmail, disabled, onConfirmed }: {
  initialEmail: string | null
  disabled: boolean
  onConfirmed: () => Promise<void>
}) {
  const [status, setStatus] = useState<AccountEmailStatus | null>(null)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [signedOut, setSignedOut] = useState(false)
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkMessage, setCheckMessage] = useState<string | null>(null)
  const inFlight = useRef(false)
  const refreshing = useRef(false)
  const requestVersion = useRef(0)
  const expectedEmail = useRef<string | null>(null)
  const confirmedEmail = useRef(initialEmail)
  const onConfirmedRef = useRef(onConfirmed)
  onConfirmedRef.current = onConfirmed

  const acceptStatus = useCallback(async (next: AccountEmailStatus) => {
    const changed = confirmedEmail.current !== next.email
    const completed = changed && !next.pendingEmail && next.synchronised && expectedEmail.current === next.email
    confirmedEmail.current = next.email
    if (next.pendingEmail) expectedEmail.current = next.pendingEmail
    setStatus(next)
    setSignedOut(false)
    if (!next.pendingEmail) setCheckMessage(null)
    if (completed) {
      expectedEmail.current = null
      setSuccess(`Your account email has changed to ${next.email}.`)
      setOpen(false)
      setEmail("")
      setConfirmation("")
      // Refresh stale token/session claims after confirmation on another device.
      await supabase.auth.refreshSession()
      await onConfirmedRef.current()
    } else if (changed) {
      setSuccess(null)
      await supabase.auth.refreshSession()
      await onConfirmedRef.current()
    }
  }, [])

  const refresh = useCallback(async () => {
    if (refreshing.current || inFlight.current) return
    refreshing.current = true
    setChecking(true)
    const version = requestVersion.current
    try {
      const response = await fetch("/api/account/email", { credentials: "include", cache: "no-store" })
      const result = await response.json()
      if (inFlight.current || version !== requestVersion.current) return
      if (response.status === 401) {
        setCheckMessage(null)
        setSignedOut(true)
        setStatus(null)
        setSuccess(null)
        setError("Please sign in to check or change your account email.")
      } else if (!response.ok) {
        setCheckMessage(null)
        setError(result.error ?? "Unable to check your confirmed email.")
      } else {
        setError(null)
        await acceptStatus(result)
        return result as AccountEmailStatus
      }
    } catch {
      setCheckMessage(null)
      setError("Unable to check your confirmed email. Please try again.")
    } finally {
      refreshing.current = false
      setChecking(false)
    }
  }, [acceptStatus])

  const checkConfirmationStatus = async () => {
    setCheckMessage(null)
    const next = await refresh()
    if (next?.pendingEmail) {
      setCheckMessage("Still waiting for confirmation. Please confirm the links in both your current and new email inboxes. If you have already clicked one, confirm the other to complete the change.")
    }
  }

  useEffect(() => {
    void refresh()
    const visible = () => { if (document.visibilityState === "visible") void refresh() }
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", visible)
    return () => {
      window.removeEventListener("focus", refresh)
      document.removeEventListener("visibilitychange", visible)
    }
  }, [refresh])

  useEffect(() => {
    if (!status?.pendingEmail) return
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh() }, 15000)
    return () => window.clearInterval(timer)
  }, [status?.pendingEmail, refresh])

  const requestChange = async (nextEmail: string, matchingEmail: string) => {
    if (inFlight.current) return
    const validationError = validateEmailChange(nextEmail, matchingEmail, status?.email ?? initialEmail)
    if (validationError) { setError(validationError); return }
    inFlight.current = true
    requestVersion.current += 1
    setBusy(true)
    setError(null)
    setSuccess(null)
    setCheckMessage(null)
    try {
      const response = await fetch("/api/account/email", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nextEmail, confirmation: matchingEmail }),
      })
      const result = await response.json()
      if (!response.ok) {
        if (response.status === 401) setSignedOut(true)
        throw new Error(result.error ?? "Unable to request an email change.")
      }
      await acceptStatus(result)
      setOpen(false)
      setEmail("")
      setConfirmation("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request an email change.")
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void requestChange(email, confirmation)
  }
  const unavailable = disabled || busy || signedOut || !status?.canChange

  return (
    <section className={styles.accountEmail} aria-label="Account email">
      <dl className={styles.details}>
        <div className={styles.detailRow}>
          <dt>Account email</dt>
          <dd>
            <div className={styles.emailSummary}>
              <span className={styles.confirmedEmail}>{status?.email ?? initialEmail ?? "Unavailable"}</span>
              <button type="button" className={styles.emailButton} disabled={unavailable}
                aria-expanded={open} aria-controls="account-email-form"
                onClick={() => { setOpen(!open); setError(null); setSuccess(null) }}>
                Change account email
              </button>
            </div>
          </dd>
        </div>
      </dl>
      {disabled && <p className={styles.emailNotice}>Email changes are unavailable while viewing another account.</p>}
      {status?.pendingEmail && <div className={styles.emailInstructions} role="status">
        <p>A change to <strong>{status.pendingEmail}</strong> is pending. Confirm the emails sent to both your current and new addresses. Your confirmed account email stays unchanged until both are confirmed. You can stay signed in.</p>
        <div className={styles.emailButtons}>
          <button type="button" className={styles.emailButton} disabled={unavailable}
            onClick={() => void requestChange(status.pendingEmail!, status.pendingEmail!)}>
            {busy ? "Sending…" : "Send confirmation emails again"}
          </button>
          <button type="button" className={styles.emailButton} disabled={busy || checking} aria-busy={checking}
            onClick={() => void checkConfirmationStatus()}>
            {checking ? "Checking…" : "Check confirmation status"}
          </button>
        </div>
        {checkMessage && <p className={styles.emailCheckMessage} role="status">{checkMessage}</p>}
      </div>}
      {open && <form id="account-email-form" className={styles.emailForm} onSubmit={submit}>
        <div className={styles.emailField}>
          <label htmlFor="account-new-email">New email address</label>
          <input id="account-new-email" name="email" type="email" autoComplete="email" required maxLength={254}
            className={styles.detailInput} value={email} disabled={busy} aria-describedby="account-email-help" onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div className={styles.emailField}>
          <label htmlFor="account-confirm-email">Confirm new email address</label>
          <input id="account-confirm-email" name="confirmation" type="email" autoComplete="off" required maxLength={254}
            className={styles.detailInput} value={confirmation} disabled={busy} aria-describedby="account-email-help" onChange={(event) => setConfirmation(event.target.value)} />
        </div>
        <p id="account-email-help" className={styles.emailHelp}>You will need to confirm this change from both email addresses.</p>
        <div className={styles.emailButtons}>
          <button type="submit" className={`${styles.emailButton} ${styles.emailSubmit}`} disabled={unavailable}>
            {busy ? "Sending…" : "Send confirmation emails"}
          </button>
          <button type="button" className={`${styles.emailButton} ${styles.emailCancel}`} disabled={busy} onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </form>}
      {error && <p className={`${styles.detailSaveError} ${styles.emailNotice}`} role="alert">{error}</p>}
      {signedOut && <Link className={styles.emailNotice} href="/login?redirect=%2Faccount%3Ftab%3Ddetails">Sign in</Link>}
      {success && <p className={`${styles.detailSaveSuccess} ${styles.emailNotice}`} role="status">{success}</p>}
    </section>
  )
}
