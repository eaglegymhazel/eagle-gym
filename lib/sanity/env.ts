export const apiVersion = "2026-05-21"

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ""
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? ""
export const studioTitle =
  process.env.NEXT_PUBLIC_SANITY_STUDIO_TITLE ?? "Eagle Gymnastics CMS"

export const hasSanityConfig = Boolean(projectId && dataset)

export const previewSecret = process.env.SANITY_PREVIEW_SECRET ?? ""
