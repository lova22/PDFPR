import type { Metadata } from "next";
import RichPdfEditorClient from "./RichPdfEditorClient";
import AdPlaceholder from "@/components/ui/AdPlaceholder";

export const metadata: Metadata = {
  title: "Rich PDF Editor — Edit PDF like Google Docs",
  description:
    "Convert your PDF to a flowable format and edit text, fonts, and formatting exactly like Microsoft Word or Google Docs.",
};

export default function RichPdfEditorPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-32 pb-20 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Ad */}
        <div className="hidden lg:block w-[200px] shrink-0 sticky top-8 h-[600px]">
          <AdPlaceholder layout="vertical" />
        </div>

        {/* Center Tool */}
        <div className="flex-1 min-w-0">
          <RichPdfEditorClient />
        </div>

        {/* Right Ad */}
        <div className="hidden lg:block w-[200px] shrink-0 sticky top-8 h-[600px]">
          <AdPlaceholder layout="vertical" />
        </div>
      </div>
      
      {/* Bottom Ad */}
      <div className="block lg:hidden mt-8">
        <AdPlaceholder layout="horizontal" />
      </div>
    </div>
  );
}
