import type { Metadata } from "next"
import NewsPageClient from "./NewsPageClient"
import { getNewsPosts } from "@/lib/sanity/news"

export const metadata: Metadata = {
  title: "News",
  description:
    "Latest updates, club announcements, and recent stories from Eagle Gymnastics Academy.",
  alternates: {
    canonical: "/news",
  },
}

export default async function NewsPage() {
  const posts = await getNewsPosts()
  return <NewsPageClient posts={posts} />
}
