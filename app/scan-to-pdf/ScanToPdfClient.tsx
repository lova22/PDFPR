"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Image as ImageIcon, Loader2, Download, AlertCircle, RefreshCw, CheckCircle2, Trash2, SwitchCamera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument } from "pdf-lib";

interface ScannedImage {
  id: string;
  dataUrl: string;
}

export default function ScanToPdfClient() {
  const [status, setStatus] = useState<"idle" | "camera" | "processing" | "completed" | "error">("idle");
  const [images, setImages] = useState<ScannedImage[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    setStatus("camera");
    setErrorMessage("");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage("Could not access the camera. Please ensure you have granted camera permissions.");
    }
  }, [facingMode]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setImages(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), dataUrl }]);
      }
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
    startCamera();
  };

  const createPdf = async () => {
    if (images.length === 0) return;
    setStatus("processing");
    try {
      const pdfDoc = await PDFDocument.create();
      
      for (const img of images) {
        const imageBytes = await fetch(img.dataUrl).then(res => res.arrayBuffer());
        const embeddedImage = await pdfDoc.embedJpg(imageBytes);
        
        const dims = embeddedImage.scale(1);
        const page = pdfDoc.addPage([dims.width, dims.height]);
        
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: dims.width,
          height: dims.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus("completed");
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage("An error occurred while generating the PDF.");
    }
  };

  const handleReset = () => {
    setImages([]);
    setStatus("idle");
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setErrorMessage("");
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-indigo-200">
          <Camera className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Scan to PDF
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Capture documents directly from your camera and merge them into a PDF.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        <motion.div layout className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden">
          <AnimatePresence mode="wait">
            
            {status === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-12 h-12 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Ready to scan your documents?</h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  Click the button below to activate your camera. You can take multiple photos and compile them into a single PDF file securely in your browser.
                </p>
                <button
                  onClick={startCamera}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-xl transition-all shadow-md shadow-indigo-200 hover:shadow-lg flex items-center gap-2 mx-auto"
                >
                  <Camera className="w-5 h-5" />
                  Start Camera
                </button>
              </motion.div>
            )}

            {status === "camera" && (
              <motion.div
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col lg:flex-row gap-8"
              >
                {/* Camera View */}
                <div className="flex-1 flex flex-col items-center">
                  <div className="relative w-full max-w-xl bg-black rounded-2xl overflow-hidden aspect-[3/4] md:aspect-video shadow-inner">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Camera Controls Overlay */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-6 z-10 px-4">
                      <button 
                        onClick={toggleCamera}
                        className="p-3 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white rounded-full transition-colors"
                        title="Switch Camera"
                      >
                        <SwitchCamera className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={takePhoto}
                        className="w-16 h-16 bg-white/90 hover:bg-white backdrop-blur-md rounded-full border-4 border-indigo-500 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-lg"
                      >
                        <div className="w-12 h-12 bg-indigo-500 rounded-full" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Camera active. Ensure good lighting for best results.
                  </p>
                </div>

                {/* Scanned Images Sidebar */}
                <div className="w-full lg:w-80 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 text-lg">Scanned Pages</h3>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                      {images.length}
                    </span>
                  </div>
                  
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-4 min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar flex flex-col gap-4">
                    {images.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                        <p className="text-sm text-center">Take a photo to add pages here.</p>
                      </div>
                    ) : (
                      images.map((img, i) => (
                        <div key={img.id} className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-200 aspect-[3/4] bg-white">
                          <img src={img.dataUrl} alt={`Page ${i+1}`} className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2">
                            <button 
                              onClick={() => removeImage(img.id)}
                              className="p-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm">
                            Page {i + 1}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button 
                      onClick={createPdf}
                      disabled={images.length === 0}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-md shadow-indigo-200 flex justify-center items-center gap-2"
                    >
                      <Download className="w-5 h-5" /> Generate PDF
                    </button>
                  </div>
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
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Creating PDF...</h3>
                <p className="text-gray-500 mt-2">Stitching your scanned pages together locally.</p>
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
                  Your scanned document has been saved as a high-quality PDF.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href={downloadUrl} 
                    download={`Scanned_Document_${Date.now()}.pdf`}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md shadow-indigo-200"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </a>
                  <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-4 px-8 rounded-xl transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Scan New Document
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
