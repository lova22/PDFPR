import type { Metadata } from "next";
import PdfToImageClient from "./PdfToImageClient";
import AdPlaceholder from "@/components/ui/AdPlaceholder";

export const metadata: Metadata = {
  title: "PDF to Image — Convert PDF to JPG/PNG Online",
  description:
    "Convert your PDF pages to high-resolution JPG or PNG images instantly. Processing happens entirely in your browser. Free, secure, and fast.",
};

export default function PdfToImagePage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-32 pb-20 min-h-screen">
      
      <div className="grid gap-8 items-start lg:grid-cols-[200px_1fr_200px]">
        
        {/* Left Ad (Desktop Only) */}
        <div className="hidden lg:block sticky top-8 h-[600px]">
          <AdPlaceholder layout="vertical" />
        </div>

        {/* Center Tool */}
        <div className="w-full min-w-0">
          <PdfToImageClient />
        </div>

        {/* Right Ad (Desktop Only) */}
        <div className="hidden lg:block sticky top-8 h-[600px]">
          <AdPlaceholder layout="vertical" />
        </div>

        {/* Bottom Ad (Mobile Only) */}
        <div className="block lg:hidden mt-8">
          <AdPlaceholder layout="horizontal" />
        </div>

      </div>

    </div>
  );
}
