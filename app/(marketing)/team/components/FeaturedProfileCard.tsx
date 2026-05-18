import Image from "next/image";
import type { TeamMember } from "../types";

type FeaturedProfileCardProps = {
  member: TeamMember;
};

export default function FeaturedProfileCard({
  member,
}: FeaturedProfileCardProps) {
  return (
    <section className="my-12 overflow-hidden border border-[#d9d0e6] bg-white shadow-[0_24px_44px_-36px_rgba(24,14,40,0.35)]">
      <div className="grid md:grid-cols-[minmax(280px,0.84fr)_minmax(0,1.16fr)]">
        <div className="border-b border-[#e6deef] bg-[#f4effa] md:border-b-0 md:border-r">
          <div className="flex h-full items-center justify-center px-5 py-6 sm:px-8 sm:py-8">
            <div className="w-full max-w-[420px]">
              <Image
                src={member.photoUrl}
                alt={`${member.name} portrait`}
                width={1179}
                height={1334}
                className="h-auto w-full object-contain"
                sizes="(max-width: 767px) 100vw, 40vw"
                priority
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c35c3]">
            Head Coach
          </p>
          <h2 className="mt-3 text-[clamp(34px,4vw,54px)] font-extrabold leading-[0.98] tracking-[0.01em] text-[#143271]">
            {member.name}
          </h2>
          <p className="mt-2 text-base font-bold text-[#6c35c3]">
            {member.roleTitle}
          </p>
          <p className="mt-6 max-w-3xl text-[15px] leading-8 text-[#2E2A33]/78 sm:text-base">
            {member.bio}
          </p>
        </div>
      </div>
    </section>
  );
}
