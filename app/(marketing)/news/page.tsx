import NewsPageClient from "./NewsPageClient"
import { getNewsPosts } from "@/lib/sanity/news"

export default async function NewsPage() {
  const posts = await getNewsPosts()
  return <NewsPageClient posts={posts} />
}
