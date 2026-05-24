"use client";

/**
 * SECURITY AUDIT:
 * - All PDF processing is client-side only.
 * - PDF.js is loaded from the Cloudflare CDN at runtime.
 * - Files are validated with magic-byte check BEFORE rendering.
 * - pdf-lib (already bundled) is used for rotating pages.
 * - No file data is sent to any server or third-party service.
 * - Object URLs are revoked after download to prevent memory leaks.
 */

import { useState, useCallback, useRef } from "react";
import {
  RefreshCw,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle2,
  LayoutGrid,
  RotateCw,
  RotateCcw,
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

function loadPdfjsScript(): Promise<PdfjsLib> {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) {
      resolve(window.pdfjsLib);
      return;
    }
    const existing = document.getElementById("pdfjs-cdn");
    if (existing) {
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
export default function RotatePdfClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [thumbnails, setThumbnails] = useState<PageThumb[]>([]);
  
  // Track rotation in degrees (0, 90, 180, 270) per page number.
  // We use pageNumber (1-indexed) as the key.
  const [rotations, setRotations] = useState<Record<number, number>>({});
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setThumbnails([]);
    setRotations({});
    setErrorMsg(null);
    setStatus("idle");
    setRenderProgress(0);
  }, []);

  // ── Load & render thumbnails ────────────────────────────────────────────────
  const loadAndRenderPdf = useCallback(async (f: File) => {
    setStatus("loading-script");
    setRenderProgress(0);

    try {
      const pdfjsLib = await loadPdfjsScript();
      setStatus("rendering");

      const buffer = await f.arrayBuffer();
      if (!isPdf(buffer)) throw new Error("The selected file is not a valid PDF.");

      const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
      const numPages = pdfDoc.numPages;
      const thumbs: PageThumb[] = [];
      const initRots: Record<number, number> = {};

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
        initRots[i] = 0; // Default to 0 degrees visual rotation
        setRenderProgress(Math.round((i / numPages) * 100));
      }

      setThumbnails(thumbs);
      setRotations(initRots);
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

  // ── Rotation Actions ────────────────────────────────────────────────────────
  const rotatePage = useCallback((pageNum: number, direction: "cw" | "ccw") => {
    setRotations((prev) => {
      const current = prev[pageNum] || 0;
      const change = direction === "cw" ? 90 : -90;
      return { ...prev, [pageNum]: current + change };
    });
  }, []);

  const rotateAll = useCallback((direction: "cw" | "ccw") => {
    setRotations((prev) => {
      const change = direction === "cw" ? 90 : -90;
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        next[Number(key)] = (next[Number(key)] || 0) + change;
      });
      return next;
    });
  }, []);

  // ── Processing / pdf-lib ────────────────────────────────────────────────────
  const handleApply = useCallback(async () => {
    if (!file) return;

    // Check if any rotations actually happened (not a multiple of 360)
    const hasChanges = Object.values(rotations).some((r) => r % 360 !== 0);
    if (!hasChanges) {
      setErrorMsg("No rotations have been applied. Please rotate at least one page.");
      return;
    }

    setStatus("processing");
    setErrorMsg(null);

    try {
      const buffer = await file.arrayBuffer();
      if (!isPdf(buffer)) throw new Error("The selected file is not a valid PDF.");

      // Dynamically import pdf-lib only when processing
      const { PDFDocument, degrees } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.load(buffer);
      
      const pages = pdfDoc.getPages();
      pages.forEach((page, index) => {
        const pageNum = index + 1;
        const userRotation = rotations[pageNum] || 0;
        
        // Only apply if there's an actual rotation
        if (userRotation % 360 !== 0) {
          const currentRotation = page.getRotation().angle;
          // Set new rotation by adding user's visual rotation to current page metadata rotation
          page.setRotation(degrees(currentRotation + userRotation));
        }
      });

      const outBytes = await pdfDoc.save();
      const blob = new Blob([outBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${file.name.replace(/\.pdf$/i, "")}-rotated.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);

      setStatus("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setStatus("error");
    }
  }, [file, rotations]);

  const handleReset = useCallback(() => { setFile(null); resetState(); }, [resetState]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const isRendering = status === "rendering" || status === "loading-script";
  const isProcessing = status === "processing";
  const isBusy = isRendering || isProcessing;
  const canApply = !isBusy && thumbnails.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-green-200">
          <RefreshCw className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
          Rotate PDF
        </h1>
        <p className="text-gray-500 text-lg max-w-lg mx-auto leading-relaxed">
          Rotate individual pages or all pages at once — all processing runs in your browser securely.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Drop Zone */}
        {!file && (
          <div
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
              border: `2px dashed ${isDragging ? "rgba(34,197,94,0.7)" : "rgba(34,197,94,0.3)"}`,
              background: isDragging ? "rgba(34,197,94,0.08)" : "rgba(34,197,94,0.03)",
              transition: "all 0.2s ease", userSelect: "none",
            }}
          >
            <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(34,197,94,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw size={28} color="#22c55e" />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", marginBottom: "0.3rem" }}>Drop your PDF here</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>or click to browse</p>
            </div>
            <input ref={inputRef} type="file" accept="application/pdf,.pdf" style={{ display: "none" }} onChange={handleInputChange} aria-hidden="true" />
          </div>
        )}

        {/* Loading / Rendering progress */}
        {isRendering && (
          <div role="status" aria-live="polite" className="mt-6 p-8 rounded-2xl bg-green-50 border border-green-100 text-center">
            <p className="font-semibold text-gray-900 mb-4 text-base">
              {status === "loading-script" ? "Loading PDF engine..." : "Rendering page thumbnails..."}
            </p>
            <div aria-hidden="true" className="h-2 rounded-full bg-green-100 overflow-hidden max-w-xs mx-auto">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-200 ease-out"
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderRadius: 12, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <LayoutGrid size={14} color="#22c55e" />
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                  <strong style={{ color: "var(--text-primary)" }}>{file?.name}</strong>{" "}
                  · {thumbnails.length} page{thumbnails.length !== 1 ? "s" : ""} · {formatBytes(file?.size ?? 0)}
                </span>
              </div>
              <button type="button" onClick={handleReset}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#4ade80")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                <Trash2 size={13} /> Change file
              </button>
            </div>

            {/* Global Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>All Pages:</span>
              <button type="button" onClick={() => rotateAll("ccw")}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                style={{ padding: "0.4rem 0.9rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", fontSize: "0.82rem", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 6, transition: "border-color 0.15s" }}>
                <RotateCcw size={14} /> Left
              </button>
              <button type="button" onClick={() => rotateAll("cw")}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                style={{ padding: "0.4rem 0.9rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", fontSize: "0.82rem", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: 6, transition: "border-color 0.15s" }}>
                <RotateCw size={14} /> Right
              </button>
            </div>

            {/* Page grid */}
            <div aria-label="PDF page thumbnails" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {thumbnails.map((thumb) => {
                const rotation = rotations[thumb.pageNumber] || 0;
                return (
                  <div key={thumb.pageNumber} style={{ position: "relative" }}>
                    <div style={{
                      position: "relative", borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.03)",
                      border: "2px solid rgba(255,255,255,0.08)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      aspectRatio: "1/1.2", // Give it a fixed box so rotation doesn't warp layout bounds too heavily
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb.dataUrl} alt={`Page ${thumb.pageNumber}`} 
                        style={{ 
                          display: "block", 
                          maxWidth: "90%", 
                          maxHeight: "90%", 
                          objectFit: "contain",
                          transform: `rotate(${rotation}deg)`, 
                          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.5)" 
                        }} 
                      />
                      
                      {/* Overlay Rotate Button */}
                      <button
                        type="button"
                        onClick={() => rotatePage(thumb.pageNumber, "cw")}
                        title="Rotate Page"
                        aria-label={`Rotate page ${thumb.pageNumber}`}
                        style={{
                          position: "absolute",
                          bottom: 10,
                          right: 10,
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.6)",
                          backdropFilter: "blur(4px)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(34,197,94,0.9)";
                          e.currentTarget.style.borderColor = "rgba(34,197,94,1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(0,0,0,0.6)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                        }}
                      >
                        <RotateCw size={14} />
                      </button>
                    </div>
                    <p style={{ marginTop: "0.4rem", fontSize: "0.75rem", textAlign: "center", color: "var(--text-muted)", fontWeight: 400 }}>
                      Page {thumb.pageNumber}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Processing banner */}
            {isProcessing && (
              <div role="status" aria-live="polite" className="mb-4 p-5 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3 text-green-700 font-medium text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                Applying rotations...
              </div>
            )}

            {/* Success */}
            {status === "done" && (
              <div role="status" aria-live="polite" className="mb-4 p-5 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center gap-3 text-cyan-700 font-medium text-sm">
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                Your rotated PDF has been downloaded successfully!
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
              <button type="button" 
                onClick={handleApply} disabled={!canApply} aria-disabled={!canApply}
                className={`inline-flex justify-center items-center gap-3 w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 px-10 rounded-xl transition-all shadow-md ${!canApply ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isProcessing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Applying...</>
                ) : (
                  <><Download className="w-5 h-5" aria-hidden="true" /> Apply & Download</>
                )}
              </button>
            </div>
          </>
        )}

        {/* Error before thumbnails */}
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
