import type { Metadata } from "next";
import WatermarkPdfClient from "./WatermarkPdfClient";
import AdPlaceholder from "@/components/ui/AdPlaceholder";

export const metadata: Metadata = {
  title: "Add Watermark to PDF — Secure your Documents Online",
  description:
    "Stamp a text watermark across all pages of your PDF. Fast, secure, and processing happens entirely in your browser.",
};

export default function WatermarkPdfPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-32 pb-20 min-h-screen">
      <div className="grid gap-8 items-start lg:grid-cols-[200px_1fr_200px]">
        {/* Left Ad */}
        <div className="hidden lg:block sticky top-8 h-[600px]">
          <AdPlaceholder layout="vertical" />
        </div>

        {/* Center Tool */}
        <div className="w-full min-w-0">
          <WatermarkPdfClient />
        </div>

        {/* Right Ad */}
        <div className="hidden lg:block sticky top-8 h-[600px]">
          <AdPlaceholder layout="vertical" />
        </div>

        {/* Bottom Ad */}
        <div className="block lg:hidden mt-8">
          <AdPlaceholder layout="horizontal" />
        </div>
      </div>
    </div>
  );
}
