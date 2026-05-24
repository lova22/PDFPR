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
import { FilePlus2, Download, Trash2, AlertCircle, CheckCircle2, GripVertical, Loader2 } from "lucide-react";
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
    <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-32 pb-20 min-h-screen">
      <div className="text-center mb-16 relative">
        <div className="bg-indigo-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FilePlus2 className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Merge PDF
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Combine multiple PDFs into one document — in any order you choose.
          Processing happens entirely in your browser securely.
        </p>
      </div>

      {/* ── Main Workspace ── */}
      <div className="max-w-3xl mx-auto">

        {/* Drop Zone */}
        <DropZone
          onFilesAccepted={handleFilesAccepted}
          maxFiles={30}
          existingFiles={files}
          onRemoveFile={handleRemoveFile}
        />

        {/* File count + total size summary */}
        {files.length > 0 && (
          <div className="flex justify-between items-center mt-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
            <span className="text-sm text-gray-600 font-medium">
              <strong className="text-gray-900">{files.length}</strong>{" "}
              file{files.length !== 1 ? "s" : ""} selected &nbsp;·&nbsp;{" "}
              <strong className="text-gray-900">{totalSizeMb} MB</strong> total
            </span>
            <button
              id="clear-all-btn"
              type="button"
              onClick={handleClearAll}
              aria-label="Clear all files"
              className="flex items-center gap-2 text-gray-500 hover:text-red-600 text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          </div>
        )}

        {/* Ordering hint */}
        {files.length >= 2 && status === "idle" && (
          <p className="mt-4 text-sm text-gray-500 text-center flex items-center justify-center gap-2 font-medium">
            <GripVertical className="w-4 h-4" aria-hidden="true" />
            PDFs will be merged in the order listed above.
          </p>
        )}

        {/* Progress bar */}
        {status === "processing" && (
          <div role="status" aria-live="polite" className="mt-8">
            <ProgressBar value={progress} label={progressLabel} />
          </div>
        )}

        {/* Success state */}
        {status === "done" && (
          <div
            role="status"
            aria-live="polite"
            className="mt-8 p-6 rounded-xl bg-green-50 border border-green-200 flex items-center gap-4 text-green-700 font-medium"
          >
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
            Your merged PDF has been downloaded successfully!
          </div>
        )}

        {/* Error state */}
        {status === "error" && errorMsg && (
          <div
            role="alert"
            className="mt-8 p-6 rounded-xl bg-red-50 border border-red-200 flex items-start gap-4 text-red-700 text-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong>Merge failed:</strong> {errorMsg}
            </div>
          </div>
        )}

        {/* Merge CTA */}
        <div className="mt-10 text-center">
          <button
            id="merge-pdf-btn"
            type="button"
            onClick={handleMerge}
            disabled={!canMerge}
            aria-disabled={!canMerge}
            aria-label={
              files.length < 2
                ? "Add at least 2 PDF files to merge"
                : `Merge ${files.length} PDFs`
            }
            className={`inline-flex justify-center items-center gap-3 w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg py-4 px-10 rounded-xl transition-all shadow-md ${!canMerge ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {status === "processing" ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Merging...
              </>
            ) : (
              <>
                <FilePlus2 className="w-6 h-6" aria-hidden="true" />
                Merge PDFs
              </>
            )}
          </button>
          {files.length < 2 && (
            <p className="mt-3 text-sm text-gray-400">
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
