import { groq } from "next-sanity"
import { sanityClient, sanityFetch } from "./client"
import type { NewsBodyBlock, NewsPost } from "@/app/(marketing)/news/data"
import { newsPosts } from "@/app/(marketing)/news/data"

type SanityImageRef = {
  asset?: {
    _ref?: string
    url?: string
  }
  alt?: string
}

type SanityNewsPost = {
  title: string
  slug: string
  date: string
  excerpt?: string
  coverImage?: SanityImageRef | null
  author?: string
  body?: unknown[]
  galleryImages?: SanityImageRef[]
}

export type NewsArticle = {
  title: string
  slug: string
  date: string
  excerpt?: string
  coverImage?: string
  author?: string
  body: unknown[]
  galleryImages?: { src: string; alt?: string }[]
}

type NewsGalleryImage = { src: string; alt?: string }

const newsListQuery = groq`*[_type == "newsPost"] | order(coalesce(publishedAt, _createdAt) desc) {
  title,
  "slug": slug.current,
  "date": string(coalesce(publishedAt, _createdAt)),
  excerpt,
  coverImage{
    alt,
    asset->{url}
  },
  author
}`

const newsArticleQuery = groq`*[_type == "newsPost" && slug.current == $slug][0]{
  title,
  "slug": slug.current,
  "date": string(coalesce(publishedAt, _createdAt)),
  excerpt,
  coverImage{
    alt,
    asset->{url}
  },
  author,
  body,
  galleryImages[]{
    alt,
    asset->{url}
  }
}`

function mapNewsListItem(post: SanityNewsPost): NewsPost {
  return {
    title: post.title,
    slug: post.slug,
    date: post.date,
    excerpt: post.excerpt,
    coverImage: post.coverImage?.asset?.url,
    author: post.author,
    body: [],
  }
}

function mapNewsArticle(post: SanityNewsPost): NewsArticle {
  const galleryImages: NewsGalleryImage[] = []

  post.galleryImages?.forEach((image) => {
    if (!image.asset?.url) return
    galleryImages.push({
      src: image.asset.url,
      alt: image.alt ?? undefined,
    })
  })

  return {
    title: post.title,
    slug: post.slug,
    date: post.date,
    excerpt: post.excerpt,
    coverImage: post.coverImage?.asset?.url,
    author: post.author,
    body: post.body ?? [],
    galleryImages,
  }
}

function fallbackArticleFromLocal(post: NewsPost): NewsArticle {
  const body: NewsBodyBlock[] = post.body
  return {
    title: post.title,
    slug: post.slug,
    date: post.date,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    author: post.author,
    body,
    galleryImages: post.galleryImages,
  }
}

export async function getNewsPosts(): Promise<NewsPost[]> {
  if (!sanityClient) {
    return newsPosts
  }

  try {
    const posts = await sanityFetch<SanityNewsPost[]>({
      query: newsListQuery,
      tags: ["news"],
    })
    if (!posts?.length) {
      return newsPosts
    }
    return posts.map(mapNewsListItem)
  } catch {
    return newsPosts
  }
}

export async function getNewsArticleBySlug(slug: string): Promise<NewsArticle | null> {
  const fallback = newsPosts.find((post) => post.slug === slug) ?? null

  if (!sanityClient) {
    return fallback ? fallbackArticleFromLocal(fallback) : null
  }

  try {
    const post = await sanityFetch<SanityNewsPost | null>({
      query: newsArticleQuery,
      params: { slug },
      tags: ["news", `news:${slug}`],
    })

    if (!post) {
      return fallback ? fallbackArticleFromLocal(fallback) : null
    }

    return mapNewsArticle(post)
  } catch {
    return fallback ? fallbackArticleFromLocal(fallback) : null
  }
}
