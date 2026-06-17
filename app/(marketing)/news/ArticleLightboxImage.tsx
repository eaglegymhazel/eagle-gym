"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { X } from "lucide-react"

type ArticleLightboxImageProps = {
  src: string
  alt: string
  sizes: string
  wrapperClassName: string
  imageClassName?: string
  priority?: boolean
}

export default function ArticleLightboxImage({
  src,
  alt,
  sizes,
  wrapperClassName,
  imageClassName = "object-cover",
  priority = false,
}: ArticleLightboxImageProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${wrapperClassName} block w-full group cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6c35c3]/45 focus-visible:ring-offset-2`}
        aria-label={`Open image: ${alt}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className={`${imageClassName} transition-transform duration-300 group-hover:scale-[1.01]`}
          sizes={sizes}
          priority={priority}
        />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[#120a22]/78 backdrop-blur-[3px]"
            aria-label="Close image"
          />

          <div className="relative z-10 flex h-[92vh] w-[96vw] items-center justify-center">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="96vw"
              className="object-contain drop-shadow-[0_40px_45px_rgba(0,0,0,0.45)]"
            />

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/65"
              aria-label="Close image"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
