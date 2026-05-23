import type { Metadata } from "next";
import { Minimize2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Compress PDF — Reduce PDF File Size Online",
  description:
    "Reduce PDF file size without visible quality loss. Free, browser-side compression — no file uploads.",
};

export default function CompressPdfPage() {
  return (
    <div className="section-container" style={{ paddingTop: "3rem", paddingBottom: "6rem" }}>
      <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto" }}>
        <div
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "linear-gradient(135deg, rgba(52,211,153,0.3), rgba(52,211,153,0.1))",
            border: "1px solid rgba(52,211,153,0.3)",
            marginBottom: "1.25rem",
          }}
        >
          <Minimize2 size={30} color="#34d399" strokeWidth={1.75} />
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
          Compress PDF
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", marginBottom: "2rem" }}>
          Reduce your PDF size without sacrificing quality.
        </p>
        <div
          style={{
            padding: "3rem",
            borderRadius: 20,
            border: "2px dashed rgba(52,211,153,0.25)",
            background: "rgba(52,211,153,0.04)",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          🚧 Compress PDF tool coming soon.{" "}
          <a href="/merge-pdf" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>
            Try Merge PDF
          </a>.
        </div>
      </div>
    </div>
  );
}
