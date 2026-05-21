"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { NewsPost } from "./data";
import { getExcerpt } from "./data";

const PAGE_SIZE = 6;

export default function NewsPageClient({ posts }: { posts: NewsPost[] }) {
  const [query, setQuery] = useState("");
  const [activeYear, setActiveYear] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const availableYears = useMemo(() => {
    return Array.from(
      new Set(
        posts
          .map((post) => new Date(post.date).getFullYear().toString())
          .filter((year) => year !== "NaN"),
      ),
    ).sort((a, b) => Number(b) - Number(a));
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .filter((post) => {
        if (
          activeYear !== "all" &&
          new Date(post.date).getFullYear().toString() !== activeYear
        ) {
          return false;
        }
        if (!query) return true;
        const haystack = `${post.title} ${post.excerpt ?? ""} ${post.author ?? ""}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      });
  }, [activeYear, posts, query]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const isFiltered = query.trim().length > 0 || activeYear !== "all";

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
      <header className="mb-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">
            Latest Updates
          </p>
          <h1 className="text-4xl font-bold tracking-[-0.02em] text-[#143271] sm:text-5xl">
            Club News
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[#2a0c4f]/80 sm:text-lg">
            Updates, results, announcements, and events.
          </p>
        </div>
        <div className="mt-6">
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
            {availableYears.length ? (
              <select
                value={activeYear}
                onChange={(event) => {
                  setActiveYear(event.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-[#2E2A33] shadow-sm outline-none focus:border-[#6c35c3]"
                aria-label="Filter news by year"
              >
                <option value="all">All years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              {isFiltered ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveYear("all");
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#2E2A33]/70 hover:text-[#2E2A33]"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </header>

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
                        {post.author ? (
                          <span className="text-[#2E2A33]/55">
                            Written by {post.author}
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
