"use client"

import { NextStudio } from "next-sanity/studio/client-component"
import config from "@/sanity.config"
import { hasSanityConfig } from "@/lib/sanity/env"

export default function StudioPage() {
  if (!hasSanityConfig) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-3xl border border-[#ded4ef] bg-white p-8 shadow-[0_22px_60px_-40px_rgba(20,10,45,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">
            Sanity Studio
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

  return <NextStudio config={config} />
}
