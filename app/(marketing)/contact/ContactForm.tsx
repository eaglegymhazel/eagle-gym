"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    message.trim().length > 0;
  const showNameWarning = attemptedSubmit && name.trim().length === 0;
  const showEmailWarning = attemptedSubmit && email.trim().length === 0;
  const showMessageWarning = attemptedSubmit && message.trim().length === 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAttemptedSubmit(true);
    setSubmitError(null);
    if (!canSubmit || status === "sending") return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const website = String(formData.get("website") || "").trim();
    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          message,
          website,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Unable to send your message right now.");
      }

      setStatus("sent");
      setAttemptedSubmit(false);
      setName("");
      setEmail("");
      setMessage("");
      form.reset();
    } catch (error) {
      setStatus("idle");
      setSubmitError(
        error instanceof Error ? error.message : "Unable to send your message right now."
      );
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div>
        <label className="block text-sm font-semibold text-[#2E2A33]" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={showNameWarning}
          aria-describedby={showNameWarning ? "name-warning" : undefined}
          className={[
            "mt-1 w-full appearance-none rounded-none border bg-white px-4 py-3 text-sm text-[#2E2A33] outline-none transition focus:border-[#143271] focus:ring-2 focus:ring-[#143271]/20",
            showNameWarning ? "border-[#c5315a]" : "border-[#d8cbe7]",
          ].join(" ")}
          placeholder="Your name"
        />
        {showNameWarning ? (
          <p id="name-warning" className="mt-1 text-xs font-semibold text-[#c5315a]">
            * Please provide a name.
          </p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#2E2A33]" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          maxLength={120}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={showEmailWarning}
          aria-describedby={showEmailWarning ? "email-warning" : undefined}
          className={[
            "mt-1 w-full appearance-none rounded-none border bg-white px-4 py-3 text-sm text-[#2E2A33] outline-none transition focus:border-[#143271] focus:ring-2 focus:ring-[#143271]/20",
            showEmailWarning ? "border-[#c5315a]" : "border-[#d8cbe7]",
          ].join(" ")}
          placeholder="you@example.com"
        />
        {showEmailWarning ? (
          <p id="email-warning" className="mt-1 text-xs font-semibold text-[#c5315a]">
            * Please provide an email.
          </p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#2E2A33]" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          maxLength={2000}
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={showMessageWarning}
          aria-describedby={showMessageWarning ? "message-warning" : undefined}
          className={[
            "mt-1 w-full resize-y appearance-none rounded-none border bg-white px-4 py-3 text-sm text-[#2E2A33] outline-none transition focus:border-[#143271] focus:ring-2 focus:ring-[#143271]/20",
            showMessageWarning ? "border-[#c5315a]" : "border-[#d8cbe7]",
          ].join(" ")}
          placeholder="Tell us what you're looking for (age, experience, preferred days, etc.)"
        />
        {showMessageWarning ? (
          <p id="message-warning" className="mt-1 text-xs font-semibold text-[#c5315a]">
            * Please enter a message.
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center border border-[#143271] bg-[#143271] px-6 py-3 text-sm font-semibold text-[#f9f6fa] transition hover:bg-[#0f2759] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>

      {status === "sent" ? (
        <p className="text-sm font-semibold text-[#1d6a3e]">
          Message sent. Thanks, we&apos;ll get back to you.
        </p>
      ) : null}
      {submitError ? (
        <p className="text-sm font-semibold text-[#c5315a]">{submitError}</p>
      ) : null}
    </form>
  );
}
