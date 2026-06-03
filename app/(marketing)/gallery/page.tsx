import type { Metadata } from "next";
import GalleryClient from "./GalleryClient";
import { getGalleryImages } from "@/lib/sanity/gallery";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Browse photos from classes, events, and club life at Eagle Gymnastics Academy.",
  alternates: {
    canonical: "/gallery",
  },
};

export default async function GalleryPage() {
  const images = await getGalleryImages();
  return <GalleryClient images={images} />;
}
