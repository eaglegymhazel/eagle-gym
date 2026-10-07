import { Suspense } from "react"
import EmailChangeConfirmation from "./EmailChangeConfirmation"

export const metadata = { referrer: "no-referrer", robots: { index: false, follow: false } } as const

export default function EmailChangePage() {
  return <Suspense fallback={<p>Loading confirmation…</p>}><EmailChangeConfirmation /></Suspense>
}
