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
    title: "Grades Competition 2025",
    slug: "grades-competition-2025",
    date: "2025-03-15",
    excerpt:
      "Two of our gymnasts competed in their Performance 2 grade in March 2025 and delivered great results across range & conditioning and overall scores.",
    coverImage: "/brand/banner2.png",
    tags: ["Competitions"],
    author: "Eagle Gymnastics Academy",
    body: [
      {
        type: "paragraph",
        text: "We had two gymnasts who competed in their Performance 2 grade in March 2025. It was a strong showing with confident routines and great composure on the floor.",
      },
      { type: "heading", text: "Results" },
      {
        type: "list",
        items: [
          "Charlotte Gorrie - Joint 10th on Range & Conditioning; 15th overall with 59.400",
          "Thea Fraser - 16th overall with 59.250",
        ],
      },
      {
        type: "image",
        src: "/brand/banner3.png",
        alt: "Gymnastics competition in action",
      },
      {
        type: "paragraph",
        text: "We are proud of the progress both gymnasts have made this season and the positive spirit they brought to the competition floor.",
      },
    ],
    galleryImages: [
      { src: "/brand/banner.png", alt: "Training session" },
      { src: "/brand/banner4.png", alt: "Team warm-up" },
    ],
  },
  {
    title: "March Skills Focus Week",
    slug: "march-skills-focus-week",
    date: "2025-03-24",
    excerpt:
      "A focused week of skill stations to build confidence on bars, beam, and floor while keeping sessions fun and structured.",
    coverImage: "/brand/News/medals4.png",
    tags: ["Events"],
    body: [
      {
        type: "paragraph",
        text: "March Skills Focus Week is all about strengthening fundamentals and building confidence across the core events. Sessions will rotate through stations for bars, beam, and floor so gymnasts can get extra repetitions with coach feedback.",
      },
      {
        type: "paragraph",
        text: "We will keep groups small and the pace steady, with a focus on clean shapes, safe landings, and controlled movement. This week is ideal for gymnasts who want a structured boost without changing their regular timetable.",
      },
      {
        type: "paragraph",
        text: "Parents can expect the usual class times with an added emphasis on progressions and technique. If you have any questions about your gymnast's level or readiness, speak to a coach before the session.",
      },
    ],
  },
  {
    title: "Parent Viewing Evening",
    slug: "parent-viewing-evening",
    date: "2025-03-20",
    excerpt:
      "Join us for a relaxed viewing evening to see class progress and celebrate recent improvements.",
    coverImage: "/brand/News/premises2.png",
    tags: ["Announcements"],
    body: [
      {
        type: "paragraph",
        text: "We are opening a short parent viewing evening in March so families can see the gymnasts' progress in a relaxed setting. Coaches will guide the class as normal while highlighting key focus areas and recent achievements.",
      },
      {
        type: "paragraph",
        text: "This is not a performance night, but rather a chance to observe how skills are taught and how routines are developed. We encourage a calm environment so gymnasts can stay focused and comfortable.",
      },
      {
        type: "paragraph",
        text: "Spaces in the viewing area are limited, so please arrive a few minutes early. If you have any questions afterward, coaches will be available for a short Q&A.",
      },
    ],
  },
  {
    title: "Spring Term Progress Update",
    slug: "spring-term-progress-update",
    date: "2025-03-05",
    excerpt:
      "A quick update on our spring term goals, including conditioning targets and skill progressions.",
    coverImage: "/brand/News/medals3.png",
    tags: ["Recreational"],
    body: [
      {
        type: "paragraph",
        text: "As we move through the spring term, gymnasts are showing strong progress in conditioning, flexibility, and core control. These foundations support safer skill development and more confident movement.",
      },
      {
        type: "paragraph",
        text: "Our recreational groups are focusing on clean body shapes and consistent landings, while intermediate groups are preparing for more complex combinations. Coaches are emphasizing quality over speed to keep learning steady and safe.",
      },
      {
        type: "paragraph",
        text: "Thank you for supporting attendance and at-home practice. Small, regular efforts make a big difference over the term.",
      },
    ],
  },
  {
    title: "Half Term Training Schedule",
    slug: "half-term-training-schedule",
    date: "2025-02-10",
    excerpt:
      "A short, focused timetable for half term with extra open-gym and skill clinics for all levels.",
    coverImage: "/brand/banner4.png",
    tags: ["Announcements", "Events"],
    body: [
      {
        type: "paragraph",
        text: "Half term brings a slightly condensed timetable with extra open-gym slots and skill clinics. Please check your class time carefully and book any optional sessions in advance.",
      },
      {
        type: "heading",
        text: "What to expect",
      },
      {
        type: "list",
        items: [
          "Open-gym slots for additional practice",
          "Focused clinics on bars, floor, and beam",
          "Smaller group sizes for more coach feedback",
        ],
      },
      {
        type: "paragraph",
        text: "If you are unsure which session is best, speak to a coach and we will recommend a suitable option.",
      },
    ],
  },
  {
    title: "New Recreational Class Openings",
    slug: "new-recreational-class-openings",
    date: "2025-01-22",
    excerpt:
      "We have opened additional recreational classes for beginners and improvers with limited spaces available.",
    coverImage: "/brand/banner.png",
    tags: ["Recreational", "Announcements"],
    body: [
      {
        type: "paragraph",
        text: "We have opened new recreational classes to meet demand. These sessions focus on fun, confidence, and safe progressions for beginners and improvers.",
      },
      {
        type: "paragraph",
        text: "Spaces are limited, so please book early to secure your preferred time.",
      },
    ],
  },
  {
    title: "Competition Team Results Weekend",
    slug: "competition-team-results-weekend",
    date: "2024-11-18",
    excerpt:
      "A great weekend of results for the competition team with strong podium finishes and personal bests.",
    coverImage: "/brand/banner3.png",
    tags: ["Competitions"],
    body: [
      {
        type: "paragraph",
        text: "Our competition team delivered a strong set of routines and achieved several personal bests. Coaches were impressed with the focus and composure throughout the weekend.",
      },
      {
        type: "paragraph",
        text: "Well done to all gymnasts who represented the club with confidence and great sportsmanship.",
      },
    ],
  },
  {
    title: "Holiday Closures",
    slug: "holiday-closures",
    date: "2024-12-01",
    excerpt:
      "Please note the dates for winter holiday closures and limited training sessions.",
    coverImage: "/brand/banner2.png",
    tags: ["Announcements"],
    body: [
      {
        type: "paragraph",
        text: "Please note the winter holiday closure dates and any limited training sessions that remain open. Full details are posted on the notice board and sent via email.",
      },
      {
        type: "paragraph",
        text: "If you have any questions about make-up sessions, speak to the front desk team.",
      },
    ],
  },
  {
    title: "Club Kit Reminder",
    slug: "club-kit-reminder",
    date: "2024-10-05",
    excerpt:
      "A quick reminder about club kit ordering, sizing, and collection dates.",
    coverImage: "/brand/banner4.png",
    tags: ["Announcements"],
    body: [
      {
        type: "paragraph",
        text: "Please ensure all kit orders are submitted by the end of the month. Sizing samples are available at reception during class times.",
      },
      {
        type: "paragraph",
        text: "Collection dates will be announced once the order arrives.",
      },
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
