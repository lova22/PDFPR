"use client";

import { useState, useCallback, useRef } from "react";
import { Image as ImageIcon, File as FileIcon, Loader2, Download, AlertCircle, RefreshCw, CheckCircle2, Settings } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";

// ─── PDF.js CDN version ───────────────────────────────────────────────────────
const PDFJS_VERSION = "3.11.174";
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const PDFJS_WORKER = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

type ProcessStatus = "idle" | "loading-script" | "extracting" | "zipping" | "completed" | "error";

export default function PdfToImageClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [format, setFormat] = useState<"image/jpeg" | "image/png">("image/jpeg");
  
  const isPdfJsLoaded = useRef(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus("idle");
      setErrorMessage("");
      setProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
  });

  const loadPdfJs = async () => {
    if (isPdfJsLoaded.current) return;
    setStatus("loading-script");
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = PDFJS_CDN;
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        if (window.pdfjsLib) {
          // @ts-ignore
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
          isPdfJsLoaded.current = true;
          resolve();
        } else {
          reject(new Error("pdfjsLib not found on window"));
        }
      };
      script.onerror = () => reject(new Error("Failed to load PDF.js from CDN"));
      document.body.appendChild(script);
    });
  };

  const handleExtract = async () => {
    if (!file) return;
    setStatus("loading-script");
    setProgress(0);
    setErrorMessage("");
    
    try {
      await loadPdfJs();
      setStatus("extracting");

      const arrayBuffer = await file.arrayBuffer();
      // @ts-ignore
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      const zip = new JSZip();
      const ext = format === "image/jpeg" ? "jpg" : "png";

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // High resolution

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not create canvas context");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;

        const dataUrl = canvas.toDataURL(format, 0.95);
        const base64Data = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
        
        zip.file(`page-${i}.${ext}`, base64Data, { base64: true });
        
        setProgress(Math.round((i / numPages) * 100));
      }

      setStatus("zipping");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      
      setDownloadUrl(url);
      setStatus("completed");

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred during extraction.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setProgress(0);
    setErrorMessage("");
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-orange-200">
          <ImageIcon className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          PDF to Image
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Convert your PDF pages into high-quality JPG or PNG images directly in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-4xl mx-auto">
        <div className="lg:col-span-12 flex flex-col items-center">
          <motion.div layout className="w-full bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden">
            <AnimatePresence mode="wait">
              {/* Dropzone State */}
              {!file && (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  {...(getRootProps() as any)}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ease-in-out ${
                    isDragActive ? "border-orange-500 bg-orange-50" : "border-gray-300 hover:border-orange-400 hover:bg-gray-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-8 h-8 text-orange-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-800 mb-2">Drop your PDF here</p>
                  <p className="text-gray-500">or click to browse</p>
                </motion.div>
              )}

              {/* Options & Processing State */}
              {file && status !== "completed" && status !== "error" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full"
                >
                  <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-8 flex items-center gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <FileIcon className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-lg">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>

                  {status === "idle" && (
                    <div className="mb-8">
                      <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-4">
                        <Settings className="w-5 h-5 text-gray-400" /> Export Options
                      </h3>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setFormat("image/jpeg")}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                            format === "image/jpeg" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-gray-50"
                          }`}
                        >
                          JPG (Smaller file)
                        </button>
                        <button
                          onClick={() => setFormat("image/png")}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                            format === "image/png" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-gray-200 bg-white text-gray-600 hover:border-orange-200 hover:bg-gray-50"
                          }`}
                        >
                          PNG (Transparent/Lossless)
                        </button>
                      </div>
                    </div>
                  )}

                  {(status === "loading-script" || status === "extracting" || status === "zipping") && (
                    <div className="mb-8">
                      <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>
                          {status === "loading-script" && "Loading PDF engine..."}
                          {status === "extracting" && "Rendering pages to images..."}
                          {status === "zipping" && "Compressing images into ZIP..."}
                        </span>
                        <span>{status === "extracting" ? `${progress}%` : ""}</span>
                      </div>
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: status === "zipping" || status === "loading-script" ? '100%' : `${progress}%` }}
                          transition={{ ease: "linear" }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-center gap-4 mt-8">
                    <button 
                      onClick={handleReset}
                      disabled={status !== "idle"}
                      className="px-6 py-3 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleExtract}
                      disabled={status !== "idle"}
                      className="px-8 py-3 font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-all shadow-md shadow-orange-200 hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {status !== "idle" ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Processing</>
                      ) : (
                        <><ImageIcon className="w-5 h-5" /> Extract Images</>
                      )}
                    </button>
                  </div>
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
                    All pages have been converted to images and bundled into a ZIP file.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <a 
                      href={downloadUrl} 
                      download={`${file?.name.replace('.pdf', '')}-images.zip`}
                      className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md shadow-orange-200 hover:shadow-lg"
                    >
                      <Download className="w-5 h-5" />
                      Download ZIP Folder
                    </a>
                    <button 
                      onClick={handleReset}
                      className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold py-4 px-8 rounded-xl transition-all"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Extract Another
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
                  <p className="text-red-600 mb-8 max-w-md mx-auto bg-red-50 p-4 rounded-xl border border-red-100">
                    {errorMessage}
                  </p>
                  <button 
                    onClick={() => setStatus("idle")}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-xl transition-all"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
