"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { PenTool, File as FileIcon, Loader2, Download, AlertCircle, RefreshCw, CheckCircle2, Eraser } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument } from "pdf-lib";

export default function SignPdfClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "signing" | "processing" | "completed" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [pagesToSign, setPagesToSign] = useState<"first" | "last" | "all">("last");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left" | "top-right" | "top-left" | "center">("bottom-right");

  // Signature Pad state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      e.preventDefault(); // Prevent scrolling while signing on mobile
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus("signing");
      setErrorMessage("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
  });

  const handleSign = async () => {
    if (!file || !hasSignature || !canvasRef.current) return;
    setStatus("processing");
    setErrorMessage("");
    
    try {
      const signatureDataUrl = canvasRef.current.toDataURL("image/png");
      
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Embed signature
      const signatureImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer());
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
      
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      let targetIndices: number[] = [];
      if (pagesToSign === "first") targetIndices = [0];
      else if (pagesToSign === "last") targetIndices = [totalPages - 1];
      else if (pagesToSign === "all") targetIndices = Array.from({ length: totalPages }, (_, i) => i);

      for (const idx of targetIndices) {
        if (idx < 0 || idx >= totalPages) continue;
        const page = pages[idx];
        const { width, height } = page.getSize();
        
        // Scale signature so it's not huge (max 200px wide)
        const scale = Math.min(200 / signatureImage.width, 1);
        const sigWidth = signatureImage.width * scale;
        const sigHeight = signatureImage.height * scale;

        const margin = 50;
        let x = 0, y = 0;

        switch (position) {
          case "bottom-right":
            x = width - sigWidth - margin;
            y = margin;
            break;
          case "bottom-left":
            x = margin;
            y = margin;
            break;
          case "top-right":
            x = width - sigWidth - margin;
            y = height - sigHeight - margin;
            break;
          case "top-left":
            x = margin;
            y = height - sigHeight - margin;
            break;
          case "center":
            x = (width - sigWidth) / 2;
            y = (height - sigHeight) / 2;
            break;
        }

        page.drawImage(signatureImage, {
          x,
          y,
          width: sigWidth,
          height: sigHeight,
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
      setErrorMessage(err.message || "An error occurred while signing the PDF.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setErrorMessage("");
    setHasSignature(false);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-200">
          <PenTool className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Sign PDF
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Draw your signature and instantly stamp it onto your PDF document securely in your browser.
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
                    isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PenTool className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-800 mb-2">Drop your PDF here</p>
                  <p className="text-gray-500">or click to browse</p>
                </motion.div>
              )}

              {/* Signing State */}
              {file && status === "signing" && (
                <motion.div
                  key="signing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full"
                >
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 flex items-center gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <FileIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-lg">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>

                  <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-bold text-gray-800 mb-2">Draw Your Signature</h3>
                      <div className="border-2 border-gray-300 rounded-xl overflow-hidden bg-gray-50 relative h-[200px] w-full touch-none">
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={200}
                          className="w-full h-full cursor-crosshair touch-none"
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseOut={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                        />
                        {hasSignature && (
                          <button 
                            onClick={clearSignature}
                            className="absolute top-2 right-2 p-2 bg-white text-gray-500 hover:text-red-500 rounded-md shadow-sm transition-colors"
                            title="Clear Signature"
                          >
                            <Eraser className="w-4 h-4" />
                          </button>
                        )}
                        {!hasSignature && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-300 text-xl font-bold select-none">
                            Sign Here
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col justify-center gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Apply Signature To</label>
                        <select 
                          value={pagesToSign}
                          onChange={(e: any) => setPagesToSign(e.target.value)}
                          className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 bg-gray-50"
                        >
                          <option value="last">Last Page</option>
                          <option value="first">First Page</option>
                          <option value="all">All Pages</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Position on Page</label>
                        <select 
                          value={position}
                          onChange={(e: any) => setPosition(e.target.value)}
                          className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3 bg-gray-50"
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                          <option value="center">Center</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-8 border-t pt-6">
                    <button 
                      onClick={handleReset}
                      className="px-6 py-3 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSign}
                      disabled={!hasSignature}
                      className="px-8 py-3 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-200 hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      <PenTool className="w-5 h-5" /> Sign PDF
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Processing State */}
              {status === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900">Applying Signature...</h3>
                  <p className="text-gray-500 mt-2">Stamping securely in your browser.</p>
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
                    Your signature has been securely added to the document.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <a 
                      href={downloadUrl} 
                      download={`Signed_${file?.name}`}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md shadow-blue-200 hover:shadow-lg"
                    >
                      <Download className="w-5 h-5" />
                      Download PDF
                    </a>
                    <button 
                      onClick={handleReset}
                      className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-4 px-8 rounded-xl transition-all"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Sign Another
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
    </div>
  );
}
