"use client";

import { useState, useCallback, useRef } from "react";
import { Layers, File as FileIcon, Loader2, Download, AlertCircle, RefreshCw, CheckCircle2, ArrowLeft, ArrowRight, Trash2, GripHorizontal } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument } from "pdf-lib";

// ─── PDF.js CDN version ───────────────────────────────────────────────────────
const PDFJS_VERSION = "3.11.174";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

function loadPdfjsScript(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && (window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }
    const existing = document.getElementById("pdfjs-cdn");
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).pdfjsLib));
      existing.addEventListener("error", () => reject(new Error("Failed to load PDF.js from CDN.")));
      return;
    }
    const script = document.createElement("script");
    script.id = "pdfjs-cdn";
    script.src = PDFJS_CDN;
    script.async = true;
    script.onload = () => {
      if ((window as any).pdfjsLib) {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        resolve((window as any).pdfjsLib);
      } else {
        reject(new Error("PDF.js CDN loaded but pdfjsLib not found on window."));
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js from CDN. Check your internet connection."));
    document.head.appendChild(script);
  });
}

function isPdf(buffer: ArrayBuffer): boolean {
  const arr = new Uint8Array(buffer).subarray(0, 5);
  const header = String.fromCharCode(...arr);
  return header === "%PDF-";
}

interface PageThumb {
  id: string; // Unique ID for tracking reorders
  originalPageNumber: number; // 1-indexed
  dataUrl: string;
}

export default function OrganizePdfClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "loading-script" | "rendering" | "processing" | "completed" | "error">("idle");
  const [thumbnails, setThumbnails] = useState<PageThumb[]>([]);
  const [renderProgress, setRenderProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadAndRenderPdf = useCallback(async (f: File) => {
    setStatus("loading-script");
    setRenderProgress(0);
    setErrorMessage("");

    try {
      const pdfjsLib = await loadPdfjsScript();
      setStatus("rendering");

      const buffer = await f.arrayBuffer();
      if (!isPdf(buffer)) throw new Error("The selected file is not a valid PDF.");

      const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
      const numPages = pdfDoc.numPages;
      const thumbs: PageThumb[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const THUMB_W = 200;
        const vp0 = page.getViewport({ scale: 1 });
        const scale = THUMB_W / vp0.width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        thumbs.push({ 
          id: Math.random().toString(36).substring(7),
          originalPageNumber: i, 
          dataUrl: canvas.toDataURL("image/webp", 0.8) 
        });
        setRenderProgress(Math.round((i / numPages) * 100));
      }

      setThumbnails(thumbs);
      setStatus("idle");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Failed to read the PDF.");
    }
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      loadAndRenderPdf(acceptedFiles[0]);
    }
  }, [loadAndRenderPdf]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
  });

  const movePage = (index: number, direction: -1 | 1) => {
    setThumbnails((prev) => {
      const newThumbs = [...prev];
      if (index + direction < 0 || index + direction >= newThumbs.length) return prev;
      const temp = newThumbs[index];
      newThumbs[index] = newThumbs[index + direction];
      newThumbs[index + direction] = temp;
      return newThumbs;
    });
  };

  const removePage = (index: number) => {
    setThumbnails((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!file || thumbnails.length === 0) return;
    setStatus("processing");
    setErrorMessage("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      const pageIndicesToCopy = thumbnails.map(t => t.originalPageNumber - 1); // PDF-lib is 0-indexed
      const copiedPages = await newPdf.copyPages(originalPdf, pageIndicesToCopy);

      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      setDownloadUrl(url);
      setStatus("completed");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred during saving.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setThumbnails([]);
    setStatus("idle");
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setErrorMessage("");
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-200">
          <Layers className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Organize PDF
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Reorder, delete, and organize pages in your PDF document effortlessly.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        <motion.div layout className="bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Dropzone */}
            {!file && (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ease-in-out ${
                  isDragActive ? "border-emerald-500 bg-emerald-50" : "border-gray-300 hover:border-emerald-400 hover:bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-xl font-bold text-gray-800 mb-2">Drop your PDF here</p>
                <p className="text-gray-500">or click to browse</p>
              </motion.div>
            )}

            {/* Loading / Rendering State */}
            {(status === "loading-script" || status === "rendering") && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Reading PDF...</h3>
                <p className="text-gray-500 mt-2">Loading pages: {renderProgress}%</p>
                <div className="w-full max-w-md mx-auto h-2 bg-gray-100 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all" style={{ width: `${renderProgress}%` }} />
                </div>
              </motion.div>
            )}

            {/* Organize Interface */}
            {file && status === "idle" && thumbnails.length > 0 && (
              <motion.div
                key="organize"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-8 flex items-center gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <FileIcon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-lg">{file.name}</p>
                    <p className="text-sm text-gray-500">{thumbnails.length} pages</p>
                  </div>
                  <button 
                    onClick={handleReset}
                    className="text-sm font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-4 py-2 rounded-lg transition-colors"
                  >
                    Change File
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-8 max-h-[500px] overflow-y-auto p-2 custom-scrollbar">
                  {thumbnails.map((thumb, index) => (
                    <div key={thumb.id} className="group relative flex flex-col items-center">
                      <div className="w-full aspect-[1/1.4] bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden relative mb-2 transition-all group-hover:border-emerald-400 group-hover:shadow-md">
                        <img src={thumb.dataUrl} alt={`Page ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                        
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                          <div className="flex justify-end">
                            <button 
                              onClick={() => removePage(index)}
                              className="p-1.5 bg-white text-red-500 rounded-md hover:bg-red-50 transition-colors shadow-sm"
                              title="Delete Page"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex justify-between">
                            <button 
                              onClick={() => movePage(index, -1)}
                              disabled={index === 0}
                              className="p-1.5 bg-white text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors shadow-sm"
                              title="Move Left"
                            >
                              <ArrowLeft size={16} />
                            </button>
                            <div className="p-1.5 bg-black/50 text-white rounded-md cursor-move">
                              <GripHorizontal size={16} />
                            </div>
                            <button 
                              onClick={() => movePage(index, 1)}
                              disabled={index === thumbnails.length - 1}
                              className="p-1.5 bg-white text-gray-700 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors shadow-sm"
                              title="Move Right"
                            >
                              <ArrowRight size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-4 border-t pt-6">
                  <button 
                    onClick={handleSave}
                    disabled={thumbnails.length === 0}
                    className="px-8 py-3 font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all shadow-md shadow-emerald-200 hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    <Layers className="w-5 h-5" /> Save Organized PDF
                  </button>
                </div>
              </motion.div>
            )}

            {status === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Saving PDF...</h3>
                <p className="text-gray-500 mt-2">Reordering pages securely in your browser.</p>
              </motion.div>
            )}

            {/* Completed State */}
            {status === "completed" && downloadUrl && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                  Your PDF has been beautifully organized.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href={downloadUrl} 
                    download={`organized-${file?.name}`}
                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md shadow-emerald-200 hover:shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </a>
                  <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold py-4 px-8 rounded-xl transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Organize Another
                  </button>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h3>
                <p className="text-red-600 mb-8 p-4 bg-red-50 rounded-xl max-w-md mx-auto">{errorMessage}</p>
                <button 
                  onClick={handleReset}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-xl transition-all"
                >
                  Start Over
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
