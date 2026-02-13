import type { Metadata } from "next";
import { Baloo_2, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/auth/AuthProvider";

export const metadata: Metadata = {
  title: "Eagle Gymnastics Academy",
  description:
    "Children's gymnastics academy: recreational classes and competition training.",
  icons: {
    icon: "/brand/Logo.png",
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
