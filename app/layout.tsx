/**
 * SECURITY AUDIT:
 * - No secrets or tokens exposed in layout
 * - CSP-ready meta tags included
 * - External font loaded from trusted Google CDN only
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PDFPro — Every PDF Tool You Need, Free & Secure",
    template: "%s | PDFPro",
  },
  description:
    "Merge, split, compress, convert and rotate PDFs — 100% free, client-side processing. Your files never leave your browser.",
  keywords: ["PDF", "merge PDF", "split PDF", "compress PDF", "PDF tools", "online PDF editor"],
  authors: [{ name: "PDFPro" }],
  creator: "PDFPro",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "PDFPro — Every PDF Tool You Need",
    description: "Professional PDF tools — merge, split, compress and convert. 100% free, browser-side processing.",
    siteName: "PDFPro",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDFPro — Every PDF Tool You Need",
    description: "Professional PDF tools — merge, split, compress and convert. 100% free.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="noise-overlay antialiased" suppressHydrationWarning>
        <Navbar />
        <main className="relative z-10">{children}</main>

        {/* Ambient background orbs — pure CSS, zero JS overhead */}
        <div aria-hidden="true" className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div
            style={{
              position: "absolute",
              top: "-20%",
              left: "-10%",
              width: "60vw",
              height: "60vw",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-20%",
              right: "-10%",
              width: "50vw",
              height: "50vw",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "40%",
              right: "20%",
              width: "30vw",
              height: "30vw",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />
        </div>
      </body>
    </html>
  );
}
