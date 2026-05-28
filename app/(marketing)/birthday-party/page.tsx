import Image from "next/image";
import Link from "next/link";

const partyIncludes = [
  "30 minutes of high-energy gymnastics fun, games, and activities",
  "30 minutes for food, birthday cake, and celebrations",
  "A final 30 minutes of more games and gymnastics fun before home time",
];

const parentItems = [
  "Food and drinks",
  "Birthday cake",
  "Decorations",
  "Party bags and any extras you want to bring",
];

function PhotoBlock({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={[
        "relative min-h-[240px] overflow-hidden border border-[#ddd4ea] bg-[#efe7f7]",
        className,
      ].join(" ")}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 48vw"
      />
    </div>
  );
}

function BulletList({
  items,
}: {
  items: string[];
}) {
  return (
    <ul className="mt-5 list-outside list-disc space-y-3 pl-6 text-base leading-8 text-[#2E2A33]/78 marker:text-[#6c35c3] marker:text-[1.05em] sm:text-[17px]">
      {items.map((item) => (
        <li key={item} className="pl-1">
          {item}
        </li>
      ))}
    </ul>
  );
}

const primaryButtonClass =
  "inline-flex min-h-[62px] items-center justify-center bg-[#6c35c3] px-8 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:bg-[#5c2eab] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/35";

const secondaryButtonClass =
  "inline-flex min-h-[56px] items-center justify-center bg-[#143271] px-6 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white transition hover:-translate-y-0.5 hover:bg-[#0f2759] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#143271]/35";

export default function BirthdayPartyPage() {
  return (
    <main className="w-full bg-[#faf7fb]">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-11">
        <div className="max-w-4xl">
          <h1 className="text-[clamp(36px,4.8vw,62px)] font-extrabold leading-[0.98] tracking-[0.01em] text-[#143271]">
            Birthday Parties at Eagle Gymnastics Academy
          </h1>
          <p className="mt-6 text-base leading-8 text-[#2E2A33]/78 sm:text-[17px]">
            Give your child a birthday party full of bouncing, games,
            laughter, and gymnastics adventures at Eagle Gymnastics.
          </p>
          <p className="mt-4 text-base leading-8 text-[#2E2A33]/78 sm:text-[17px]">
            Available to book on Saturdays from 3:00pm to 4:30pm, our birthday
            parties are a fun and active way for children to celebrate with
            their friends in a safe, friendly, and fully equipped gymnastics
            environment. Our energetic coaches and helpers keep the excitement
            going from start to finish.
          </p>
          <p className="mt-5 text-base font-semibold leading-8 text-[#143271] sm:text-[17px]">
            Parties start at £150.
          </p>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/birthday-party/book" className={primaryButtonClass}>
            Book Your Party
          </Link>
          <Link href="/contact" className={secondaryButtonClass}>
            Contact Us
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-8 sm:px-6 md:grid-cols-[1.02fr_0.98fr] md:items-start">
        <div className="md:self-start">
          <h2 className="text-[clamp(28px,3vw,40px)] font-extrabold leading-[1.04] tracking-[0.01em] text-[#143271]">
            Each 90-minute party includes
          </h2>
          <BulletList items={partyIncludes} />
        </div>

        <PhotoBlock
          src="/birthdays/birthday1.png"
          alt="Children enjoying a birthday party at the gym"
          className="min-h-[300px] sm:min-h-[340px] md:mt-3 md:min-h-[360px]"
        />
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 pb-10 sm:px-6 md:grid-cols-[0.95fr_1.05fr] md:items-start">
        <PhotoBlock
          src="/birthdays/birthday2.png"
          alt="Birthday party activities in the gymnastics gym"
          className="min-h-[280px] sm:min-h-[320px] md:order-1 md:mt-3 md:min-h-[340px]"
        />

        <div className="md:order-2 md:self-start">
          <h2 className="text-[clamp(28px,3vw,40px)] font-extrabold leading-[1.04] tracking-[0.01em] text-[#143271]">
            Making memories
          </h2>
          <p className="mt-5 text-base leading-8 text-[#2E2A33]/78 sm:text-[17px]">
            We provide the venue, gymnastics equipment, and all coaching
            throughout the session. Parents simply bring the food, birthday
            cake, decorations, party bags, and any extras they would like to
            make the celebration personal and special.
          </p>
          <BulletList items={parentItems} />
        </div>
      </section>

      <section className="border-t border-[#ddd4ea] bg-[#f3ebf7]">
        <div className="mx-auto w-full max-w-6xl px-4 py-9 sm:px-6 sm:py-11">
          <div className="max-w-4xl">
            <h2 className="text-[clamp(30px,3vw,44px)] font-extrabold leading-[1.04] tracking-[0.01em] text-[#143271]">
              Book your birthday party now
            </h2>
            <p className="mt-5 text-base leading-8 text-[#2E2A33]/78 sm:text-[17px]">
              Whether your child already loves gymnastics or just wants a
              birthday party that is active, exciting, and a little different,
              our team will make sure they have a celebration to remember.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/birthday-party/book" className={primaryButtonClass}>
              Book Your Party
            </Link>
            <Link href="/contact" className={secondaryButtonClass}>
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
