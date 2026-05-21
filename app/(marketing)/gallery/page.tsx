import GalleryClient from "./GalleryClient";
import { getGalleryImages } from "@/lib/sanity/gallery";

export default async function GalleryPage() {
  const images = await getGalleryImages();
  return <GalleryClient images={images} />;
}
