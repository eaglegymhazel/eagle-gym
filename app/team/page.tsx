import Image from "next/image";

const coaches = [
  {
    id: 1,
    name: "Hazel",
    role: "Head Coach",
    bio: "Women's Artistic Club Coach • Pre-School Gymnastics Club Coach • Disability Club Coach • General Gymnastic Club Coach",
    image: "/brand/coaches/1.png",
  },
  {
    id: 2,
    name: "Karen",
    role: "Coach",
    bio: "Women's Artistic Club Coach • Level 1",
    image: "/brand/coaches/2.png",
  },
  {
    id: 3,
    name: "Alyson",
    role: "Coach",
    bio: "Women's Artistic Club Coach • Level 1",
    image: "/brand/coaches/3.png",
  },
  {
    id: 4,
    name: "Katrina",
    role: "Coach",
    bio: "Women's Artistic Club Coach • Level 1",
    image: "/brand/coaches/4.png",
  },
  {
    id: 5,
    name: "Chloe",
    role: "Coach",
    bio: "Women's Artistic Club Coach • Level 1",
    image: "/brand/coaches/5.png",
  },
  {
    id: 6,
    name: "Megan",
    role: "Coach",
    bio: "Women's Artistic Club Coach • Level 3",
    image: "/brand/coaches/6.png",
  },
  {
    id: 7,
    name: "Shannon",
    role: "Coach",
    bio: "Women's Artistic Club Coach • Level 1",
    image: "/brand/coaches/7.png",
  },
  {
    id: 8,
    name: "Margaret-Anne",
    role: "Safeguarding Officer",
    bio: "",
    image: "/brand/coaches/8.png",
  },
];

export default function TeamPage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#2a0c4f]">Meet the Team</h1>
        <p className="mt-2 max-w-2xl text-base text-[#2a0c4f]/80">
          Our coaches are here to build confidence, skills, and smiles in every
          class.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {coaches.map((coach) => (
          <article
            key={coach.id}
            className="rounded-2xl border border-[#6c35c3]/10 bg-white/90 p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#f3e7ff]">
              <Image
                src={coach.image}
                alt={`${coach.name} portrait`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              />
            </div>
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-[#2a0c4f]">
                {coach.name}
              </h2>
              <p className="text-sm font-semibold text-[#7436e6]">
                {coach.role}
              </p>
              <p className="mt-2 text-sm text-[#2a0c4f]/75">{coach.bio}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
