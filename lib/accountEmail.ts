import { z } from "zod"

export type AccountEmailStatus = {
  email: string | null
  pendingEmail: string | null
  canChange: boolean
  synchronised: boolean
}

export const normaliseEmail = (email: string) => email.trim().toLowerCase()

export function validateEmailChange(email: unknown, confirmation: unknown, current: string | null) {
  if (typeof email !== "string" || !z.string().max(254).email().safeParse(email.trim()).success) {
    return "Enter a valid new email address."
  }
  if (typeof confirmation !== "string" || normaliseEmail(email) !== normaliseEmail(confirmation)) {
    return "The email addresses must match."
  }
  if (current && normaliseEmail(email) === normaliseEmail(current)) {
    return "Enter an email address different from your confirmed email."
  }
  return null
}

export function safeAuthNext(raw: string | null) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || /[\\\x00-\x1f]/.test(raw)) {
    return "/reset-password"
  }
  return raw
}

export const EMAIL_CHANGE_CALLBACK = "/auth/callback?flow=email-change"
