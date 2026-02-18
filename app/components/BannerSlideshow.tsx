"use client";

export default function BannerSlideshow() {
  return (
    <section
      className="relative h-[21.75rem] w-full overflow-hidden"
      aria-label="Eagle Gymnastics Academy banner"
    >
      <div
        className="absolute inset-0 bg-fixed bg-cover bg-no-repeat"
        style={{
          backgroundImage: "url('/brand/banner.png')",
          backgroundPosition: "center 62%",
        }}
      />
    </section>
  );
}
