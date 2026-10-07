"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/app/components/auth/AuthProvider";
import PasswordField from "@/app/components/auth/PasswordField";
import { validatePassword } from "@/lib/passwordPolicy";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [linkReady, setLinkReady] = useState(false);
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const inFlight = useRef(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const failed = params.has("error") || hash.has("error") || hash.has("error_code");
    const isRecovery = params.get("mode") === "recovery" || hash.get("type") === "recovery";
    setIsRecoveryMode(!failed && isRecovery);
    setTokenHash(!failed && isRecovery ? params.get("token_hash") : null);
    if (failed) setError("This reset link is invalid, expired or already used. Request a new password reset email.");
    setLinkReady(true);
  }, []);

  useEffect(() => {
    if (!linkReady || loading || !user || hasSession || isRecoveryMode || error) return;
    if (typeof window !== "undefined" && window.location.hash) return;
    router.replace("/account");
  }, [error, hasSession, isRecoveryMode, linkReady, loading, router, user]);

  useEffect(() => {
    if (!isRecoveryMode || !user || tokenHash || error || window.location.hash) return;
    setHasSession(true);
  }, [error, isRecoveryMode, tokenHash, user]);

  useEffect(() => {
    let active = true;

    const init = async () => {
      if (typeof window === "undefined" || !window.location.hash) {
        return;
      }

      const params = new URLSearchParams(window.location.hash.slice(1));
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");
      if (!access_token || !refresh_token) {
        return;
      }

      const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
      if (!active) return;
      if (sessionError) {
        setError("This reset link could not be verified. Request a new password reset email.");
        return;
      }
      setHasSession(true);
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    };

    init().catch(() => {
      if (!active) return;
      setHasSession(false);
      setError("This reset link could not be verified. Request a new password reset email.");
    });
    return () => {
      active = false;
    };
  }, []);

  const onRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    setMsg(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/auth/callback?flow=password-recovery`,
        }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setMsg(
        "If an account exists for that email, you'll receive password reset instructions shortly."
      );
    } catch {
      setError("Unable to send reset instructions. Please try again.");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const onReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (inFlight.current) return;
    setError(null);
    setMsg(null);

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError("Password does not meet requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    inFlight.current = true;
    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, ...(tokenHash ? { tokenHash } : {}) }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.error ?? "Unable to update password.");
        if (data?.recoveryVerified) {
          setHasSession(true);
          setTokenHash(null);
          window.history.replaceState(null, "", "/reset-password?mode=recovery");
        }
        if (data?.code === "recovery_link") {
          setTokenHash(null);
          setHasSession(false);
          setIsRecoveryMode(false);
          window.history.replaceState(null, "", "/reset-password");
        }
        return;
      }

      window.history.replaceState(null, "", "/reset-password");
      router.replace("/login?password=updated");
    } catch {
      setError("Unable to update your password. Please try again.");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };
  const canReset = !!tokenHash || hasSession;

  return (
    <section className="w-full bg-[#faf7fb] px-6 pb-16 pt-4 sm:pt-5">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <div className="mx-auto h-1 w-16 rounded-full bg-[#6c35c3] shadow-[0_6px_14px_rgba(108,53,195,0.25)]" />
        <h1 className="text-3xl font-black tracking-tight text-[#1f1a25] sm:text-4xl">
          Reset Your Password
        </h1>
        <p className="text-sm font-semibold text-[#2E2A33]/65 sm:text-base">
          {canReset
            ? "Create a new password to regain access to your account."
            : "Enter your email and we will send you a reset link."}
        </p>
      </div>

      <div className="mx-auto mt-4 w-full max-w-2xl overflow-hidden rounded-2xl border border-[#e1d7ee] bg-white shadow-[0_18px_42px_rgba(22,12,47,0.1)]">
        <div className="p-6 sm:p-8">
          {!linkReady ? <p role="status">Checking reset link…</p> : canReset ? (
            <form className="flex flex-col gap-4" onSubmit={onReset}>
              <PasswordField
                label="New password"
                name="new-password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                placeholder="Enter a new password"
                showRequirements
                onValidityChange={setPasswordValid}
              />

              <PasswordField
                label="Confirm new password"
                name="confirm-password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
                placeholder="Re-enter your new password"
                showRequirements={false}
              />
              {confirmPassword.length > 0 && password !== confirmPassword ? (
                <p className="text-xs text-rose-600">
                  Passwords do not match.
                </p>
              ) : null}

              <button
                type="submit"
                className="btn-primary mt-2"
                disabled={!passwordValid || password !== confirmPassword || submitting}
              >
                Update password
              </button>
            </form>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={onRequest}>
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

              <button type="submit" className="btn-primary mt-2" disabled={submitting}>
                {submitting ? "Sending…" : "Send reset link"}
              </button>

              <p className="-mt-1 text-sm text-[#2E2A33]/70">
                Remembered your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#6c35c3] underline-offset-4 transition hover:underline"
                >
                  Log in
                </Link>
              </p>
              <p className="-mt-2 text-sm text-[#2E2A33]/70">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-[#6c35c3] underline-offset-4 transition hover:underline"
                >
                  Create one
                </Link>
              </p>
            </form>
          )}

          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
          {msg ? (
            <div className="mt-5 border border-[#d8ceeb] bg-[#f7f2ff] px-4 py-4 text-left">
              <p className="text-base font-bold text-[#4f2390]">
                Password reset link sent
              </p>
              <p className="mt-1 text-sm font-medium text-[#2E2A33]/82 sm:text-[15px]">
                {msg}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
