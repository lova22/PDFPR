import type { Metadata } from "next";
import ImageToPdfClient from "./ImageToPdfClient";
import AdPlaceholder from "@/components/ui/AdPlaceholder";

export const metadata: Metadata = {
  title: "JPG to PDF — Convert Images to PDF Online",
  description:
    "Convert JPG, PNG, and other images to a single PDF document. Free, secure, and works directly in your browser without uploading.",
};

export default function ImageToPdfPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-32 pb-20 min-h-screen">
      <div className="grid gap-8 items-start lg:grid-cols-[200px_1fr_200px]">
        {/* Left Ad */}
        <div className="hidden lg:block sticky top-8 h-[600px]">
          <AdPlaceholder layout="vertical" />
        </div>

        {/* Center Tool */}
        <div className="w-full min-w-0">
          <ImageToPdfClient />
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
