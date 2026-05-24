"use client";

import { useState, useCallback } from "react";
import { Type, File as FileIcon, Loader2, Download, AlertCircle, RefreshCw, CheckCircle2, Copy } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";

// PDF.js CDN
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

export default function ExtractTextClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const extractTextFromPdf = async (file: File) => {
    setStatus("processing");
    setProgress(0);
    try {
      const pdfjsLib = await loadPdfjsScript();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const numPages = pdf.numPages;
      let fullText = "";

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += `--- Page ${i} ---\n\n${pageText}\n\n`;
        setProgress(Math.round((i / numPages) * 100));
      }

      setExtractedText(fullText.trim());
      setStatus("completed");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Failed to extract text from PDF.");
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      extractTextFromPdf(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([extractedText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name.replace(/\.pdf$/i, '') || 'extracted'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setExtractedText("");
    setErrorMessage("");
    setCopied(false);
  };

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <div className="bg-yellow-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-yellow-200">
          <Type className="w-8 h-8 text-yellow-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Extract Text from PDF
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Instantly extract and copy all text content from your PDF documents directly in your browser.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <motion.div layout className="w-full bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!file && (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...(getRootProps() as any)}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ease-in-out ${
                  isDragActive ? "border-yellow-500 bg-yellow-50" : "border-gray-300 hover:border-yellow-400 hover:bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Type className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-xl font-bold text-gray-800 mb-2">Drop your PDF here</p>
                <p className="text-gray-500">or click to browse</p>
              </motion.div>
            )}

            {status === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Loader2 className="w-12 h-12 animate-spin text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Extracting Text...</h3>
                <p className="text-gray-500 mt-2">Reading pages: {progress}%</p>
                <div className="w-full max-w-md mx-auto h-2 bg-gray-100 rounded-full mt-4 overflow-hidden">
                  <div className="h-full bg-yellow-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </motion.div>
            )}

            {status === "completed" && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-green-500" /> Extracted Text
                  </h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopy}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold flex items-center gap-2 transition-colors"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button 
                      onClick={handleDownloadTxt}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" /> Save .txt
                    </button>
                  </div>
                </div>

                <div className="w-full h-[400px] border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <textarea 
                    value={extractedText} 
                    readOnly 
                    className="w-full h-full p-4 bg-transparent outline-none resize-none custom-scrollbar font-mono text-sm"
                  />
                </div>

                <div className="mt-6 text-center border-t border-gray-100 pt-6">
                  <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-3 px-8 rounded-xl transition-all mx-auto"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Extract Another
                  </button>
                </div>
              </motion.div>
            )}

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
