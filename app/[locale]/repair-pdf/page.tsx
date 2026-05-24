import type { Metadata } from "next";
import RepairPdfClient from "./RepairPdfClient";
import AdPlaceholder from "@/components/ui/AdPlaceholder";

export const metadata: Metadata = {
  title: "Repair PDF — Fix Corrupted PDF Files Online",
  description:
    "Repair damaged or corrupted PDF files so you can open and read them again.",
};

export default function RepairPdfPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-32 pb-20 min-h-screen">
      <div className="grid gap-8 items-start lg:grid-cols-[200px_1fr_200px]">
        {/* Left Ad */}
        <div className="hidden lg:block sticky top-8 h-[600px]">
          <AdPlaceholder layout="vertical" />
        </div>

        {/* Center Tool */}
        <div className="w-full min-w-0">
          <RepairPdfClient />
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
