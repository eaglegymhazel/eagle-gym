"use client"

import Link from "next/link"
import { NextStudio } from "next-sanity/studio/client-component"
import config from "@/sanity.config"
import { hasSanityConfig } from "@/lib/sanity/env"

export default function StudioPage() {
  if (!hasSanityConfig) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-3xl border border-[#ded4ef] bg-white p-8 shadow-[0_22px_60px_-40px_rgba(20,10,45,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">
            Eagle Gymnastics Studio
          </p>
          <h1 className="mt-3 text-3xl font-bold text-[#143271]">
            Studio is not configured yet
          </h1>
          <p className="mt-4 text-base leading-8 text-[#2E2A33]/78">
            Add <code>NEXT_PUBLIC_SANITY_PROJECT_ID</code> and{" "}
            <code>NEXT_PUBLIC_SANITY_DATASET</code> to <code>.env.local</code>,
            then restart the app.
          </p>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf7fb]">
      <div className="sticky top-0 z-[70] border-b border-[#d8cde6] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#6c35c3]">
              Eagle Gymnastics Studio
            </p>
            <p className="text-sm font-medium text-[#2E2A33]/72">
              Manage website content
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d8cde6] bg-[#faf7fb] px-5 py-2 text-sm font-semibold text-[#143271] transition hover:-translate-y-0.5 hover:border-[#c7b5e2] hover:bg-white"
          >
            Back to homepage
          </Link>
        </div>
      </div>
      <div className="h-[calc(100vh-73px)]">
        <NextStudio config={config} />
      </div>
    </div>
  )
}
