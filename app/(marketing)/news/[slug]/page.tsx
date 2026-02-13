"use client";

import { useParams } from "next/navigation";

type ArticleSection = {
  heading: string;
  paragraphs: string[];
};

type ArticleContent = {
  title: string;
  date: string;
  tag: "Competitions" | "Announcements" | "Recreational" | "Events";
  deck: string;
  heroImage: string;
  sections: ArticleSection[];
  images: { src: string; caption: string }[];
  callout: { title: string; items: string[]; tone: "info" | "success" };
  keyDetails?: { date: string; time: string; location: string; appliesTo: string };
};

const ARTICLES: Record<string, ArticleContent> = {
  "grades-competition-2025": {
    title: "Grades Competition 2025",
    date: "15 Mar 2025",
    tag: "Competitions",
    deck:
      "A focused, confident weekend for our gymnasts with steady routines and strong progress across events.",
    heroImage: "/brand/News/medals3.png",
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "Our Grades Competition weekend in March 2025 was a proud moment for the club. The atmosphere was positive from the first warm-up, with gymnasts supporting one another and coaches keeping routines calm, focused, and well paced.",
          "We emphasised steady preparation, clear routines, and confident presentation, and the team delivered across the board. It was the kind of event that reminds us how far the gymnasts have come in a short period of time.",
        ],
      },
      {
        heading: "Performance Highlights",
        paragraphs: [
          "Performance routines were approached with composure, and the gymnasts showed great control in both execution and posture. The training block leading up to the competition has been about clean shapes, precise landings, and thoughtful transitions.",
          "Coaches were particularly pleased with improvements in range and conditioning. These are often the hardest areas to lift quickly, but the gymnasts applied feedback consistently and stayed disciplined in their weekly routines.",
        ],
      },
      {
        heading: "Team Spirit",
        paragraphs: [
          "Beyond the scores, the standout feature of the weekend was the team spirit. Families, teammates, and coaches worked together to keep the environment encouraging and calm.",
          "That kind of support matters deeply at competitions and helps gymnasts feel secure and confident in themselves. We are grateful for the positive energy and the respect shown by everyone in attendance.",
        ],
      },
      {
        heading: "Whats Next",
        paragraphs: [
          "We will continue to build on the progress from this event, using the feedback sheets to guide our next training phase. The goal now is consistency and refinement.",
          "Thank you to all gymnasts and families who represented the club so well. We are proud of the effort, the attitude, and the results.",
        ],
      },
    ],
    images: [
      { src: "/brand/News/medal.png", caption: "A proud weekend of results." },
      { src: "/brand/News/medals2.png", caption: "Focused routines across events." },
      { src: "/brand/News/medals4.png", caption: "Consistency and composure on the floor." },
      {
        src: "/brand/News/0b8c86_ed75d31fda1a4b2592662a43bcc07c87~mv2.png",
        caption: "Celebrating progress together.",
      },
    ],
    callout: {
      title: "Results Highlight",
      tone: "success",
      items: [
        "Steady routines across all events",
        "Improved range and conditioning scores",
        "Strong team support and composure",
      ],
    },
  },
  "march-skills-focus-week": {
    title: "March Skills Focus Week",
    date: "24 Mar 2025",
    tag: "Events",
    deck:
      "A focused week of skill stations to build confidence on bars, beam, and floor.",
    heroImage: "/brand/News/medals4.png",
    sections: [
      {
        heading: "Overview",
        paragraphs: [
          "March Skills Focus Week is all about strengthening fundamentals and building confidence across the core events. Sessions rotate through stations for bars, beam, and floor so gymnasts can get extra repetitions with coach feedback.",
          "We keep the pace steady and the environment calm so gymnasts can focus on clean shapes, safe landings, and controlled movement.",
        ],
      },
      {
        heading: "How it Works",
        paragraphs: [
          "Groups will follow their usual timetable, but each class will include extra time on skill progressions and drills. Coaches will tailor progressions to each gymnast's level.",
          "If you have any questions about suitability, please speak to a coach before the session.",
        ],
      },
      {
        heading: "What to Bring",
        paragraphs: [
          "Please arrive a few minutes early and bring a water bottle. Hair should be tied back and jewellery removed for safety.",
        ],
      },
    ],
    images: [
      { src: "/brand/News/medals3.png", caption: "Focused stations and safe progressions." },
      { src: "/brand/News/medals2.png", caption: "Extra repetition builds confidence." },
      { src: "/brand/News/0b8c86_40dc8e2020ec46e7a8077cde97d8c799~mv2.png", caption: "Steady coaching and clear drills." },
      { src: "/brand/News/medals4.png", caption: "Consistency through the week." },
    ],
    callout: {
      title: "Week Highlights",
      tone: "info",
      items: [
        "Extra time on core events",
        "Smaller station focus",
        "Coach feedback at every rotation",
      ],
    },
  },
  "parent-viewing-evening": {
    title: "Parent Viewing Evening",
    date: "20 Mar 2025",
    tag: "Announcements",
    deck:
      "A relaxed viewing evening so families can see class progress and recent improvements.",
    heroImage: "/brand/News/premises2.png",
    sections: [
      {
        heading: "What to Expect",
        paragraphs: [
          "We are opening a short parent viewing evening in March so families can see the gymnasts' progress in a relaxed setting. Coaches will guide the class as normal while highlighting key focus areas.",
          "This is not a performance night, but a chance to observe how skills are taught and how routines are developed.",
        ],
      },
      {
        heading: "Guidelines",
        paragraphs: [
          "Please keep the viewing area calm and allow gymnasts to focus. A quiet environment helps them feel confident and comfortable.",
          "If you have questions afterward, coaches will be available for a short Q&A.",
        ],
      },
      {
        heading: "Arrival",
        paragraphs: [
          "Spaces are limited, so please arrive a few minutes early. Thank you for your support and understanding.",
        ],
      },
    ],
    images: [
      { src: "/brand/News/premises1.png", caption: "A welcoming space for families." },
      { src: "/brand/News/premises3.png", caption: "Seeing progress in real time." },
      { src: "/brand/News/medals2.png", caption: "Encouraging atmosphere for gymnasts." },
      { src: "/brand/News/medals4.png", caption: "Celebrating steady improvement." },
    ],
    callout: {
      title: "Reminder",
      tone: "info",
      items: [
        "Arrive early to secure a space",
        "Keep noise to a minimum",
        "Coaches available for questions afterward",
      ],
    },
  },
  "spring-term-progress-update": {
    title: "Spring Term Progress Update",
    date: "05 Mar 2025",
    tag: "Recreational",
    deck:
      "A quick update on spring term goals, conditioning targets, and skill progressions.",
    heroImage: "/brand/News/medals3.png",
    sections: [
      {
        heading: "Progress So Far",
        paragraphs: [
          "As we move through the spring term, gymnasts are showing strong progress in conditioning, flexibility, and core control. These foundations support safer skill development and more confident movement.",
          "Our recreational groups are focusing on clean body shapes and consistent landings, while intermediate groups prepare for more complex combinations.",
        ],
      },
      {
        heading: "Focus Areas",
        paragraphs: [
          "Coaches are emphasizing quality over speed to keep learning steady and safe. We are seeing great improvements in posture, control, and understanding of technique.",
          "Parents can support progress by encouraging regular attendance and simple stretching at home.",
        ],
      },
      {
        heading: "Next Steps",
        paragraphs: [
          "We will continue to build on these gains with steady progressions and positive reinforcement. Thank you for supporting your gymnast's journey.",
        ],
      },
    ],
    images: [
      { src: "/brand/News/medals2.png", caption: "Building strong foundations." },
      { src: "/brand/News/medals3.png", caption: "Steady progress through the term." },
      { src: "/brand/News/medals4.png", caption: "Quality movement and safe habits." },
      { src: "/brand/News/0b8c86_ed75d31fda1a4b2592662a43bcc07c87~mv2.png", caption: "Confidence grows with consistency." },
    ],
    callout: {
      title: "At a Glance",
      tone: "info",
      items: [
        "Improved conditioning and control",
        "Clear progress on shapes and landings",
        "Keep attendance consistent",
      ],
    },
  },
  "half-term-training-schedule": {
    title: "Half Term Training Schedule",
    date: "10 Feb 2025",
    tag: "Events",
    deck:
      "A slightly adjusted timetable with optional open-gym slots and focused clinics during the break.",
    heroImage: "/brand/News/medals4.png",
    keyDetails: {
      date: "Half term week",
      time: "Usual class times",
      location: "Main gym hall",
      appliesTo: "All recreational groups",
    },
    sections: [
      {
        heading: "Schedule Update",
        paragraphs: [
          "During half term we run a slightly adjusted timetable that keeps sessions consistent while giving families flexibility. The aim is to maintain rhythm for regular attendees while providing extra opportunities for those who want to train a little more.",
          "Sessions will remain structured and coach-led, with warm-ups and safe progressions just as you would expect in a normal week.",
        ],
      },
      {
        heading: "What to Expect",
        paragraphs: [
          "Please double-check your class time before attending, as some groups are combined or run at a different time for half term only.",
          "We will keep class sizes balanced to ensure gymnasts still receive plenty of coaching time and feedback.",
        ],
      },
      {
        heading: "Optional Open-Gym",
        paragraphs: [
          "We will also offer a small number of open-gym practice slots. These are optional and intended for gymnasts who want additional repetition of basics, shapes, and conditioning.",
          "If you are unsure which session is best, speak to a coach and we will recommend a suitable option.",
        ],
      },
    ],
    images: [
      { src: "/brand/News/medals2.png", caption: "Extra practice slots available." },
      { src: "/brand/News/medals3.png", caption: "Focused clinics in a calm setting." },
      {
        src: "/brand/News/0b8c86_40dc8e2020ec46e7a8077cde97d8c799~mv2.png",
        caption: "Structured sessions for all levels.",
      },
      { src: "/brand/News/medals4.png", caption: "Consistent training through the break." },
    ],
    callout: {
      title: "Reminder",
      tone: "info",
      items: [
        "Check your class time before attending",
        "Arrive a few minutes early",
        "Open-gym slots are optional",
      ],
    },
  },
  "new-recreational-class-openings": {
    title: "New Recreational Class Openings",
    date: "22 Jan 2025",
    tag: "Recreational",
    deck: "New beginner and improver classes are now open with limited spaces available.",
    heroImage: "/brand/News/0b8c86_40dc8e2020ec46e7a8077cde97d8c799~mv2.png",
    sections: [
      {
        heading: "Whats New",
        paragraphs: [
          "We are delighted to announce additional recreational class openings for beginners and improvers. These classes are designed to be welcoming and confidence-building, with clear progressions that help gymnasts feel safe and successful.",
          "Our goal is to provide a positive introduction to gymnastics while developing coordination, balance, and strength.",
        ],
      },
      {
        heading: "Class Structure",
        paragraphs: [
          "Recreational sessions focus on quality movement and good habits. Gymnasts learn basic shapes, safe landings, and simple sequences on floor, bars, and beam.",
          "Each class follows a structured plan with warm-up, skill stations, and a short cool-down.",
        ],
      },
      {
        heading: "Booking",
        paragraphs: [
          "Spaces are limited to maintain high coaching quality and safe ratios. We recommend booking early to secure your preferred session time.",
          "If you are unsure which class is best, our team can advise based on age and experience.",
        ],
      },
    ],
    images: [
      {
        src: "/brand/News/0b8c86_ed75d31fda1a4b2592662a43bcc07c87~mv2.png",
        caption: "Welcoming classes for beginners.",
      },
      { src: "/brand/News/medals2.png", caption: "Small wins, steady progress." },
      { src: "/brand/News/medals3.png", caption: "Structured stations and safe progressions." },
      { src: "/brand/News/medals4.png", caption: "Confidence built step by step." },
    ],
    callout: {
      title: "Booking Tips",
      tone: "info",
      items: [
        "Spaces are limited",
        "Choose your preferred time early",
        "Ask a coach for guidance",
      ],
    },
  },
  "competition-team-results-weekend": {
    title: "Competition Team Results Weekend",
    date: "18 Nov 2024",
    tag: "Competitions",
    deck:
      "A strong weekend for the team with personal bests, steady routines, and positive energy throughout.",
    heroImage: "/brand/News/medals4.png",
    sections: [
      {
        heading: "Weekend Summary",
        paragraphs: [
          "This weekends results reflect the hard work the competition team has put in over the last training block. The gymnasts showed composure under pressure and delivered steady routines with clean shapes and confident landings.",
          "It was a great opportunity to measure progress and identify areas to sharpen for the next events.",
        ],
      },
      {
        heading: "Key Takeaways",
        paragraphs: [
          "Coaches were impressed by the improvements in artistry and control, particularly on floor. Bars and beam also showed improvements, with fewer breaks in rhythm and more consistent movement quality.",
          "The team achieved several personal bests and a number of top placements.",
        ],
      },
      {
        heading: "Looking Ahead",
        paragraphs: [
          "We will use judges feedback to guide the next training phase, with particular attention to consistency and small technical details.",
          "Well done to the entire competition team for representing the club with professionalism and enthusiasm.",
        ],
      },
    ],
    images: [
      { src: "/brand/News/medals3.png", caption: "Personal bests across the squad." },
      { src: "/brand/News/medals2.png", caption: "Focus and composure under pressure." },
      { src: "/brand/News/medals4.png", caption: "A proud weekend for the team." },
      { src: "/brand/News/medal.png", caption: "Celebrating progress." },
    ],
    callout: {
      title: "Results Highlight",
      tone: "success",
      items: [
        "Multiple personal bests",
        "Stronger consistency on beam",
        "Positive team support throughout",
      ],
    },
  },
  "holiday-closures": {
    title: "Holiday Closures",
    date: "01 Dec 2024",
    tag: "Announcements",
    deck: "A quick guide to holiday closures and the return to normal classes.",
    heroImage: "/brand/News/premises.png",
    keyDetails: {
      date: "Late December",
      time: "No regular classes",
      location: "Gym closed",
      appliesTo: "All groups",
    },
    sections: [
      {
        heading: "Closure Dates",
        paragraphs: [
          "Please note the holiday closure dates for the gym as we approach the end of the year. We will pause regular classes for a short period to allow families and staff to enjoy the holidays.",
          "A limited training schedule may run on selected days for invited groups. These sessions are by invitation only and will be communicated directly to relevant families.",
        ],
      },
      {
        heading: "Returning to Classes",
        paragraphs: [
          "Normal classes will resume in the new year. We recommend checking your class start date and arriving a few minutes early in the first week to settle back into routine.",
          "If you need to miss sessions due to travel, please let us know so we can plan class sizes and staffing efficiently.",
        ],
      },
      {
        heading: "Thank You",
        paragraphs: [
          "We appreciate your understanding and support over the holiday period. The break is a valuable time to rest, recover, and return to training with renewed energy.",
          "Wishing all gymnasts and families a safe and happy holiday season.",
        ],
      },
    ],
    images: [
      { src: "/brand/News/premises1.png", caption: "The gym will reopen in the new year." },
      { src: "/brand/News/premises2.png", caption: "Thank you for your support." },
      { src: "/brand/News/premises3.png", caption: "We look forward to welcoming everyone back." },
      { src: "/brand/News/premises.png", caption: "Holiday maintenance period." },
    ],
    callout: {
      title: "Important",
      tone: "info",
      items: [
        "Check closure dates",
        "Watch for email updates",
        "Normal classes resume in January",
      ],
    },
  },
  "club-kit-reminder": {
    title: "Club Kit Reminder",
    date: "05 Oct 2024",
    tag: "Announcements",
    deck: "A quick reminder to order kit, check sizes, and label items.",
    heroImage: "/brand/News/premises2.png",
    sections: [
      {
        heading: "Ordering",
        paragraphs: [
          "A quick reminder to place club kit orders before the end of the month. Keeping kit up to date helps gymnasts feel part of the team and ready for training or events.",
          "Orders will be processed in a single batch, so deadlines are important.",
        ],
      },
      {
        heading: "Sizing",
        paragraphs: [
          "Sizing samples are available at reception during class times. If you are unsure about fit, please check in with the front desk or a coach for guidance.",
          "We can help ensure gymnasts are comfortable and have full range of movement.",
        ],
      },
      {
        heading: "Collection",
        paragraphs: [
          "Collection dates will be announced once the order arrives. We will communicate pickup details via email and in the gym.",
          "Please label all kit items, especially for younger gymnasts, to reduce lost property.",
        ],
      },
    ],
    images: [
      { src: "/brand/News/premises2.png", caption: "Kit samples are available at reception." },
      { src: "/brand/News/premises3.png", caption: "Label items clearly." },
      { src: "/brand/News/medals2.png", caption: "Orders processed in one batch." },
      { src: "/brand/News/medals3.png", caption: "Thank you for your support." },
    ],
    callout: {
      title: "Quick Checklist",
      tone: "info",
      items: [
        "Order before the deadline",
        "Check sizing samples",
        "Label all kit items",
      ],
    },
  },
};

const SECTION_HEADINGS = ["Overview", "Highlights", "What to Expect", "Whats Next"];

function chunkSections(sections: ArticleSection[]) {
  return sections.map((section, index) => ({
    heading: section.heading || SECTION_HEADINGS[index % SECTION_HEADINGS.length],
    paragraphs: section.paragraphs,
  }));
}

export default function NewsArticlePage() {
  const params = useParams();
  const slug =
    typeof params?.slug === "string" ? params.slug : "";
  const normalizedSlug = slug.toLowerCase().trim();
  const article = normalizedSlug ? ARTICLES[normalizedSlug] : undefined;
  const sections = article ? chunkSections(article.sections) : [];

  if (!article) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <p>Article not found</p>
      </main>
    );
  }

  const photos = article.images.length >= 4 ? article.images : [];

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-8">
        <a href="/news" className="text-sm font-semibold text-[#6c35c3]">
          Back to News
        </a>
      </div>

      <header className="space-y-4">
        <div className="space-y-2">
          <h1>{article.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#2E2A33]/70">
            <span>{article.date}</span>
            <span className="rounded-full bg-[#f3ecfb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6c35c3]">
              {article.tag}
            </span>
          </div>
          <p className="text-base text-[#2E2A33]/70">{article.deck}</p>
        </div>
        <div className="relative max-h-[360px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#f4effa] via-[#f0f6ff] to-[#f9eaf5]">
          <img
            src={article.heroImage}
            alt={article.title}
            className="h-full w-full object-cover object-top"
          />
        </div>
      </header>

      <div className="mt-8 grid gap-8 md:grid-cols-[2fr,1fr]">
        <article className="prose prose-lg max-w-none text-[#2E2A33]">
          {sections.map((section, index) => (
            <section key={section.heading} className="space-y-4">
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}

              {index === 0 && article.images[0] ? (
                <figure className="not-prose">
                  <img
                    src={article.images[0].src}
                    alt={article.images[0].caption}
                    className="w-full rounded-2xl object-cover"
                  />
                  <figcaption className="mt-2 text-sm text-[#2E2A33]/60">
                    {article.images[0].caption}
                  </figcaption>
                </figure>
              ) : null}

              {index === 1 && article.images[1] ? (
                <div className="not-prose grid gap-4 md:grid-cols-[1.2fr,1fr] md:items-center">
                  <img
                    src={article.images[1].src}
                    alt={article.images[1].caption}
                    className="w-full rounded-2xl object-cover"
                  />
                  <p className="text-base text-[#2E2A33]/70">
                    {article.images[1].caption}
                  </p>
                </div>
              ) : null}

              {index === 2 && article.images[2] ? (
                <figure className="not-prose">
                  <img
                    src={article.images[2].src}
                    alt={article.images[2].caption}
                    className="w-full rounded-2xl object-cover"
                  />
                  <figcaption className="mt-2 text-sm text-[#2E2A33]/60">
                    {article.images[2].caption}
                  </figcaption>
                </figure>
              ) : null}
            </section>
          ))}

          <div className="not-prose rounded-2xl border border-[#6c35c3]/20 bg-[#f7f2fb] p-5">
            <p className="text-sm font-semibold text-[#6c35c3]">
              {article.callout.title}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-[#2E2A33]/80">
              {article.callout.items.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </article>

        {article.keyDetails ? (
          <aside className="h-fit rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6c35c3]">
              Key Details
            </p>
            <div className="mt-3 space-y-2 text-sm text-[#2E2A33]/70">
              <p>
                <strong>Date:</strong> {article.keyDetails.date}
              </p>
              <p>
                <strong>Time:</strong> {article.keyDetails.time}
              </p>
              <p>
                <strong>Location:</strong> {article.keyDetails.location}
              </p>
              <p>
                <strong>Applies to:</strong> {article.keyDetails.appliesTo}
              </p>
            </div>
          </aside>
        ) : null}
      </div>

      {photos.length ? (
        <section className="mt-10">
          <h2>Photos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((image) => (
              <img
                key={image.src}
                src={image.src}
                alt={image.caption}
                className="w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
