import type { Metadata } from "next";
import { Baloo_2, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/auth/AuthProvider";
import {
  absoluteUrl,
  defaultDescription,
  defaultTitle,
  siteName,
  siteUrl,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  applicationName: siteName,
  alternates: {
    canonical: "/",
  },
  keywords: [
    "gymnastics Paisley",
    "children's gymnastics Paisley",
    "gymnastics classes Paisley",
    "recreational gymnastics",
    "competition gymnastics",
    "birthday parties Paisley",
    "summer camps Paisley",
    "Eagle Gymnastics Academy",
  ],
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: siteUrl,
    siteName,
    title: defaultTitle,
    description: defaultDescription,
    images: [
      {
        url: absoluteUrl("/brand/new_logo1.png"),
        width: 1200,
        height: 1200,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [absoluteUrl("/brand/new_logo1.png")],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/brand/new_logo1.png" },
    ],
  },
};

const geistSans = Baloo_2({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: siteName,
    url: siteUrl,
    image: absoluteUrl("/brand/new_logo1.png"),
    telephone: "+44 141 840 1454",
    email: "Eaglegym1@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "11 Knox St",
      addressLocality: "Paisley",
      postalCode: "PA1 2QJ",
      addressCountry: "GB",
    },
    sameAs: [
      "https://www.facebook.com/eaglegymnasticsacademy/",
      "https://www.instagram.com/eaglegymnasticsacademy/",
    ],
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={{ backgroundColor: "#faf7fb" }}
    >
      <body
        className="min-h-screen overflow-x-hidden bg-[#faf7fb] text-[#2E2A33] antialiased"
        style={{ backgroundColor: "#faf7fb" }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
