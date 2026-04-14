"use client";

const reviews = [
  {
    quote:
      "My daughter has learned a lot and had loads of fun. I like that there is something for all kids regardless of ability.",
    author: "Katie K",
  },
  {
    quote:
      "Great place for the kids to focus their energy. Very pleased with the development of my wee one.",
    author: "Stephen Dock",
  },
  {
    quote: "The teacher, Hazel, is fantastic. My three year old loves going each week.",
    author: "Eleanor Rathod",
  },
  {
    quote: "Daughter loves it. Very well organised.",
    author: "Dave Findlay",
  },
  {
    quote: "Excellent gymnastics club. My daughter has been attending classes here for 2 years and loves it.",
    author: "Deborah Christie",
  },
  {
    quote: "Fantastic coaching and encouragement for young gymnasts.",
    author: "Carol McCord",
  },
];

export default function ReviewsSlider() {
  return (
    <section className="text-left">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#6c35c3]">
            Testimonials
          </p>
          <h2 className="mt-3 text-[clamp(32px,3.4vw,48px)] font-extrabold leading-tight tracking-[-0.02em] text-[#2E2A33]">
            Families who train with us
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.author}
              className="flex min-h-[210px] flex-col justify-between rounded-lg border border-[#ded2e8] bg-white px-5 py-5 shadow-[0_18px_40px_-30px_rgba(63,29,116,0.45)]"
            >
              <div>
                <div className="mb-5 flex gap-1 text-[#6c35c3]" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, index) => (
                    <svg
                      key={index}
                      viewBox="0 0 20 20"
                      className="h-4 w-4 fill-current"
                    >
                      <path d="M10 1.6l2.42 5.16 5.42.83-3.92 4.02.93 5.67L10 14.6l-4.85 2.68.93-5.67-3.92-4.02 5.42-.83L10 1.6z" />
                    </svg>
                  ))}
                </div>
                <p className="text-base leading-[1.65] text-[#332941]">
                  &ldquo;{review.quote}&rdquo;
                </p>
              </div>
              <p className="mt-6 border-t border-[#eee6f3] pt-4 text-sm font-bold uppercase tracking-[0.06em] text-[#6f6384]">
                {review.author}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
