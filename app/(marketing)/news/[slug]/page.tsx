import type { Metadata } from "next"
import Link from "next/link"
import { PortableText } from "@portabletext/react"
import type { TypedObject } from "@portabletext/types"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getNewsArticleBySlug } from "@/lib/sanity/news"
import { urlForImage } from "@/lib/sanity/image"
import ArticleLightboxImage from "../ArticleLightboxImage"
import { absoluteUrl } from "@/lib/seo"

type PortableImageValue = {
  asset?: {
    _ref?: string
    url?: string
  }
  alt?: string
}

const portableTextComponents = {
  block: {
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-2xl font-bold text-[#143271]">{children}</h2>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-base leading-8 text-[#2E2A33]/78">{children}</p>
    ),
  },
  list: {
    bullet: ({ children }: { children?: React.ReactNode }) => (
      <ul className="space-y-2 pl-5 text-sm text-[#2E2A33]/80 marker:text-[#6c35c3]">
        {children}
      </ul>
    ),
  },
  types: {
    image: ({ value }: { value: PortableImageValue }) => {
      const src =
        value?.asset?.url ??
        urlForImage(value)?.width(1600).fit("max").auto("format").url() ??
        null
      if (!src) return null

      return (
        <figure className="pt-2">
          <ArticleLightboxImage
            src={src}
            alt={value.alt ?? "News article image"}
            wrapperClassName="relative aspect-[16/9] overflow-hidden rounded-lg bg-[#eee7f1]"
            sizes="(max-width: 896px) 100vw, 896px"
          />
          {value.alt ? (
            <figcaption className="mt-2 text-sm text-[#2E2A33]/60">
              {value.alt}
            </figcaption>
          ) : null}
        </figure>
      )
    },
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getNewsArticleBySlug(slug)

  if (!article) {
    return {
      title: "News Article",
      alternates: {
        canonical: `/news/${slug}`,
      },
    }
  }

  return {
    title: article.title,
    description: article.excerpt ?? `Read ${article.title} from Eagle Gymnastics Academy.`,
    alternates: {
      canonical: `/news/${article.slug}`,
    },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt ?? `Read ${article.title} from Eagle Gymnastics Academy.`,
      url: absoluteUrl(`/news/${article.slug}`),
      publishedTime: article.date,
      images: article.coverImage ? [{ url: article.coverImage, alt: article.title }] : undefined,
    },
  }
}

function renderLegacyBody(body: unknown[]) {
  return body.map((block, index) => {
    const legacyBlock = block as
      | { type: "paragraph"; text: string }
      | { type: "heading"; text: string }
      | { type: "list"; items: string[] }
      | { type: "image"; src: string; alt?: string }

    if (legacyBlock.type === "heading") {
      return (
        <h2 key={`heading-${index}`} className="text-2xl font-bold text-[#143271]">
          {legacyBlock.text}
        </h2>
      )
    }

    if (legacyBlock.type === "paragraph") {
      return (
        <p key={`paragraph-${index}`} className="text-base leading-8 text-[#2E2A33]/78">
          {legacyBlock.text}
        </p>
      )
    }

    if (legacyBlock.type === "list") {
      return (
        <ul
          key={`list-${index}`}
          className="space-y-2 pl-5 text-sm text-[#2E2A33]/80 marker:text-[#6c35c3]"
        >
          {legacyBlock.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )
    }

    if (legacyBlock.type === "image") {
      return (
        <figure key={`image-${index}`} className="pt-2">
          <ArticleLightboxImage
            src={legacyBlock.src}
            alt={legacyBlock.alt ?? "News article image"}
            wrapperClassName="relative aspect-[16/9] overflow-hidden rounded-lg bg-[#eee7f1]"
            sizes="(max-width: 896px) 100vw, 896px"
          />
          {legacyBlock.alt ? (
            <figcaption className="mt-2 text-sm text-[#2E2A33]/60">
              {legacyBlock.alt}
            </figcaption>
          ) : null}
        </figure>
      )
    }

    return null
  })
}

function isPortableText(body: unknown[]) {
  return body.some(
    (block) =>
      typeof block === "object" &&
      block !== null &&
      "_type" in block &&
      typeof (block as { _type?: unknown })._type === "string"
  )
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getNewsArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 rounded-full border border-[#d9cfee] px-4 py-2 text-sm font-semibold text-[#6c35c3] transition-colors hover:bg-[#f5effd]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to News</span>
        </Link>
      </div>

      <header className="space-y-4">
        <div className="space-y-2">
          <h1>{article.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#2E2A33]/70">
            <span>
              {new Date(article.date).toLocaleDateString(undefined, {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
            {article.author ? <span>Written by {article.author}</span> : null}
          </div>
          {article.excerpt ? (
            <p className="text-base text-[#2E2A33]/70">{article.excerpt}</p>
          ) : null}
        </div>
        {article.coverImage ? (
          <ArticleLightboxImage
            src={article.coverImage}
            alt={article.title}
            wrapperClassName="relative aspect-[16/9] max-h-[360px] overflow-hidden rounded-lg bg-[#eee7f1]"
            imageClassName="object-cover object-top"
            sizes="(max-width: 896px) 100vw, 896px"
            priority
          />
        ) : null}
      </header>

      <article className="mt-8 space-y-10 text-[#2E2A33]">
        {isPortableText(article.body) ? (
          <PortableText
            value={article.body as TypedObject[]}
            components={portableTextComponents}
          />
        ) : (
          renderLegacyBody(article.body)
        )}

        {article.galleryImages?.length ? (
          <section className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {article.galleryImages.map((image) => (
                <figure key={image.src} className="space-y-2">
                  <ArticleLightboxImage
                    src={image.src}
                    alt={image.alt ?? article.title}
                    wrapperClassName="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#eee7f1]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                  {image.alt ? (
                    <figcaption className="text-sm text-[#2E2A33]/60">
                      {image.alt}
                    </figcaption>
                  ) : null}
                </figure>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  )
}
