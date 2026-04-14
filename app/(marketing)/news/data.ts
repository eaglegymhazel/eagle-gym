export type NewsBodyBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "image"; src: string; alt?: string };

export type NewsPost = {
  title: string;
  slug: string;
  date: string;
  excerpt?: string;
  coverImage?: string;
  body: NewsBodyBlock[];
  tags?: string[];
  author?: string;
  galleryImages?: { src: string; alt?: string }[];
};

export const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

const ensureUniqueSlugs = (posts: NewsPost[]) => {
  const seen = new Map<string, number>();
  return posts.map((post) => {
    const base = normalizeSlug(post.slug);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    if (count === 0) return { ...post, slug: base };
    return { ...post, slug: `${base}-${count + 1}` };
  });
};

export const newsPosts: NewsPost[] = ensureUniqueSlugs([
  {
    title: "A New Chapter Online for Eagle Gymnastics Academy",
    slug: "new-chapter-online-for-eagle-gymnastics-academy",
    date: "2026-04-14",
    excerpt:
      "Introducing the new Eagle Gymnastics Academy website, with clearer information, integrated booking, progress tracking, and a dedicated members area.",
    coverImage: "/brand/img23.JPG",
    tags: ["Announcements"],
    author: "Eagle Gymnastics Academy",
    body: [
      {
        type: "paragraph",
        text: "We're pleased to introduce the new Eagle Gymnastics Academy website - a complete redesign that marks a significant step forward for the club and its members.",
      },
      {
        type: "paragraph",
        text: "The new site has been built from the ground up to better reflect how the club operates today. It is faster, clearer, and designed to make it easier for parents and gymnasts to find the information they need without friction.",
      },
      {
        type: "image",
        src: "/brand/img1.JPG",
        alt: "Eagle Gymnastics Academy training space",
      },
      {
        type: "heading",
        text: "Integrated booking",
      },
      {
        type: "paragraph",
        text: "Parents can now view available classes, select sessions, and complete bookings in a single flow. This reduces manual handling and provides a clearer overview of each gymnast's schedule.",
      },
      {
        type: "heading",
        text: "Progress tracking and members area",
      },
      {
        type: "paragraph",
        text: "Alongside booking, the new system introduces progress tracking for gymnasts, plus a dedicated members area for club-related content, training videos, guidance material, and additional resources.",
      },
      {
        type: "paragraph",
        text: "Overall, the new website is designed to support both the day-to-day running of the club and the long-term development of its members.",
      },
    ],
    galleryImages: [
      { src: "/brand/img13.webp", alt: "Gymnastics class session" },
      { src: "/brand/img15.webp", alt: "Gymnastics training" },
      { src: "/brand/img20.JPG", alt: "Gymnasts at Eagle Gymnastics Academy" },
    ],
  },
]);

export const getExcerpt = (post: NewsPost) => {
  if (post.excerpt) return post.excerpt;
  const firstParagraph = post.body.find((block) => block.type === "paragraph");
  const text =
    firstParagraph && "text" in firstParagraph ? firstParagraph.text : "";
  const stripped = text.replace(/\s+/g, " ").trim();
  return stripped.length > 200 ? `${stripped.slice(0, 200)}...` : stripped;
};
