"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GalleryCategory, GalleryImageItem } from "@/lib/sanity/gallery";

const focusableSelector =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const categoryLabels: Record<GalleryCategory | "all", string> = {
  all: "All",
  general: "General",
  competitions: "Competitions",
  events: "Events",
  fundraising: "Fundraising",
  awards: "Awards",
};

function GalleryTile({
  image,
  index,
  reducedMotion,
  onOpen,
}: {
  image: GalleryImageItem;
  index: number;
  reducedMotion: boolean;
  onOpen: () => void;
}) {
  const tileRef = useRef<HTMLButtonElement | null>(null);
  const driftX = useMotionValue(0);
  const driftY = useMotionValue(0);
  const springX = useSpring(driftX, { stiffness: 180, damping: 24, mass: 0.45 });
  const springY = useSpring(driftY, { stiffness: 180, damping: 24, mass: 0.45 });

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (reducedMotion || !tileRef.current) return;
    const rect = tileRef.current.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (event.clientY - rect.top) / rect.height - 0.5;
    driftX.set(relativeX * 8);
    driftY.set(relativeY * 8);
  };

  const resetDrift = () => {
    driftX.set(0);
    driftY.set(0);
  };

  return (
    <motion.button
      ref={tileRef}
      type="button"
      onClick={onOpen}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetDrift}
      onBlur={resetDrift}
      initial={reducedMotion ? undefined : { opacity: 0, y: 28 }}
      whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={
        reducedMotion
          ? undefined
          : {
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
              delay: Math.min(index * 0.028, 0.28),
            }
      }
      whileHover={reducedMotion ? undefined : { y: -4, scale: 1.01 }}
      className="group relative mb-3 block w-full break-inside-avoid overflow-hidden bg-[#ede6f7] text-left shadow-[0_16px_34px_-26px_rgba(22,14,38,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7fb] sm:mb-4"
    >
      <motion.div
        layoutId={`gallery-image-${image.id}`}
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: `${image.width} / ${image.height}` }}
      >
        <motion.div
          style={
            reducedMotion
              ? undefined
              : {
                  x: springX,
                  y: springY,
                }
          }
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
          className="absolute inset-0"
        >
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 767px) 50vw, (max-width: 1199px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.045] group-focus-visible:scale-[1.045]"
            priority={index < 5}
          />
        </motion.div>
      </motion.div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,9,33,0)_45%,rgba(17,9,33,0.34)_100%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
    </motion.button>
  );
}

export default function GalleryClient({ images }: { images: GalleryImageItem[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<GalleryCategory | "all">("all");
  const reducedMotion = useReducedMotion();
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const availableCategories = useMemo(() => {
    const categories = new Set<GalleryCategory>();
    images.forEach((image) => categories.add(image.category));
    return ["all", ...Array.from(categories)] as Array<GalleryCategory | "all">;
  }, [images]);

  const filteredImages = useMemo(() => {
    if (activeCategory === "all") {
      return images;
    }
    return images.filter((image) => image.category === activeCategory);
  }, [activeCategory, images]);

  useEffect(() => {
    setActiveIndex(null);
  }, [activeCategory]);

  const activeImage =
    activeIndex === null ? null : filteredImages[activeIndex] ?? null;

  const showPreviousImage = () => {
    setActiveIndex((current) =>
      current === null
        ? 0
        : (current - 1 + filteredImages.length) % filteredImages.length,
    );
  };

  const showNextImage = () => {
    setActiveIndex((current) =>
      current === null ? 0 : (current + 1) % filteredImages.length,
    );
  };

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setActiveIndex(null);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextImage();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousImage();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = document.querySelector<HTMLElement>("[data-gallery-dialog]");
      if (!dialog) return;
      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (current === first || !dialog.contains(current)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, filteredImages.length]);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      showNextImage();
      return;
    }

    showPreviousImage();
  };

  return (
    <>
      <section className="w-full px-4 pb-14 pt-10 sm:px-6 sm:pb-16 sm:pt-12">
        <div className="mx-auto w-full max-w-[1500px]">
          <div className="mb-8 flex flex-col gap-4 sm:mb-10">
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-[#143271] sm:text-5xl">
                Gallery
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[#2a203c]/76 sm:text-lg">
                Photos from classes, competitions, fundraisers, awards, and club events.
              </p>
            </div>

            {availableCategories.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => {
                  const isActive = activeCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setActiveCategory(category)}
                      className={[
                        "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors",
                        isActive
                          ? "bg-[#6c35c3] text-white"
                          : "bg-white text-[#6c35c3] hover:bg-[#f3ecfb]",
                      ].join(" ")}
                    >
                      {categoryLabels[category]}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {filteredImages.length === 0 ? (
            <div className="rounded-3xl border border-[#ded4ef] bg-white px-6 py-12 text-center shadow-[0_18px_45px_-30px_rgba(15,23,42,0.25)]">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#6c35c3]">
                Gallery
              </p>
              <h2 className="mt-3 text-2xl font-bold text-[#143271]">
                No images yet
              </h2>
              <p className="mt-3 text-base text-[#2E2A33]/72">
                Upload photos in Sanity Studio and they will appear here.
              </p>
            </div>
          ) : (
            <div className="columns-2 gap-3 space-y-3 sm:columns-2 sm:gap-4 sm:space-y-4 lg:columns-3 xl:columns-4">
              {filteredImages.map((image, index) => (
                <GalleryTile
                  key={image.id}
                  image={image}
                  index={index}
                  reducedMotion={Boolean(reducedMotion)}
                  onOpen={() => setActiveIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {activeImage ? (
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center p-3 sm:p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.18 }}
          >
            <motion.button
              type="button"
              onClick={() => setActiveIndex(null)}
              className="absolute inset-0 bg-[#120a22]/72 backdrop-blur-[3px]"
              aria-label="Close gallery image"
            />

            <motion.div
              data-gallery-dialog
              role="dialog"
              aria-modal="true"
              aria-label="Gallery image viewer"
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.992 }}
              transition={
                reducedMotion
                  ? { duration: 0.1 }
                  : { type: "spring", stiffness: 260, damping: 28, mass: 0.85 }
              }
              className="relative z-10 flex h-full w-full max-w-6xl items-center justify-center"
            >
              <button
                type="button"
                onClick={showPreviousImage}
                className="absolute left-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/18 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/65 md:inline-flex"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>

              <div
                className="relative flex max-h-[90vh] w-full items-center justify-center"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <motion.div
                  layoutId={`gallery-image-${activeImage.id}`}
                  className="relative overflow-hidden shadow-[0_40px_90px_-45px_rgba(0,0,0,0.9)]"
                >
                  <img
                    src={activeImage.src}
                    alt={activeImage.alt}
                    className="block max-h-[90vh] max-w-full object-contain"
                  />
                  {activeImage.alt ? (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(18,10,34,0)_0%,rgba(18,10,34,0.82)_100%)] px-4 pb-4 pt-10 sm:px-5 sm:pb-5">
                      <p className="max-w-2xl text-sm font-medium leading-6 text-white/92 sm:text-[15px]">
                        {activeImage.alt}
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              </div>

              <button
                type="button"
                onClick={showNextImage}
                className="absolute right-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/18 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/65 md:inline-flex"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setActiveIndex(null)}
                className="absolute right-3 top-3 z-20 inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/18 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/65 sm:right-4 sm:top-4"
                aria-label="Close gallery image"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
