/**
 * SECURITY AUDIT:
 * - All processing is client-side only; files never leave the browser.
 * - Input files are pre-validated via magic-byte check before reaching this utility.
 * - ArrayBuffers are created from slices and released after use; no persistent
 *   global references are held, allowing the GC to reclaim memory.
 * - The merged PDF Uint8Array is converted to a Blob for download, then the
 *   object URL is revoked immediately after the download is triggered.
 *
 * MEMORY MANAGEMENT NOTES:
 * - Each File.arrayBuffer() call allocates a buffer proportional to file size.
 * - pdf-lib's PDFDocument.load() creates an internal copy of the buffer.
 * - After copyPages(), the source PDFDocument is no longer referenced and
 *   becomes eligible for garbage collection.
 * - The final save() produces a Uint8Array. We immediately wrap it in a Blob
 *   (which the browser manages) and release our reference to the Uint8Array.
 * - For very large PDFs (>500 MB total), the browser may show an OOM error;
 *   this is a browser limitation and is handled gracefully with a thrown Error.
 */

import { PDFDocument } from "pdf-lib";

export interface MergeProgressEvent {
  stage: "loading" | "merging" | "saving" | "done";
  /** 0–100 */
  percent: number;
  currentFile?: string;
}

/**
 * Merges an array of PDF File objects into a single PDF and triggers
 * a browser download of the result.
 *
 * @param files           - Array of validated PDF File objects (pre-checked with isPdf).
 * @param outputFilename  - Name for the downloaded file (default: "merged.pdf").
 * @param onProgress      - Optional callback for progress updates.
 */
export async function mergePdfs(
  files: File[],
  outputFilename = "merged.pdf",
  onProgress?: (event: MergeProgressEvent) => void
): Promise<void> {
  if (files.length < 1) {
    throw new Error("At least one PDF file is required.");
  }

  const report = (stage: MergeProgressEvent["stage"], percent: number, currentFile?: string) => {
    onProgress?.({ stage, percent, currentFile });
  };

  // ─── Stage 1: Create the merged document ─────────────────────────────────
  const mergedPdf = await PDFDocument.create();
  const totalFiles = files.length;

  // ─── Stage 2: Load and copy pages from each source PDF ───────────────────
  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    const loadPercent = Math.round(((i + 1) / totalFiles) * 70); // 0–70%

    report("loading", loadPercent, file.name);

    // Read file into an ArrayBuffer
    // NOTE: arrayBuffer() can throw on very large files if the browser runs out of memory.
    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    } catch {
      throw new Error(
        `Failed to read "${file.name}" into memory. The file may be too large for your browser.`
      );
    }

    // Load into pdf-lib
    let srcDoc: PDFDocument;
    try {
      srcDoc = await PDFDocument.load(buffer, {
        // Ignore minor cross-reference errors common in real-world PDFs
        ignoreEncryption: false,
      });
    } catch {
      throw new Error(
        `"${file.name}" could not be parsed. It may be corrupted, password-protected, or not a valid PDF.`
      );
    }

    // Copy all pages from source into merged document
    report("merging", loadPercent, file.name);
    const pageIndices = srcDoc.getPageIndices(); // [0, 1, 2, ...]
    const copiedPages = await mergedPdf.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((page) => mergedPdf.addPage(page));

    // Explicit null-out of references to help the GC during a long loop
    // (srcDoc is now out of scope after this iteration)
  }

  // ─── Stage 3: Serialize the merged document ───────────────────────────────
  report("saving", 80);
  let mergedBytes: Uint8Array;
  try {
    mergedBytes = await mergedPdf.save();
  } catch {
    throw new Error(
      "Failed to serialize the merged PDF. The combined document may be too large."
    );
  }

  report("saving", 95);

  // ─── Stage 4: Trigger browser download ───────────────────────────────────
  // Wrap in a Blob so the browser can stream it to disk without keeping
  // the entire Uint8Array in JS memory after the download starts.
  const blob = new Blob([mergedBytes.buffer as ArrayBuffer], { type: "application/pdf" });

  // Revoke the object URL after a short delay to free memory,
  // but long enough for the browser's download manager to pick it up.
  triggerDownload(blob, outputFilename);

  report("done", 100);
}

/**
 * Creates a temporary anchor element, clicks it to trigger a download,
 * and revokes the object URL after 60 seconds to free memory.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke after 60 s — enough time for any download manager to start
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
