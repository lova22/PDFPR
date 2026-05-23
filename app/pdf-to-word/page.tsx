import type { Metadata } from "next";
import { FileOutput } from "lucide-react";

export const metadata: Metadata = {
  title: "PDF to Word — Convert PDF to Editable DOCX",
  description:
    "Convert PDF files to editable Microsoft Word documents. Free online PDF to DOCX converter.",
};

export default function PdfToWordPage() {
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
            background: "linear-gradient(135deg, rgba(96,165,250,0.3), rgba(96,165,250,0.1))",
            border: "1px solid rgba(96,165,250,0.3)",
            marginBottom: "1.25rem",
          }}
        >
          <FileOutput size={30} color="#60a5fa" strokeWidth={1.75} />
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: "1rem" }}>
          PDF to Word
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", marginBottom: "2rem" }}>
          Convert your PDFs into fully editable Word documents.
        </p>
        <div
          style={{
            padding: "3rem",
            borderRadius: 20,
            border: "2px dashed rgba(96,165,250,0.25)",
            background: "rgba(96,165,250,0.04)",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
          }}
        >
          🚧 PDF to Word tool coming soon.{" "}
          <a href="/merge-pdf" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>
            Try Merge PDF
          </a>.
        </div>
      </div>
    </div>
  );
}
