import type { Metadata } from "next";
import {
  FilePlus2,
  Scissors,
  Minimize2,
  FileOutput,
  FileInput,
  RotateCcw,
  Lock,
  Unlock,
  Image,
} from "lucide-react";
import ToolCard from "@/components/ui/ToolCard";

export const metadata: Metadata = {
  title: "PDFPro — Every PDF Tool You Need, Free & Secure",
  description:
    "Merge, split, compress, rotate, and convert PDFs for free. All processing happens in your browser — your files never leave your device.",
};

const tools = [
  {
    id: "tool-merge-pdf",
    href: "/merge-pdf",
    icon: FilePlus2,
    iconColor: "#818cf8",
    iconBg: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))",
    title: "Merge PDF",
    subtitle: "Combine multiple PDFs into one in the exact order you want.",
    badge: "Popular",
  },
  {
    id: "tool-split-pdf",
    href: "/split-pdf",
    icon: Scissors,
    iconColor: "#fb7185",
    iconBg: "linear-gradient(135deg, rgba(251,113,133,0.25), rgba(251,113,133,0.08))",
    title: "Split PDF",
    subtitle: "Extract specific pages or split a PDF into multiple files.",
  },
  {
    id: "tool-compress-pdf",
    href: "/compress-pdf",
    icon: Minimize2,
    iconColor: "#34d399",
    iconBg: "linear-gradient(135deg, rgba(52,211,153,0.25), rgba(52,211,153,0.08))",
    title: "Compress PDF",
    subtitle: "Reduce PDF file size without sacrificing quality.",
    badge: "Soon",
    disabled: true,
  },
  {
    id: "tool-pdf-to-word",
    href: "/pdf-to-word",
    icon: FileOutput,
    iconColor: "#60a5fa",
    iconBg: "linear-gradient(135deg, rgba(96,165,250,0.25), rgba(96,165,250,0.08))",
    title: "PDF to Word",
    subtitle: "Convert PDF documents to editable Word .docx files.",
    badge: "Soon",
    disabled: true,
  },
  {
    id: "tool-word-to-pdf",
    href: "/word-to-pdf",
    icon: FileInput,
    iconColor: "#f472b6",
    iconBg: "linear-gradient(135deg, rgba(244,114,182,0.25), rgba(244,114,182,0.08))",
    title: "Word to PDF",
    subtitle: "Transform Word documents into professional PDF files instantly.",
    badge: "Soon",
    disabled: true,
  },
  {
    id: "tool-rotate-pdf",
    href: "/rotate-pdf",
    icon: RotateCcw,
    iconColor: "#fbbf24",
    iconBg: "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.08))",
    title: "Rotate PDF",
    subtitle: "Rotate pages in your PDF to the correct orientation.",
  },
  {
    id: "tool-protect-pdf",
    href: "/protect-pdf",
    icon: Lock,
    iconColor: "#a78bfa",
    iconBg: "linear-gradient(135deg, rgba(167,139,250,0.25), rgba(167,139,250,0.08))",
    title: "Protect PDF",
    subtitle: "Add password protection to your sensitive PDF documents.",
    badge: "Soon",
    disabled: true,
  },
  {
    id: "tool-unlock-pdf",
    href: "/unlock-pdf",
    icon: Unlock,
    iconColor: "#06b6d4",
    iconBg: "linear-gradient(135deg, rgba(6,182,212,0.25), rgba(6,182,212,0.08))",
    title: "Unlock PDF",
    subtitle: "Remove password protection from PDFs you have access to.",
    badge: "Soon",
    disabled: true,
  },
  {
    id: "tool-pdf-to-image",
    href: "/pdf-to-image",
    icon: Image,
    iconColor: "#f97316",
    iconBg: "linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.08))",
    title: "PDF to Image",
    subtitle: "Convert PDF pages to high-resolution PNG or JPG images.",
    badge: "Soon",
    disabled: true,
  },
];

const stats = [
  { value: "100%", label: "Browser-Based" },
  { value: "0 MB", label: "Server Upload" },
  { value: "Free", label: "Forever" },
  { value: "9+", label: "PDF Tools" },
];

export default function HomePage() {
  return (
    <>
      {/* ================================================================
          HERO SECTION
      ================================================================ */}
      <section
        aria-labelledby="hero-headline"
        style={{
          paddingTop: "6rem",
          paddingBottom: "5rem",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div className="section-container">
          {/* Pill badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(99,102,241,0.12)",
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "999px",
              padding: "0.4rem 1rem",
              marginBottom: "2rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "#a5b4fc",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#22d3ee",
                display: "inline-block",
                boxShadow: "0 0 8px rgba(34,211,238,0.8)",
                animation: "pulse-glow 2s ease-in-out infinite",
              }}
              aria-hidden="true"
            />
            100% Free &bull; No Sign-up Required &bull; Browser-Side Processing
          </div>

          {/* Main headline */}
          <h1
            id="hero-headline"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
              maxWidth: "900px",
              margin: "0 auto 1.5rem",
            }}
          >
            Every tool you need to work with{" "}
            <span className="gradient-text">PDFs</span>
            <br />
            in one place.
          </h1>

          {/* Subheadline */}
          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.25rem)",
              color: "var(--text-secondary)",
              maxWidth: "620px",
              margin: "0 auto 2.5rem",
              lineHeight: 1.7,
            }}
          >
            Merge, split, compress, rotate and convert PDFs instantly.
            Powered entirely by your browser — your files{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              never leave your device.
            </strong>
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "4rem",
            }}
          >
            <a
              href="/merge-pdf"
              id="hero-cta-primary"
              className="btn-primary"
              style={{ fontSize: "1rem", padding: "0.875rem 2.25rem" }}
            >
              🚀 Start for Free
            </a>
            <a
              href="#tools"
              id="hero-cta-secondary"
              className="btn-secondary"
            >
              View All Tools ↓
            </a>
          </div>

          {/* Stats Row */}
          <div
            aria-label="Platform statistics"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "3rem",
              flexWrap: "wrap",
            }}
          >
            {stats.map((stat) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    letterSpacing: "-0.03em",
                  }}
                  className="gradient-text"
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          TOOLS GRID SECTION
      ================================================================ */}
      <section
        id="tools"
        aria-labelledby="tools-headline"
        style={{ paddingBottom: "6rem" }}
      >
        <div className="section-container">
          {/* Section header */}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h2
              id="tools-headline"
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "var(--text-primary)",
                marginBottom: "0.75rem",
              }}
            >
              All PDF Tools
            </h2>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "1.05rem",
                maxWidth: "500px",
                margin: "0 auto",
              }}
            >
              Click any tool below to get started instantly — no account required.
            </p>
          </div>

          {/* Grid */}
          <div
            role="list"
            aria-label="PDF tools"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.25rem",
            }}
            className="stagger-children"
          >
            {tools.map((tool) => (
              <div key={tool.id} role="listitem">
                <ToolCard {...tool} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          TRUST / FEATURE SECTION
      ================================================================ */}
      <section
        aria-labelledby="trust-headline"
        style={{
          padding: "5rem 0",
          borderTop: "1px solid var(--surface-border)",
        }}
      >
        <div className="section-container">
          <h2
            id="trust-headline"
            style={{
              textAlign: "center",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: "3rem",
              color: "var(--text-primary)",
            }}
          >
            Why Choose PDFPro?
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {[
              {
                emoji: "🔒",
                title: "Zero Server Upload",
                desc: "All PDF processing runs in your browser via WebAssembly. Your files are never transmitted over the internet.",
              },
              {
                emoji: "⚡",
                title: "Instant Processing",
                desc: "No waiting for server queues. PDF operations start immediately using the full power of your device.",
              },
              {
                emoji: "🌍",
                title: "100% Free",
                desc: "No subscriptions, no watermarks, no file size limits hidden behind a paywall. Free forever.",
              },
              {
                emoji: "🎯",
                title: "Professional Quality",
                desc: "Built on pdf-lib — a battle-tested library producing high-fidelity output that preserves fonts, images and metadata.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-card"
                style={{ padding: "1.75rem" }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>
                  {feature.emoji}
                </div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FOOTER
      ================================================================ */}
      <footer
        role="contentinfo"
        style={{
          borderTop: "1px solid var(--surface-border)",
          padding: "2rem 0",
          textAlign: "center",
        }}
      >
        <div className="section-container">
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
            © {new Date().getFullYear()} PDFPro. Built with privacy in mind.
            Your files never leave your browser.
          </p>
        </div>
      </footer>
    </>
  );
}
