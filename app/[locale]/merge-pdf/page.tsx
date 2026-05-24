/**
 * Server Component — exports metadata for SEO, renders the client workspace.
 * The "use client" directive is in MergePdfClient.tsx, not here.
 */
import type { Metadata } from "next";
import MergePdfClient from "./MergePdfClient";

export const metadata: Metadata = {
  title: "Merge PDF — Combine PDFs Online for Free",
  description:
    "Merge multiple PDF files into one in seconds. 100% free, browser-side processing. Your files never leave your device.",
  keywords: ["merge PDF", "combine PDF", "join PDF", "PDF merger online"],
};

export default function MergePdfPage() {
  return <MergePdfClient />;
}
