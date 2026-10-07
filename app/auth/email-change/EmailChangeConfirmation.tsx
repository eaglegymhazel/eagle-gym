"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

type ConfirmationState = "ready" | "partial" | "confirmed" | "check" | "error"

export default function EmailChangeConfirmation() {
  const params = useSearchParams()
  const tokenHash = params.get("token_hash")
  const code = params.get("code")
  const [state, setState] = useState<ConfirmationState>(
    params.get("error") || params.get("error_code") ? "error" : tokenHash || code ? "ready" : "check"
  )
  const [email, setEmail] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const inFlight = useRef(false)

  const confirm = async () => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    try {
      const response = await fetch("/auth/callback", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenHash, code }),
      })
      const result = await response.json()
      if (!response.ok || !["partial", "confirmed", "check"].includes(result.status)) {
        setState("error")
      } else {
        setState(result.status)
        setEmail(result.status === "confirmed" ? result.email : null)
      }
      window.history.replaceState(null, "", "/auth/email-change")
    } catch {
      setState("error")
    } finally {
      setBusy(false)
      inFlight.current = false
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Confirm account email change</h1>
      <div className="mt-6 space-y-4" role={state === "error" ? "alert" : "status"}>
        {state === "ready" && <>
          <p>Confirm this address for your requested account email change. Both your current and new email addresses must be confirmed.</p>
          <button type="button" onClick={confirm} disabled={busy} className="rounded-xl bg-purple-700 px-5 py-3 text-white disabled:opacity-50">
            {busy ? "Confirming…" : "Confirm email change"}
          </button>
        </>}
        {state === "partial" && <p>This address has been confirmed. Open the confirmation email sent to the other address to finish. Your confirmed account email remains unchanged until both confirmations are complete.</p>}
        {state === "confirmed" && <p>Your account email has changed to <strong>{email}</strong>. You can sign in with this address and your existing password.</p>}
        {state === "check" && <p>Check Account Details for your confirmed account email. If a change is pending, confirm the links sent to both addresses. Sign in to check your account if needed.</p>}
        {state === "error" && <p>This link could not be verified. It may be invalid, expired or already used, or the account update could not complete. Check Account Details first. If the change is still pending, request fresh confirmation emails there. For older links opened on another device, try the browser where you requested the change.</p>}
      </div>
      <div className="mt-8 flex flex-wrap gap-5">
        <Link className="text-purple-700 underline" href="/account?tab=details">Account Details</Link>
        <Link className="text-purple-700 underline" href="/login?redirect=%2Faccount%3Ftab%3Ddetails">Sign in</Link>
      </div>
    </main>
  )
}
