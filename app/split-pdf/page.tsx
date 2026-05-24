import type { Metadata } from "next";
import SplitPdfClient from "./SplitPdfClient";
import AdPlaceholder from "@/components/ui/AdPlaceholder";

export const metadata: Metadata = {
  title: "Split PDF — Extract Pages from Any PDF",
  description:
    "Split a PDF into individual pages or extract specific page ranges. Free, browser-side processing — no uploads needed.",
};

export default function SplitPdfPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-32 pb-20 min-h-screen">
      
      <div className="split-ad-layout">
        
        {/* Left Ad (Desktop Only) */}
        <div className="ad-left">
          <AdPlaceholder layout="vertical" />
        </div>

        {/* Center Tool */}
        <div className="split-tool-center">
          <SplitPdfClient />
        </div>

        {/* Right Ad (Desktop Only) */}
        <div className="ad-right">
          <AdPlaceholder layout="vertical" />
        </div>

        {/* Bottom Ad (Mobile Only) */}
        <div className="ad-bottom">
          <AdPlaceholder layout="horizontal" />
        </div>

      </div>

      <style>{`
        .split-ad-layout {
          display: grid;
          gap: 2rem;
          align-items: start;
        }
        .ad-left, .ad-right {
          display: none;
          position: sticky;
          top: 2rem;
          height: 600px;
        }
        .ad-bottom {
          display: block;
          margin-top: 2rem;
        }
        .split-tool-center {
          min-width: 0;
          width: 100%;
        }

        /* Desktop Breakpoint */
        @media (min-width: 1024px) {
          .split-ad-layout {
            grid-template-columns: 200px 1fr 200px;
            gap: 2.5rem;
          }
          .ad-left, .ad-right {
            display: block;
          }
          .ad-bottom {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
