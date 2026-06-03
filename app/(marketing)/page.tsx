import type { Metadata } from "next";
import HomePageClient from "./HomePageClient";
import { defaultDescription } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Children's Gymnastics Classes in Paisley",
  description: defaultDescription,
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return <HomePageClient />;
}
