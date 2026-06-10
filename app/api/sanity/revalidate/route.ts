import { revalidatePath, revalidateTag } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"
import { parseBody } from "next-sanity/webhook"
import { webhookSecret } from "@/lib/sanity/env"

type SanityWebhookBody = {
  _type?: string
  slug?: {
    current?: string
  }
}

const documentTagsByType: Record<string, string[]> = {
  newsPost: ["news"],
  galleryImage: ["gallery"],
}

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { message: "Missing SANITY_WEBHOOK_SECRET" },
      { status: 500 }
    )
  }

  const { body, isValidSignature } = await parseBody<SanityWebhookBody>(
    request,
    webhookSecret
  )

  if (!isValidSignature) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 })
  }

  const baseTags = body?._type ? documentTagsByType[body._type] ?? [] : []
  const tags = [...baseTags]

  if (body?._type === "newsPost" && body.slug?.current) {
    tags.push(`news:${body.slug.current}`)
  }

  if (tags.length === 0) {
    return NextResponse.json({
      revalidated: false,
      message: "No matching cache tags for this document type",
    })
  }

  for (const tag of new Set(tags)) {
    revalidateTag(tag, { expire: 0 })
  }

  if (body?._type === "newsPost") {
    revalidatePath("/news")
    if (body.slug?.current) {
      revalidatePath(`/news/${body.slug.current}`)
    }
  }

  if (body?._type === "galleryImage") {
    revalidatePath("/gallery")
  }

  return NextResponse.json({
    revalidated: true,
    tags: [...new Set(tags)],
  })
}
