"use client";

import { useState } from "react";

type Status = "idle" | "sent";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    // For now: don't send anywhere, just show a friendly confirmation.
    setStatus("sent");
    form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Honeypot: should remain empty */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div>
        <label className="block text-sm font-medium text-gray-900" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={80}
          className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-200"
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900" htmlFor="email">
          Email (recommended)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          maxLength={120}
          className="mt-1 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-200"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={2000}
          rows={6}
          className="mt-1 w-full resize-y rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-200"
          placeholder="Tell us what you’re looking for (age, experience, preferred days, etc.)"
        />
      </div>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>

      {status === "sent" && (
        <p className="text-sm font-medium text-emerald-700">
          Message sent. Thanks — we’ll get back to you.
        </p>
      )}

    </form>
  );
}
