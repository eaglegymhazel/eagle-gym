"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import PasswordField from "@/app/components/auth/PasswordField";
import { logAuthValidation } from "@/lib/authValidationDebug";
import { validatePassword } from "@/lib/passwordPolicy";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordValid, setPasswordValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const init = async () => {
      if (typeof window !== "undefined" && window.location.hash) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token });
          window.history.replaceState(
            null,
            "",
            window.location.pathname + window.location.search
          );
        }
      }

      logAuthValidation({
        method: "getSession",
        source: "app/(portal)/reset-password/page.tsx",
      });
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setHasSession(!!data.session);
      setLoading(false);
    };

    init().catch(() => {
      if (!active) return;
      setHasSession(false);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const onRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMsg(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMsg(
      "If an account exists for that email, you'll receive password reset instructions shortly."
    );
  };

  const onReset = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

    const response = await fetch("/api/auth/update-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data?.error ?? "Unable to update password.");
      setSubmitting(false);
      return;
    }

    router.replace("/login");
  };

  return (
    <section className="w-full bg-[#faf7fb] px-6 pb-16 pt-12">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
        <div className="mx-auto h-1 w-16 rounded-full bg-[#6c35c3] shadow-[0_6px_14px_rgba(108,53,195,0.25)]" />
        <h1 className="text-3xl font-black tracking-tight text-[#1f1a25] sm:text-4xl">
          Reset Your Password
        </h1>
        <p className="text-sm font-semibold text-[#2E2A33]/65 sm:text-base">
          {hasSession
            ? "Create a new password to regain access to your account."
            : "Enter your email and we will send you a reset link."}
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-[#e1d7ee] bg-white shadow-[0_18px_42px_rgba(22,12,47,0.1)]">
        <div className="grid grid-cols-1 sm:grid-cols-[18%_82%]">
          <aside
            className="relative min-h-[120px] bg-gradient-to-br from-[#5e2eb0] via-[#5530a8] to-[#3a1f7a] after:pointer-events-none after:absolute after:inset-0 after:bg-black/16"
            aria-hidden="true"
          />
          <div className="p-6 sm:p-8">
            {loading ? (
              <p className="text-sm text-[#2E2A33]/70">Loading...</p>
            ) : hasSession ? (
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

                <button type="submit" className="btn-primary mt-2">
                  Send reset link
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
              </form>
            )}

            {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
            {msg && <p className="mt-4 text-sm text-[#2E2A33]/75">{msg}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
