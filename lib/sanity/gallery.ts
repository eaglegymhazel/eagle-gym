import { groq } from "next-sanity"
import { sanityClient, sanityFetch } from "./client"

export type GalleryCategory =
  | "general"
  | "competitions"
  | "events"
  | "fundraising"
  | "awards"

export type GalleryImageItem = {
  id: string
  title: string
  src: string
  alt: string
  category: GalleryCategory
  width: number
  height: number
  publishedAt: string | null
}

type SanityGalleryImage = {
  _id: string
  title: string
  category?: GalleryCategory
  publishedAt?: string | null
  image?: {
    alt?: string
    asset?: {
      url?: string
      metadata?: {
        dimensions?: {
          width?: number
          height?: number
        }
      }
    }
  }
}

const galleryImagesQuery = groq`*[_type == "galleryImage"] | order(coalesce(displayOrder, 0) asc, coalesce(publishedAt, _createdAt) desc) {
  _id,
  title,
  category,
  publishedAt,
  image{
    alt,
    asset->{
      url,
      metadata{
        dimensions{
          width,
          height
        }
      }
    }
  }
}`

export async function getGalleryImages(): Promise<GalleryImageItem[]> {
  if (!sanityClient) {
    return []
  }

  try {
    const rows = await sanityFetch<SanityGalleryImage[]>({
      query: galleryImagesQuery,
      tags: ["gallery"],
    })
    return (rows ?? [])
      .map((row) => {
        const src = row.image?.asset?.url
        const width = row.image?.asset?.metadata?.dimensions?.width
        const height = row.image?.asset?.metadata?.dimensions?.height

        if (!src || !width || !height) {
          return null
        }

        return {
          id: row._id,
          title: row.title,
          src,
          alt: row.image?.alt?.trim() || row.title,
          category: row.category ?? "general",
          width,
          height,
          publishedAt: row.publishedAt ?? null,
        }
      })
      .filter((row): row is GalleryImageItem => row !== null)
  } catch {
    return []
  }
}
