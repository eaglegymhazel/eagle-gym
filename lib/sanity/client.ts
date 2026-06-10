import { createClient } from "next-sanity"
import { draftMode } from "next/headers"
import { apiVersion, dataset, hasSanityConfig, projectId } from "./env"

export const sanityClient = hasSanityConfig
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
    })
  : null

type SanityFetchOptions = {
  query: string
  params?: Record<string, unknown>
  revalidate?: number | false
  tags?: string[]
}

export async function sanityFetch<T>({
  query,
  params = {},
  revalidate = 300,
  tags = [],
}: SanityFetchOptions): Promise<T> {
  if (!sanityClient) {
    throw new Error("Sanity client is not configured")
  }

  const isDraftMode = (await draftMode()).isEnabled

  return sanityClient.fetch<T>(query, params, {
    perspective: isDraftMode ? "drafts" : "published",
    // Webhook revalidation can run before Sanity's CDN has the new document.
    // Use the live API so Vercel never rebuilds and caches the previous result.
    useCdn: false,
    next: isDraftMode
      ? { revalidate: 0 }
      : {
          revalidate,
          tags,
        },
  })
}
