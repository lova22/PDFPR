import type { Metadata } from "next";
import { FileInput } from "lucide-react";

export const metadata: Metadata = {
  title: "Word to PDF — Convert DOCX to PDF Online",
  description:
    "Convert Microsoft Word documents to PDF format instantly. Free online Word to PDF converter.",
};

export default function WordToPdfPage() {
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
            background: "linear-gradient(135deg, rgba(244,114,182,0.3), rgba(244,114,182,0.1))",
            border: "1px solid rgba(244,114,182,0.3)",
            marginBottom: "1.25rem",
          }}
        >
          <FileInput size={30} color="#f472b6" strokeWidth={1.75} />
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
          Word to PDF
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", marginBottom: "2rem" }}>
          Transform Word documents into professional PDF files instantly.
        </p>
        <div
          style={{
            padding: "3rem",
            borderRadius: 20,
            border: "2px dashed rgba(244,114,182,0.25)",
            background: "rgba(244,114,182,0.04)",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          🚧 Word to PDF tool coming soon.{" "}
          <a href="/merge-pdf" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>
            Try Merge PDF
          </a>.
        </div>
      </div>
    </div>
  );
}
