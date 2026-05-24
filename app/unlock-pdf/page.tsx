import type { Metadata } from "next";
import UnlockPdfClient from "./UnlockPdfClient";
import AdPlaceholder from "@/components/ui/AdPlaceholder";

export const metadata: Metadata = {
  title: "Unlock PDF — Remove PDF Password Online",
  description:
    "Remove passwords and security from your PDF documents securely. Fast, free, and completely online.",
};

export default function UnlockPdfPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-32 pb-20 min-h-screen">
      
      <div className="grid gap-8 items-start lg:grid-cols-[200px_1fr_200px]">
        
        {/* Left Ad (Desktop Only) */}
        <div className="hidden lg:block sticky top-8 h-[600px]">
          <AdPlaceholder layout="vertical" />
        </div>

        {/* Center Tool */}
        <div className="w-full min-w-0">
          <UnlockPdfClient />
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
