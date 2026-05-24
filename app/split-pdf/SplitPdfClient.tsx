"use client";

/**
 * SECURITY AUDIT:
 * - All PDF processing is client-side only.
 * - PDF.js is loaded from the Cloudflare CDN at runtime (avoids bundler OOM on huge pdfjs-dist).
 * - Files are validated with magic-byte check BEFORE rendering.
 * - pdf-lib (already bundled) is used for extraction.
 * - No file data is sent to any server or third-party service.
 * - Object URLs are revoked after download to prevent memory leaks.
 */

import { useState, useCallback, useRef } from "react";
import {
  Scissors,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  LayoutGrid,
  SquareCheck,
  Square,
  ChevronDown,
  Loader2,
} from "lucide-react";

// ─── PDF.js CDN version ───────────────────────────────────────────────────────
const PDFJS_VERSION = "3.11.174";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

// ─── Types ────────────────────────────────────────────────────────────────────
type ProcessStatus = "idle" | "loading-script" | "rendering" | "processing" | "done" | "error";

interface PageThumb {
  pageNumber: number;
  dataUrl: string;
}

// Minimal type for the PDF.js global exposed by the CDN script
interface PdfjsLib {
  version: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(params: { data: ArrayBuffer }): { promise: Promise<PdfjsDocument> };
}

interface PdfjsDocument {
  numPages: number;
  getPage(num: number): Promise<PdfjsPage>;
}

interface PdfjsPage {
  getViewport(params: { scale: number }): { width: number; height: number };
  render(params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }): { promise: Promise<void> };
}

declare global {
  interface Window {
    pdfjsLib?: PdfjsLib;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isPdf(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer, 0, 4);
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Load PDF.js from CDN and resolve when ready. Returns window.pdfjsLib. */
function loadPdfjsScript(): Promise<PdfjsLib> {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const existing = document.getElementById("pdfjs-cdn");
    if (existing) {
      // Script already injected — wait for it
      existing.addEventListener("load", () => {
        if (window.pdfjsLib) resolve(window.pdfjsLib);
        else reject(new Error("PDF.js CDN loaded but pdfjsLib not found on window."));
      });
      existing.addEventListener("error", () => reject(new Error("Failed to load PDF.js from CDN.")));
      return;
    }
    const script = document.createElement("script");
    script.id = "pdfjs-cdn";
    script.src = PDFJS_CDN;
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        resolve(window.pdfjsLib);
      } else {
        reject(new Error("PDF.js CDN loaded but pdfjsLib not found on window."));
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js from CDN. Check your internet connection."));
    document.head.appendChild(script);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SplitPdfClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [thumbnails, setThumbnails] = useState<PageThumb[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState(0);
  const [splitMode, setSplitMode] = useState<"select" | "all">("select");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setThumbnails([]);
    setSelectedPages(new Set());
    setErrorMsg(null);
    setStatus("idle");
    setRenderProgress(0);
    setSplitMode("select");
  }, []);

  // ── Load & render thumbnails ────────────────────────────────────────────────
  const loadAndRenderPdf = useCallback(async (f: File) => {
    setStatus("loading-script");
    setRenderProgress(0);

    try {
      // Step 1: load PDF.js from CDN (cached after first load)
      const pdfjsLib = await loadPdfjsScript();

      setStatus("rendering");

      const buffer = await f.arrayBuffer();
      if (!isPdf(buffer)) throw new Error("The selected file is not a valid PDF.");

      // Step 2: parse with PDF.js
      const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
      const numPages = pdfDoc.numPages;
      const thumbs: PageThumb[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const THUMB_W = 160;
        const vp0 = page.getViewport({ scale: 1 });
        const scale = THUMB_W / vp0.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        thumbs.push({ pageNumber: i, dataUrl: canvas.toDataURL("image/webp", 0.8) });
        setRenderProgress(Math.round((i / numPages) * 100));
      }

      setThumbnails(thumbs);
      setSelectedPages(new Set(thumbs.map((t) => t.pageNumber)));
      setStatus("idle");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to read the PDF.");
      setStatus("error");
    }
  }, []);

  const handleFileChosen = useCallback(
    (f: File | null | undefined) => {
      if (!f) return;
      resetState();
      setFile(f);
      loadAndRenderPdf(f);
    },
    [resetState, loadAndRenderPdf]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileChosen(e.target.files?.[0]);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFileChosen]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChosen(e.dataTransfer.files[0]);
  }, [handleFileChosen]);

  const togglePage = useCallback((n: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => setSelectedPages(new Set(thumbnails.map((t) => t.pageNumber))), [thumbnails]);
  const deselectAll = useCallback(() => setSelectedPages(new Set()), []);

  // ── Split / Extract ────────────────────────────────────────────────────────
  const handleSplit = useCallback(async () => {
    if (!file) return;
    const pagesToExtract = splitMode === "all"
      ? new Set(thumbnails.map((t) => t.pageNumber))
      : selectedPages;

    if (pagesToExtract.size === 0) { setErrorMsg("Please select at least one page to extract."); return; }

    setStatus("processing");
    setErrorMsg(null);

    try {
      const buffer = await file.arrayBuffer();
      if (!isPdf(buffer)) throw new Error("The selected file is not a valid PDF.");

      const { PDFDocument } = await import("pdf-lib");
      const srcDoc = await PDFDocument.load(buffer);
      const outDoc = await PDFDocument.create();

      const sorted = Array.from(pagesToExtract).sort((a, b) => a - b);
      const copied = await outDoc.copyPages(srcDoc, sorted.map((p) => p - 1));
      copied.forEach((p) => outDoc.addPage(p));

      const outBytes = await outDoc.save();
      const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name.replace(/\.pdf$/i, "")}-split.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);

      setStatus("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setStatus("error");
    }
  }, [file, splitMode, selectedPages, thumbnails]);

  const handleReset = useCallback(() => { setFile(null); resetState(); }, [resetState]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const isRendering = status === "rendering" || status === "loading-script";
  const isProcessing = status === "processing";
  const isBusy = isRendering || isProcessing;
  const effectiveSelected = splitMode === "all" ? thumbnails.length : selectedPages.size;
  const canSplit = !isBusy && thumbnails.length > 0 && effectiveSelected > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="bg-rose-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-rose-200">
          <Scissors className="w-8 h-8 text-rose-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
          Split PDF
        </h1>
        <p className="text-gray-500 text-lg max-w-lg mx-auto leading-relaxed">
          Click pages to select them, then extract — all processing runs in your browser, nothing is uploaded.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Drop Zone */}
        {!file && (
          <div
            id="split-pdf-dropzone"
            role="button"
            tabIndex={0}
            aria-label="Upload PDF — click or drag and drop"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
            onDragOver={handleDragOver as any}
            onDragLeave={handleDragLeave as any}
            onDrop={handleDrop as any}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "1rem", padding: "4.5rem 2rem", borderRadius: 20, cursor: "pointer",
              border: `2px dashed ${isDragging ? "rgba(251,113,133,0.7)" : "rgba(251,113,133,0.3)"}`,
              background: isDragging ? "rgba(251,113,133,0.08)" : "rgba(251,113,133,0.03)",
              transition: "all 0.2s ease", userSelect: "none",
            }}
          >
            <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(251,113,133,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Scissors size={28} color="#fb7185" />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "0.3rem" }}>Drop your PDF here</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>or click to browse — one file at a time</p>
            </div>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" style={{ display: "none" }} onChange={handleInputChange} aria-hidden="true" />
          </div>
        )}

        {/* Loading / Rendering progress */}
        {isRendering && (
          <div role="status" aria-live="polite" className="mt-6 p-8 rounded-2xl bg-rose-50 border border-rose-100 text-center">
            <p className="font-semibold text-gray-900 mb-4 text-base">
              {status === "loading-script" ? "Loading PDF engine..." : "Rendering page thumbnails..."}
            </p>
            <div aria-hidden="true" className="h-2 rounded-full bg-rose-100 overflow-hidden max-w-xs mx-auto">
              <div 
                className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${status === "loading-script" ? 10 : renderProgress}%` }}
              />
            </div>
            {status === "rendering" && (
              <p className="mt-3 text-sm text-gray-500">{renderProgress}% complete</p>
            )}
          </div>
        )}

        {/* Thumbnail grid */}
        {thumbnails.length > 0 && !isRendering && (
          <>
            {/* File info strip */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderRadius: 12, background: "rgba(251,113,133,0.06)", border: "1px solid rgba(251,113,133,0.12)", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <LayoutGrid size={14} color="#fb7185" />
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                  <strong style={{ color: "var(--text-primary)" }}>{file?.name}</strong>{" "}
                  · {thumbnails.length} page{thumbnails.length !== 1 ? "s" : ""} · {formatBytes(file?.size ?? 0)}
                </span>
              </div>
              <button type="button" id="split-change-file-btn" onClick={handleReset}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fb7185")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                <Trash2 size={13} /> Change file
              </button>
            </div>

            {/* Mode + helpers toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>Mode:</span>

              {(["select", "all"] as const).map((m) => (
                <button key={m} id={`mode-${m}-btn`} type="button" onClick={() => setSplitMode(m)}
                  style={{
                    padding: "0.38rem 0.9rem", borderRadius: 8, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", transition: "all 0.18s",
                    display: "flex", alignItems: "center", gap: 5,
                    border: `1.5px solid ${splitMode === m ? "rgba(251,113,133,0.6)" : "rgba(255,255,255,0.1)"}`,
                    background: splitMode === m ? "rgba(251,113,133,0.12)" : "transparent",
                    color: splitMode === m ? "#fb7185" : "var(--text-muted)",
                  }}>
                  {m === "select" ? <><SquareCheck size={13} /> Select Pages</> : <><ChevronDown size={13} /> Extract All</>}
                </button>
              ))}

              {splitMode === "select" && (
                <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
                  {[["select-all-pages-btn", "Select All", selectAll], ["deselect-all-pages-btn", "Deselect All", deselectAll]].map(([id, label, fn]) => (
                    <button key={id as string} id={id as string} type="button" onClick={fn as () => void}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(251,113,133,0.4)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                      style={{ padding: "0.32rem 0.8rem", borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", fontSize: "0.78rem", cursor: "pointer", fontWeight: 500 }}>
                      {label as string}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Page grid */}
            <div aria-label="PDF page thumbnails" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {thumbnails.map((thumb) => {
                const isSelected = splitMode === "all" || selectedPages.has(thumb.pageNumber);
                return (
                  <button key={thumb.pageNumber} type="button"
                    id={`page-thumb-${thumb.pageNumber}`}
                    aria-pressed={isSelected}
                    aria-label={`Page ${thumb.pageNumber}${isSelected ? " (selected)" : ""}`}
                    onClick={() => splitMode === "select" && togglePage(thumb.pageNumber)}
                    style={{ position: "relative", padding: 0, border: "none", background: "none", cursor: splitMode === "select" ? "pointer" : "default", borderRadius: 10, outline: "none" }}>
                    <div style={{
                      position: "relative", borderRadius: 10, overflow: "hidden", background: "#fff",
                      border: `2px solid ${isSelected ? "rgba(251,113,133,0.8)" : "rgba(255,255,255,0.08)"}`,
                      boxShadow: isSelected ? "0 0 0 3px rgba(251,113,133,0.2)" : "0 2px 8px rgba(0,0,0,0.3)",
                      transition: "all 0.18s ease",
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb.dataUrl} alt={`Page ${thumb.pageNumber}`} style={{ display: "block", width: "100%", height: "auto", opacity: isSelected ? 1 : 0.4, transition: "opacity 0.18s" }} />
                      {splitMode === "select" && (
                        <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 5, background: isSelected ? "#fb7185" : "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                          {isSelected ? <SquareCheck size={13} color="#fff" /> : <Square size={13} color="rgba(255,255,255,0.7)" />}
                        </div>
                      )}
                    </div>
                    <p style={{ marginTop: "0.4rem", fontSize: "0.75rem", textAlign: "center", transition: "color 0.18s", color: isSelected ? "#fb7185" : "var(--text-muted)", fontWeight: isSelected ? 700 : 400 }}>
                      Page {thumb.pageNumber}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Processing banner */}
            {isProcessing && (
              <div role="status" aria-live="polite" className="mb-4 p-5 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 font-medium text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                Extracting selected pages...
              </div>
            )}

            {/* Success */}
            {status === "done" && (
              <div role="status" aria-live="polite" className="mb-4 p-5 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center gap-3 text-cyan-600 font-medium text-sm">
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                Your split PDF has been downloaded successfully!
              </div>
            )}

            {/* Error (post-thumbnail) */}
            {status === "error" && errorMsg && (
              <div role="alert" className="mb-4 p-5 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600 text-sm leading-relaxed">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div><strong>Error:</strong> {errorMsg}</div>
              </div>
            )}

            {/* CTA */}
            <div className="text-center mt-8">
              <button id="split-pdf-btn" type="button" 
                onClick={handleSplit} disabled={!canSplit} aria-disabled={!canSplit}
                className={`inline-flex justify-center items-center gap-3 w-full md:w-auto bg-rose-500 hover:bg-rose-600 text-white font-bold text-lg py-4 px-10 rounded-xl transition-all shadow-md ${!canSplit ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Extracting...</>
                ) : (
                  <><Download className="w-5 h-5" aria-hidden="true" />
                    {effectiveSelected === 0 ? "Select Pages to Extract" : `Extract ${effectiveSelected} Page${effectiveSelected !== 1 ? "s" : ""}`}
                  </>
                )}
              </button>
              {splitMode === "select" && effectiveSelected === 0 && (
                <p className="mt-3 text-sm text-gray-500">Click thumbnails above to select pages.</p>
              )}
            </div>
          </>
        )}

        {/* Error before thumbnails (e.g. invalid file / CDN failed) */}
        {status === "error" && errorMsg && thumbnails.length === 0 && (
          <div role="alert" className="mt-6 p-5 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600 text-sm leading-relaxed">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div><strong>Error:</strong> {errorMsg}</div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
