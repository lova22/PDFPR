"use client";

import { useState, useCallback } from "react";
import { Hash, File as FileIcon, Loader2, Download, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export default function AddPageNumbersClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "configuring" | "processing" | "completed" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [position, setPosition] = useState<"bottom-right" | "bottom-center" | "bottom-left" | "top-right" | "top-center" | "top-left">("bottom-center");
  const [format, setFormat] = useState<"{n}" | "Page {n}" | "Page {n} of {t}">("Page {n} of {t}");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus("configuring");
      setErrorMessage("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
  });

  const handleAddNumbers = async () => {
    if (!file) return;
    setStatus("processing");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      for (let i = 0; i < totalPages; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        const text = format.replace("{n}", (i + 1).toString()).replace("{t}", totalPages.toString());
        const textSize = 12;
        const textWidth = helveticaFont.widthOfTextAtSize(text, textSize);
        
        const margin = 30;
        let x = 0;
        let y = 0;

        if (position.includes("left")) x = margin;
        else if (position.includes("center")) x = (width - textWidth) / 2;
        else if (position.includes("right")) x = width - textWidth - margin;

        if (position.includes("top")) y = height - margin - textSize;
        else if (position.includes("bottom")) y = margin;

        page.drawText(text, {
          x,
          y,
          size: textSize,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus("completed");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "An error occurred while adding page numbers.");
    }
  };

  const handleReset = () => {
    setFile(null);
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
          <Hash className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Add Page Numbers
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Number the pages of your PDF document easily with customizable formats and positions.
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
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ease-in-out ${
                  isDragActive ? "border-emerald-500 bg-emerald-50" : "border-gray-300 hover:border-emerald-400 hover:bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hash className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-xl font-bold text-gray-800 mb-2">Drop your PDF here</p>
                <p className="text-gray-500">or click to browse</p>
              </motion.div>
            )}

            {status === "configuring" && (
              <motion.div
                key="configuring"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-8 flex items-center gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <FileIcon className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-lg">{file?.name}</p>
                    <p className="text-sm text-gray-500">{(file!.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Format</label>
                    <select 
                      value={format}
                      onChange={(e: any) => setFormat(e.target.value)}
                      className="w-full border-gray-300 rounded-xl shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3 bg-gray-50"
                    >
                      <option value="{n}">1, 2, 3...</option>
                      <option value="Page {n}">Page 1, Page 2...</option>
                      <option value="Page {n} of {t}">Page 1 of 5</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Position</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"].map((pos) => (
                        <button
                          key={pos}
                          onClick={() => setPosition(pos as any)}
                          className={`p-3 text-xs font-semibold rounded-lg border-2 transition-all ${
                            position === pos 
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700" 
                              : "border-gray-200 bg-white text-gray-500 hover:border-emerald-200"
                          }`}
                        >
                          {pos.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
                  <button 
                    onClick={handleReset}
                    className="px-6 py-3 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddNumbers}
                    className="px-8 py-3 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-200 hover:shadow-lg flex items-center gap-2"
                  >
                    <Hash className="w-5 h-5" /> Add Numbers
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
                <h3 className="text-xl font-bold text-gray-900">Processing PDF...</h3>
                <p className="text-gray-500 mt-2">Stamping page numbers instantly.</p>
              </motion.div>
            )}

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
                  Page numbers have been added to your document.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href={downloadUrl} 
                    download={`Numbered_${file?.name}`}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md shadow-emerald-200"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </a>
                  <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-4 px-8 rounded-xl transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Add More
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
