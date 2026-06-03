import type { MetadataRoute } from "next";
import { absoluteUrl, siteUrl } from "@/lib/seo";
import { getNewsPosts } from "@/lib/sanity/news";

const staticRoutes = [
  "/",
  "/team",
  "/timetable",
  "/birthday-party",
  "/contact",
  "/news",
  "/gallery",
  "/recreational-events-calendar",
  "/competition-events-calendar",
  "/summer-camps",
  "/summer-camps/2026",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));

  let newsEntries: MetadataRoute.Sitemap = [];

  try {
    const posts = await getNewsPosts();
    newsEntries = posts.map((post) => ({
      url: `${siteUrl}/news/${post.slug}`,
      lastModified: post.date ?? new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    newsEntries = [];
  }

  return [...staticEntries, ...newsEntries];
}
