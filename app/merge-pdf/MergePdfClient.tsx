"use client";

/**
 * SECURITY AUDIT:
 * - All PDF processing is client-side only (pdf-lib in the browser).
 * - Files are validated with magic-byte check BEFORE being passed to pdf-lib.
 * - No file data is sent to any server or third-party service.
 * - Object URLs are revoked after 60 s to prevent memory leaks.
 * - Error messages shown to the user are sanitized — no stack traces exposed.
 */

import { useState, useCallback } from "react";
import { FilePlus2, Download, Trash2, AlertCircle, CheckCircle2, GripVertical } from "lucide-react";
import DropZone from "@/components/ui/DropZone";
import ProgressBar from "@/components/ui/ProgressBar";
import { mergePdfs, type MergeProgressEvent } from "@/lib/pdf/merge";

type MergeStatus = "idle" | "processing" | "done" | "error";

export default function MergePdfClient() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<MergeStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Callbacks ─────────────────────────────────────────────────────────────

  const handleFilesAccepted = useCallback((newFiles: File[]) => {
    setFiles((prev) => {
      // Deduplicate by name+size to avoid re-adding the same file
      const existing = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const unique = newFiles.filter((f) => !existing.has(`${f.name}:${f.size}`));
      return [...prev, ...unique];
    });
    setStatus("idle");
    setErrorMsg(null);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearAll = useCallback(() => {
    setFiles([]);
    setStatus("idle");
    setProgress(0);
    setErrorMsg(null);
  }, []);

  const handleMerge = useCallback(async () => {
    if (files.length < 2) return;

    setStatus("processing");
    setProgress(0);
    setErrorMsg(null);

    const onProgress = (event: MergeProgressEvent) => {
      setProgress(event.percent);
      const labels: Record<MergeProgressEvent["stage"], string> = {
        loading: `Loading "${event.currentFile ?? ""}"…`,
        merging: `Merging "${event.currentFile ?? ""}"…`,
        saving:  "Saving merged PDF…",
        done:    "Done!",
      };
      setProgressLabel(labels[event.stage]);
    };

    try {
      await mergePdfs(files, "merged.pdf", onProgress);
      setStatus("done");
    } catch (err: unknown) {
      // SECURITY: only expose the error message, never the full stack trace
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during merging.";
      setErrorMsg(message);
      setStatus("error");
    }
  }, [files]);

  // ── Computed UI state ──────────────────────────────────────────────────────
  const canMerge = files.length >= 2 && status !== "processing";
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const totalSizeMb = (totalSize / 1024 / 1024).toFixed(2);

  return (
    <div className="section-container" style={{ paddingTop: "3rem", paddingBottom: "6rem" }}>

      {/* ── Page Header ── */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))",
            border: "1px solid rgba(99,102,241,0.3)",
            marginBottom: "1.25rem",
          }}
        >
          <FilePlus2 size={30} color="#818cf8" strokeWidth={1.75} />
        </div>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 2.75rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            marginBottom: "0.75rem",
          }}
        >
          Merge PDF
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "1.05rem",
            maxWidth: "480px",
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Combine multiple PDFs into one document — in any order you choose.
          Processing happens entirely in your browser.
        </p>
      </div>

      {/* ── Main Workspace ── */}
      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Drop Zone */}
        <DropZone
          onFilesAccepted={handleFilesAccepted}
          maxFiles={30}
          existingFiles={files}
          onRemoveFile={handleRemoveFile}
        />

        {/* File count + total size summary */}
        {files.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1.25rem",
              padding: "0.75rem 1rem",
              borderRadius: "10px",
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.12)",
            }}
          >
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text-primary)" }}>{files.length}</strong>{" "}
              file{files.length !== 1 ? "s" : ""} selected &nbsp;·&nbsp;{" "}
              <strong style={{ color: "var(--text-primary)" }}>{totalSizeMb} MB</strong> total
            </span>
            <button
              id="clear-all-btn"
              type="button"
              onClick={handleClearAll}
              aria-label="Clear all files"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
                cursor: "pointer",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <Trash2 size={13} /> Clear All
            </button>
          </div>
        )}

        {/* Ordering hint */}
        {files.length >= 2 && status === "idle" && (
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <GripVertical size={13} aria-hidden="true" />
            PDFs will be merged in the order listed above.
          </p>
        )}

        {/* Progress bar */}
        {status === "processing" && (
          <div
            role="status"
            aria-live="polite"
            style={{ marginTop: "1.75rem" }}
          >
            <ProgressBar value={progress} label={progressLabel} />
          </div>
        )}

        {/* Success state */}
        {status === "done" && (
          <div
            role="status"
            aria-live="polite"
            style={{
              marginTop: "1.5rem",
              padding: "1rem 1.25rem",
              borderRadius: "12px",
              background: "rgba(34,211,238,0.08)",
              border: "1px solid rgba(34,211,238,0.25)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              color: "#22d3ee",
              fontWeight: 500,
              fontSize: "0.9rem",
            }}
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            Your merged PDF has been downloaded successfully!
          </div>
        )}

        {/* Error state */}
        {status === "error" && errorMsg && (
          <div
            role="alert"
            style={{
              marginTop: "1.5rem",
              padding: "1rem 1.25rem",
              borderRadius: "12px",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.25)",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              color: "var(--error)",
              fontSize: "0.875rem",
              lineHeight: 1.55,
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
            <div>
              <strong>Merge failed:</strong> {errorMsg}
            </div>
          </div>
        )}

        {/* Merge CTA */}
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <button
            id="merge-pdf-btn"
            type="button"
            className="btn-primary"
            onClick={handleMerge}
            disabled={!canMerge}
            aria-disabled={!canMerge}
            aria-label={
              files.length < 2
                ? "Add at least 2 PDF files to merge"
                : `Merge ${files.length} PDFs`
            }
            style={{
              fontSize: "1.05rem",
              padding: "0.9rem 2.5rem",
              opacity: canMerge ? 1 : 0.45,
              cursor: canMerge ? "pointer" : "not-allowed",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {status === "processing" ? (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-block",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
                Merging…
              </>
            ) : (
              <>
                <Download size={18} aria-hidden="true" />
                {files.length < 2 ? "Add 2+ PDFs to Merge" : `Merge ${files.length} PDFs`}
              </>
            )}
          </button>

          {files.length < 2 && (
            <p
              style={{
                marginTop: "0.75rem",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
              }}
            >
              Add at least 2 PDF files to enable merging.
            </p>
          )}
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
