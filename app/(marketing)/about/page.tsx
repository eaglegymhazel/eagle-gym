import Image from "next/image";
import Link from "next/link";

const highlights = [
  {
    label: "Founded by",
    value: "Hazel Watt",
  },
  {
    label: "Coaching across Renfrewshire",
    value: "Since 2001",
  },
  {
    label: "Based in",
    value: "West End of Paisley",
  },
];

const programmes = [
  {
    title: "Pre-school Classes",
    eyebrow: "From walking age",
    image: "/brand/img10.JPG",
    copy: "Children can start as soon as they are able to walk, developing balance, coordination, and social skills through structured pre-school classes.",
  },
  {
    title: "Recreational Training",
    eyebrow: "All ages and abilities",
    image: "/brand/img13.webp",
    copy: "As gymnasts progress, they move into more formal training, building strength, flexibility, and control across all apparatus.",
  },
  {
    title: "Competitive Pathway",
    eyebrow: "Long-term development",
    image: "/brand/img15.webp",
    copy: "Athletes begin with entry-level floor and vault competitions, with the opportunity to progress to vault, bars, beam, and floor.",
  },
];

const pathwaySteps = [
  "Entry-level floor and vault competitions",
  "Progression into four-piece artistic gymnastics",
  "Higher-level competition experience",
  "Development towards regional and national standards",
];

export default function AboutPage() {
  return (
    <main className="w-full bg-[#faf7fb]">
      <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="mb-5 h-[3px] w-12 rounded-full bg-[#6c35c3]" />
          <h1 className="text-[clamp(36px,5vw,64px)] font-extrabold leading-[0.98] tracking-[0.01em] text-[#143271]">
            From First Steps to Serious Training
          </h1>
          <p className="mt-6 text-base leading-8 text-[#2E2A33]/78 sm:text-[17px]">
            Eagle Gymnastics Academy is based in the West End of Paisley,
            operating from a dedicated gymnastics facility at the former St
            Mirren Social Club.
          </p>
          <p className="mt-4 text-base leading-8 text-[#2E2A33]/78 sm:text-[17px]">
            Founded by Hazel Watt, a former squad gymnast and experienced coach
            working across Renfrewshire since 2001, the club was built to
            provide a structured, supportive environment where children can
            develop both physically and personally.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-[#6c35c3]/15 bg-white px-4 py-4 shadow-[0_14px_30px_-26px_rgba(45,26,78,0.42)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6c35c3]">
                  {item.label}
                </p>
                <p className="mt-2 text-lg font-extrabold leading-tight text-[#143271]">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-h-[420px] grid-cols-[0.85fr_1.15fr] gap-3">
          <div className="relative overflow-hidden rounded-lg">
            <Image
              src="/brand/img21.JPG"
              alt="Young gymnasts training"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 42vw, 28vw"
              priority
            />
          </div>
          <div className="grid gap-3">
            <div className="relative overflow-hidden rounded-lg">
              <Image
                src="/brand/img1.JPG"
                alt="Gymnastics facility"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 58vw, 34vw"
                priority
              />
            </div>
            <div className="relative overflow-hidden rounded-lg">
              <Image
                src="/brand/img22.JPG"
                alt="Gymnastics class activity"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 58vw, 34vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#6c35c3] px-4 py-12 text-[#f9f6fa] sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f9f6fa]/72">
              Our focus
            </p>
            <h2 className="mt-4 text-[clamp(30px,3.4vw,48px)] font-extrabold leading-[1.02] tracking-[0.01em] text-[#f9f6fa]">
              Serious training in a place children want to be.
            </h2>
          </div>
          <p className="text-base leading-8 text-[#f9f6fa]/82 sm:text-[17px]">
            The academy combines disciplined coaching with a strong sense of
            community. The aim is not only to teach gymnastics skills, but to
            help children build confidence, coordination, and resilience in a
            setting that feels welcoming and consistent.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="mb-5 h-[3px] w-12 rounded-full bg-[#6c35c3]" />
            <h2 className="text-[clamp(30px,3vw,44px)] font-extrabold leading-[1.05] tracking-[0.02em] text-[#143271]">
              Equipped for progression
            </h2>
          </div>
          <p className="text-base leading-8 text-[#2E2A33]/76 sm:text-[17px]">
            The facility is fully equipped with Olympic-standard apparatus,
            giving gymnasts the opportunity to train using the same equipment
            seen at elite level. This allows for clear progression from
            beginner fundamentals through to more advanced skills.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {programmes.map((item) => (
            <article
              key={item.title}
              className="overflow-hidden rounded-lg border border-[#6c35c3]/15 bg-white shadow-[0_16px_34px_-28px_rgba(45,26,78,0.45)]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#eee7f1]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c35c3]">
                  {item.eyebrow}
                </p>
                <h3 className="mt-3 text-2xl font-extrabold leading-tight tracking-[0.01em] text-[#143271]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#2E2A33]/72">
                  {item.copy}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="squad-faq"
        className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-12 sm:px-6 sm:pb-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
      >
        <div className="relative min-h-[360px] overflow-hidden rounded-lg lg:order-2">
          <Image
            src="/brand/img12.JPG"
            alt="Competitive gymnastics training"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 48vw"
          />
        </div>

        <div>
          <div className="mb-5 h-[3px] w-12 rounded-full bg-[#6c35c3]" />
          <h2 className="text-[clamp(30px,3vw,44px)] font-extrabold leading-[1.05] tracking-[0.02em] text-[#143271]">
            A structured competitive pathway
          </h2>
          <p className="mt-5 text-base leading-8 text-[#2E2A33]/76 sm:text-[17px]">
            For those looking to compete, the academy offers a structured
            pathway into competitive gymnastics. Athletes begin with entry-level
            competitions in floor and vault, with the opportunity to progress to
            full four-piece artistic gymnastics.
          </p>
          <div className="mt-7 space-y-3">
            {pathwaySteps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-4 rounded-lg border border-[#6c35c3]/15 bg-white px-4 py-3 shadow-[0_12px_26px_-24px_rgba(45,26,78,0.42)]"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#6c35c3] text-sm font-extrabold text-[#f9f6fa]">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold leading-6 text-[#2E2A33]/78">
                  {step}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-base leading-8 text-[#2E2A33]/76 sm:text-[17px]">
            From there, gymnasts can move into higher-level competitions, with
            long-term development aimed towards regional and national standards.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
        <div className="rounded-lg bg-[#143271] px-6 py-8 text-[#f9f6fa] sm:px-8 md:flex md:items-center md:justify-between md:gap-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f9f6fa]/70">
              At our core
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-[0.01em] text-[#f9f6fa]">
              Train seriously. Enjoy the process. Improve over time.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#f9f6fa]/78">
              Create a safe, well-equipped environment where children can train
              seriously, enjoy the process, and steadily improve over time.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 md:mt-0">
            <Link
              href="/book?type=recreational"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#f9f6fa] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-[#143271] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9f6fa]/70"
            >
              Book Recreational Classes
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#f9f6fa]/55 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-[#f9f6fa] transition hover:-translate-y-0.5 hover:bg-[#f9f6fa] hover:text-[#143271] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9f6fa]/70"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
