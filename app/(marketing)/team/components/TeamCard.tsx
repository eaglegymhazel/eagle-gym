import Image from "next/image";
import type { TeamMember } from "../types";

type TeamCardProps = {
  member: TeamMember;
  reverse?: boolean;
};

export default function TeamCard({ member, reverse = false }: TeamCardProps) {
  return (
    <article className="overflow-hidden border border-[#ddd5e8] bg-white shadow-[0_22px_38px_-34px_rgba(24,14,40,0.32)]">
      <div
        className={`grid items-stretch lg:grid-cols-[minmax(280px,0.88fr)_minmax(0,1.12fr)] ${
          reverse ? "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1" : ""
        }`}
      >
        <div className="border-b border-[#e6deef] bg-[#f4effa] lg:border-b-0 lg:border-r">
          <div className="flex h-full items-center justify-center px-5 py-6 sm:px-7 sm:py-8">
            <div className="w-full max-w-[360px]">
              <Image
                src={member.photoUrl}
                alt={`${member.name} portrait`}
                width={1179}
                height={1334}
                className="h-auto w-full object-contain"
                sizes="(max-width: 1023px) 100vw, 30vw"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center px-5 py-6 sm:px-7 sm:py-8">
          <h3 className="text-[34px] font-extrabold leading-[0.98] tracking-[0.01em] text-[#143271] sm:text-[38px]">
            {member.name}
          </h3>
          <p className="mt-2 text-sm font-bold uppercase tracking-[0.12em] text-[#6c35c3]">
            {member.roleTitle}
          </p>
          <p className="mt-5 max-w-3xl text-[15px] leading-8 text-[#2E2A33]/78 sm:text-base">
            {member.bio}
          </p>
        </div>
      </div>
    </article>
  );
}
