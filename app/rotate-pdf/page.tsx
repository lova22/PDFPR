import type { Metadata } from "next";
import RotatePdfClient from "./RotatePdfClient";
import AdPlaceholder from "@/components/ui/AdPlaceholder";

export const metadata: Metadata = {
  title: "Rotate PDF — Rotate Pages Online for Free",
  description:
    "Rotate individual PDF pages or all pages at once. Free, browser-side processing — no uploads needed.",
};

export default function RotatePdfPage() {
  return (
    <div className="section-container" style={{ paddingTop: "3rem", paddingBottom: "6rem" }}>
      
      <div className="rotate-ad-layout">
        
        {/* Left Ad (Desktop Only) */}
        <div className="ad-left">
          <AdPlaceholder layout="vertical" />
        </div>

        {/* Center Tool */}
        <div className="rotate-tool-center">
          <RotatePdfClient />
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
        .rotate-ad-layout {
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
        .rotate-tool-center {
          min-width: 0;
          width: 100%;
        }

        /* Desktop Breakpoint */
        @media (min-width: 1024px) {
          .rotate-ad-layout {
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
