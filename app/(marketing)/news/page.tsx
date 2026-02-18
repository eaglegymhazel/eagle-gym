"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getExcerpt, newsPosts } from "./data";
import MarketingPageIntro from "@/app/components/marketing/MarketingPageIntro";

const PAGE_SIZE = 6;

export default function NewsPage() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const tags = useMemo(() => {
    const allTags = new Set<string>();
    newsPosts.forEach((post) => post.tags?.forEach((tag) => allTags.add(tag)));
    return ["All", ...Array.from(allTags)];
  }, []);

  const filteredPosts = useMemo(() => {
    return newsPosts
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .filter((post) => {
        if (activeTag !== "All" && !post.tags?.includes(activeTag)) return false;
        if (!query) return true;
        const haystack = `${post.title} ${post.excerpt ?? ""}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      });
  }, [activeTag, query]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const isFiltered = query.trim().length > 0 || activeTag !== "All";

  const groupedPosts = useMemo(() => {
    const groups: { label: string; posts: typeof visiblePosts }[] = [];
    visiblePosts.forEach((post) => {
      const date = new Date(post.date);
      const label = date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
      const lastGroup = groups[groups.length - 1];
      if (!lastGroup || lastGroup.label !== label) {
        groups.push({ label, posts: [post] });
      } else {
        lastGroup.posts.push(post);
      }
    });
    return groups;
  }, [visiblePosts]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <MarketingPageIntro
        eyebrow="Latest Updates"
        title="Club News"
        description="Updates, results, announcements, and events."
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search news"
            className="w-full rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#2E2A33] shadow-sm outline-none focus:border-[#6c35c3] md:w-64"
          />
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              (() => {
                const count =
                  tag === "All"
                    ? filteredPosts.length
                    : filteredPosts.filter((post) =>
                        post.tags?.includes(tag)
                      ).length;
                return (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setActiveTag(tag);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                  activeTag === tag
                    ? "bg-[#6c35c3] text-white"
                    : "bg-white text-[#6c35c3] hover:bg-[#f3ecfb]"
                }`}
              >
                {tag}
                {activeTag === tag && tag !== "All" ? ` (${count})` : ""}
              </button>
                );
              })()
            ))}
            {isFiltered ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveTag("All");
                  setVisibleCount(PAGE_SIZE);
                }}
                className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2E2A33]/70 hover:text-[#2E2A33]"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      </MarketingPageIntro>

      <section className="mt-8 flex flex-col gap-8">
        {groupedPosts.map((group) => (
          <div key={group.label} className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-[#2E2A33]">
                {group.label}
              </h2>
              <div className="h-px w-full bg-black/10" />
            </div>
            <div className="flex flex-col gap-6">
              {group.posts.map((post) => {
                const excerpt = getExcerpt(post);
                return (
                  <Link
                    key={post.slug}
                    href={`/news/${post.slug}`}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3] md:flex-row"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-[#f4effa] via-[#f0f6ff] to-[#f9eaf5] md:w-[36%]">
                      {post.coverImage ? (
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-[0.2em] text-[#6c35c3]/70">
                          Eagle Gymnastics Academy
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-6 md:p-7">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#2E2A33]/70">
                        <span>
                          {new Date(post.date).toLocaleDateString(undefined, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {post.tags?.length ? (
                          <span className="rounded-full bg-[#f3ecfb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6c35c3]">
                            {post.tags[0]}
                          </span>
                        ) : null}
                      </div>
                      <h2 className="text-[1.6rem] font-bold text-[#143271] group-hover:text-[#6c35c3]">
                        {post.title}
                      </h2>
                      <p className="line-clamp-3 text-sm text-[#2E2A33]/70">
                        {excerpt}
                      </p>
                      <span className="mt-auto text-sm font-semibold text-[#6c35c3]">
                        Read more
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {visibleCount < filteredPosts.length ? (
        <div className="mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-[#6c35c3] shadow-sm"
          >
            Load more
          </button>
        </div>
      ) : null}
    </main>
  );
}
