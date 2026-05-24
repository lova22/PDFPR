"use client";

import { useState, useCallback } from "react";
import { Droplet, File as FileIcon, Loader2, Download, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument, rgb, degrees } from "pdf-lib";

export default function WatermarkPdfClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(45);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus("idle");
      setErrorMessage("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
  });

  const handleWatermark = async () => {
    if (!file || !watermarkText) return;
    setStatus("processing");
    setErrorMessage("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();
        // Calculate rough text width (assuming standard font size 60)
        const textWidth = watermarkText.length * 30; 
        const textHeight = 60;

        page.drawText(watermarkText, {
          x: (width / 2) - (textWidth / 2) * Math.cos(rotation * (Math.PI / 180)),
          y: (height / 2) - (textHeight / 2),
          size: 60,
          color: rgb(0.5, 0.5, 0.5),
          opacity: opacity,
          rotate: degrees(rotation),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      setDownloadUrl(url);
      setStatus("completed");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Failed to add watermark. The PDF might be corrupted or encrypted.");
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
        <div className="bg-sky-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-sky-200">
          <Droplet className="w-8 h-8 text-sky-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Add Watermark
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Stamp a text watermark across all pages of your PDF instantly.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
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
                  isDragActive ? "border-sky-500 bg-sky-50" : "border-gray-300 hover:border-sky-400 hover:bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="bg-sky-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Droplet className="w-8 h-8 text-sky-600" />
                </div>
                <p className="text-xl font-bold text-gray-800 mb-2">Drop your PDF here</p>
                <p className="text-gray-500">or click to browse</p>
              </motion.div>
            )}

            {/* Options & Processing State */}
            {file && status !== "completed" && status !== "error" && (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-sky-50 border border-sky-100 rounded-2xl p-6 mb-8 flex items-center gap-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <FileIcon className="w-8 h-8 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-lg">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>

                {status === "idle" && (
                  <div className="space-y-6 mb-8">
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Watermark Text</label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-gray-800 font-semibold text-lg"
                        placeholder="e.g. DRAFT"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-gray-700 font-bold mb-2">Opacity: {Math.round(opacity * 100)}%</label>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          value={opacity}
                          onChange={(e) => setOpacity(parseFloat(e.target.value))}
                          className="w-full accent-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-bold mb-2">Rotation: {rotation}°</label>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="15"
                          value={rotation}
                          onChange={(e) => setRotation(parseInt(e.target.value))}
                          className="w-full accent-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {status === "processing" && (
                  <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 animate-spin text-sky-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">Stamping Watermark...</h3>
                    <p className="text-gray-500 mt-2">Applying text to all pages.</p>
                  </div>
                )}

                <div className="flex justify-center gap-4 mt-8">
                  <button 
                    onClick={handleReset}
                    disabled={status === "processing"}
                    className="px-6 py-3 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleWatermark}
                    disabled={status === "processing" || !watermarkText}
                    className="px-8 py-3 font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-all shadow-md shadow-sky-200 hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                  >
                    {status === "processing" ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing</> : <><Droplet className="w-5 h-5" /> Apply Watermark</>}
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Watermark Applied!</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                  Your PDF has been successfully watermarked.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href={downloadUrl} 
                    download={`watermarked-${file?.name}`}
                    className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md shadow-sky-200 hover:shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </a>
                  <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold py-4 px-8 rounded-xl transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Watermark Another
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
