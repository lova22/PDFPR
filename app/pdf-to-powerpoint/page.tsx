import type { Metadata } from "next";
import PdfToPowerpointClient from "./PdfToPowerpointClient";
import AdPlaceholder from "@/components/ui/AdPlaceholder";

export const metadata: Metadata = {
  title: "PDF to PowerPoint — Convert PDF to PPTX Online",
  description:
    "Convert your PDF documents into editable PowerPoint (PPTX) presentations instantly.",
};

export default function PdfToPowerpointPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-32 pb-20 min-h-screen">
      <div className="grid gap-8 items-start lg:grid-cols-[200px_1fr_200px]">
        {/* Left Ad */}
        <div className="hidden lg:block sticky top-8 h-[600px]">
          <AdPlaceholder layout="vertical" />
        </div>

        {/* Center Tool */}
        <div className="w-full min-w-0">
          <PdfToPowerpointClient />
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
