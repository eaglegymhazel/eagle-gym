import Image from "next/image";

const images = [
  { src: "/brand/placeholderImg/test1.png", alt: "Gymnastics class" },
  { src: "/brand/placeholderImg/test2.png", alt: "Coach helping gymnast" },
  { src: "/brand/placeholderImg/test3.png", alt: "Gym equipment" },
  { src: "/brand/placeholderImg/test.png", alt: "Gymnastics practice" },
];

export default function Home() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 text-lg leading-relaxed text-gray-800">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div>
          <div className="mb-6">
            <svg
              viewBox="0 0 800 200"
              className="h-24 w-full"
              aria-label="Welcome!"
              role="img"
            >
              <defs>
                <linearGradient id="welcomeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ff5fb1" />
                  <stop offset="50%" stopColor="#8f4bd6" />
                  <stop offset="100%" stopColor="#6c35c3" />
                </linearGradient>
              </defs>
              <text
                x="50%"
                y="55%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="120"
                fontWeight="800"
                fill="url(#welcomeGradient)"
                stroke="#ffffff"
                strokeWidth="6"
                paintOrder="stroke"
                style={{
                  fontFamily:
                    '"Baloo 2", "Comic Sans MS", "Comic Neue", cursive, sans-serif',
                }}
              >
                Welcome!
              </text>
            </svg>
          </div>
          <p>
            Are you looking for a sport that's exciting, confidence-boosting,
            and full of fun?
          </p>
          <p className="mt-6">
            Welcome to Eagle, Paisley's West End gymnastics club – right here in
            the old St Mirren Social Club at 11 Knox Street. We're easy to reach
            by public transport, with our own parking right next to the
            building.
          </p>
          <p className="mt-6">
            Founded by former squad gymnast and experienced coach Hazel Watt,
            who's been inspiring young athletes in Renfrewshire since 2001, our
            club is all about combining energy, discipline, and friendship.
            We're a big family where everyone – from total beginners to
            competition-ready gymnasts – feels at home.
          </p>
          <p className="mt-6">
            Our purpose-built gym is packed with Olympic-standard equipment,
            giving children the chance to train like the champions they see on
            TV, in a safe and supportive environment.
          </p>
          <p className="mt-6">
            Whether your child wants to tumble for fun or shine on the
            competition floor, we have something for them.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
          {images.map((image, index) => (
            <div
              key={image.src}
              className={[
                "relative overflow-hidden rounded-3xl border border-[#6c35c3]/10 bg-white/70 shadow-sm",
                index === 0 ? "sm:col-span-2 aspect-[16/9]" : "aspect-[4/3]",
              ].join(" ")}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
