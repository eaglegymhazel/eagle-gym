import type { ReactNode } from "react";

type MarketingPageIntroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  eyebrowClassName?: string;
  children?: ReactNode;
};

export default function MarketingPageIntro({
  eyebrow,
  title,
  description,
  className = "",
  eyebrowClassName = "",
  children,
}: MarketingPageIntroProps) {
  return (
    <header
      className={[
        "mb-8 rounded-3xl border border-[#6c35c3]/15 bg-gradient-to-br from-white via-[#fbf8ff] to-[#f6efff]",
        "px-5 py-6 shadow-[0_16px_34px_-26px_rgba(45,26,78,0.45)] sm:px-8 sm:py-7",
        className,
      ].join(" ")}
    >
      <div className="space-y-3">
        {eyebrow ? (
          <p
            className={[
              "text-xs font-semibold uppercase tracking-[0.16em] text-[#6c35c3]",
              eyebrowClassName,
            ].join(" ")}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-4xl font-bold tracking-[-0.02em] text-[#2a0c4f] sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-3xl text-base leading-7 text-[#2a0c4f]/80 sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {children ? <div className="mt-6">{children}</div> : null}
    </header>
  );
}
