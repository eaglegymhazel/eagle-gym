"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");
    await new Promise((resolve) => setTimeout(resolve, 400));
    setStatus("sent");
    form.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
          required
          maxLength={80}
          className="mt-1 w-full appearance-none rounded-none border border-[#d8cbe7] bg-white px-4 py-3 text-sm text-[#2E2A33] outline-none transition focus:border-[#143271] focus:ring-2 focus:ring-[#143271]/20"
          placeholder="Your name"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#2E2A33]" htmlFor="email">
          Email (recommended)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          maxLength={120}
          className="mt-1 w-full appearance-none rounded-none border border-[#d8cbe7] bg-white px-4 py-3 text-sm text-[#2E2A33] outline-none transition focus:border-[#143271] focus:ring-2 focus:ring-[#143271]/20"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#2E2A33]" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={2000}
          rows={6}
          className="mt-1 w-full resize-y appearance-none rounded-none border border-[#d8cbe7] bg-white px-4 py-3 text-sm text-[#2E2A33] outline-none transition focus:border-[#143271] focus:ring-2 focus:ring-[#143271]/20"
          placeholder="Tell us what you're looking for (age, experience, preferred days, etc.)"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex min-h-11 w-full items-center justify-center border border-[#143271] bg-[#143271] px-6 py-3 text-sm font-semibold text-[#f9f6fa] transition hover:bg-[#0f2759] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>

      {status === "sent" ? (
        <p className="text-sm font-semibold text-[#1d6a3e]">
          Message sent. Thanks, we&apos;ll get back to you.
        </p>
      ) : null}
    </form>
  );
}
