"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type GalleryImage = {
  src: string;
  alt: string;
  aspect: string;
  objectPosition?: string;
};

const galleryImages: GalleryImage[] = [
  {
    src: "/brand/img7.JPG",
    alt: "Gymnastics training in the gym",
    aspect: "aspect-[4/5]",
    objectPosition: "center 35%",
  },
  {
    src: "/brand/img15.webp",
    alt: "Competitive gymnastics floor training",
    aspect: "aspect-[16/10]",
    objectPosition: "center",
  },
  {
    src: "/brand/img3.JPG",
    alt: "Gymnasts together in the club",
    aspect: "aspect-[4/3]",
    objectPosition: "center 25%",
  },
  {
    src: "/brand/img20.JPG",
    alt: "Gym equipment and training space",
    aspect: "aspect-[3/4]",
    objectPosition: "center",
  },
  {
    src: "/brand/img10.JPG",
    alt: "Pre-school gymnastics class",
    aspect: "aspect-[4/5]",
    objectPosition: "center 30%",
  },
  {
    src: "/brand/img13.webp",
    alt: "Recreational gymnastics session",
    aspect: "aspect-[16/11]",
    objectPosition: "center",
  },
  {
    src: "/brand/img18.JPG",
    alt: "Gymnast balancing during practice",
    aspect: "aspect-[4/5]",
    objectPosition: "center 30%",
  },
  {
    src: "/brand/img11.JPG",
    alt: "Young gymnast during class",
    aspect: "aspect-[3/4]",
    objectPosition: "center 20%",
  },
  {
    src: "/brand/img1.JPG",
    alt: "Gymnastics equipment in the academy",
    aspect: "aspect-[4/3]",
    objectPosition: "center",
  },
  {
    src: "/brand/img22.JPG",
    alt: "Gymnasts posing together",
    aspect: "aspect-[5/4]",
    objectPosition: "center 28%",
  },
  {
    src: "/brand/img14.webp",
    alt: "Training session on apparatus",
    aspect: "aspect-[4/5]",
    objectPosition: "center",
  },
  {
    src: "/brand/img4.JPG",
    alt: "Gymnastics class in action",
    aspect: "aspect-[4/5]",
    objectPosition: "center 35%",
  },
  {
    src: "/brand/img23.JPG",
    alt: "Team members at the academy",
    aspect: "aspect-[4/5]",
    objectPosition: "center 25%",
  },
  {
    src: "/brand/img8.JPG",
    alt: "Gymnastics coaching moment",
    aspect: "aspect-[16/11]",
    objectPosition: "center",
  },
  {
    src: "/brand/img5.JPG",
    alt: "Gym activity during a class",
    aspect: "aspect-[3/4]",
    objectPosition: "center",
  },
  {
    src: "/brand/img19.JPG",
    alt: "Gym equipment and mats",
    aspect: "aspect-[4/3]",
    objectPosition: "center",
  },
  {
    src: "/brand/img2.JPG",
    alt: "Gymnastics space inside the academy",
    aspect: "aspect-[16/10]",
    objectPosition: "center",
  },
  {
    src: "/brand/img16.JPG",
    alt: "Gymnast performing during practice",
    aspect: "aspect-[4/5]",
    objectPosition: "center 22%",
  },
  {
    src: "/brand/img21.JPG",
    alt: "Classroom training environment",
    aspect: "aspect-[4/3]",
    objectPosition: "center",
  },
  {
    src: "/brand/img9.JPG",
    alt: "Gymnastics team practice",
    aspect: "aspect-[4/5]",
    objectPosition: "center 28%",
  },
  {
    src: "/brand/img17.webp",
    alt: "Training inside the Eagle Gymnastics Academy",
    aspect: "aspect-[4/5]",
    objectPosition: "center",
  },
  {
    src: "/brand/img6.JPG",
    alt: "Gymnastics session in progress",
    aspect: "aspect-[16/11]",
    objectPosition: "center",
  },
  {
    src: "/brand/img12.JPG",
    alt: "Gymnast moving through a routine",
    aspect: "aspect-[4/5]",
    objectPosition: "center 28%",
  },
];

const focusableSelector =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function GalleryTile({
  image,
  index,
  reducedMotion,
  onOpen,
}: {
  image: GalleryImage;
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
        layoutId={`gallery-image-${image.src}`}
        className={["relative w-full overflow-hidden", image.aspect].join(" ")}
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
            style={{ objectPosition: image.objectPosition ?? "center" }}
            priority={index < 5}
          />
        </motion.div>
      </motion.div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,9,33,0)_45%,rgba(17,9,33,0.34)_100%)] opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
    </motion.button>
  );
}

export default function GalleryClient() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const activeImage =
    activeIndex === null ? null : galleryImages[activeIndex] ?? null;

  const showPreviousImage = () => {
    setActiveIndex((current) =>
      current === null
        ? 0
        : (current - 1 + galleryImages.length) % galleryImages.length,
    );
  };

  const showNextImage = () => {
    setActiveIndex((current) =>
      current === null ? 0 : (current + 1) % galleryImages.length,
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
  }, [activeIndex]);

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
          <div className="mb-8 flex flex-col gap-3 sm:mb-10">
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-[#143271] sm:text-5xl">
              Gallery
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[#2a203c]/76 sm:text-lg">
              Moments from training, competition, and everyday life inside Eagle
              Gymnastics Academy.
            </p>
          </div>

          <div className="columns-2 gap-3 space-y-3 sm:columns-2 sm:gap-4 sm:space-y-4 lg:columns-3 xl:columns-4">
            {galleryImages.map((image, index) => (
              <GalleryTile
                key={image.src}
                image={image}
                index={index}
                reducedMotion={Boolean(reducedMotion)}
                onOpen={() => setActiveIndex(index)}
              />
            ))}
          </div>
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
                  layoutId={`gallery-image-${activeImage.src}`}
                  className="relative overflow-hidden shadow-[0_40px_90px_-45px_rgba(0,0,0,0.9)]"
                >
                  <img
                    src={activeImage.src}
                    alt={activeImage.alt}
                    className="block max-h-[90vh] max-w-full object-contain"
                  />
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
