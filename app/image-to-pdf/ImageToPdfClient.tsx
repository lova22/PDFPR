"use client";

import { useState, useCallback } from "react";
import { Image as ImageIcon, Loader2, Download, RefreshCw, CheckCircle2, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument, PageSizes } from "pdf-lib";

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export default function ImageToPdfClient() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [margin, setMargin] = useState<"no-margin" | "small" | "big">("small");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
    setStatus("idle");
    setErrorMessage("");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] },
    multiple: true,
  });

  const removeImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      const toRemove = prev.find((img) => img.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.previewUrl);
      return filtered;
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImages((prev) => {
      const newImages = [...prev];
      if (index + direction < 0 || index + direction >= newImages.length) return prev;
      const temp = newImages[index];
      newImages[index] = newImages[index + direction];
      newImages[index + direction] = temp;
      return newImages;
    });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setStatus("processing");
    setErrorMessage("");

    try {
      const pdfDoc = await PDFDocument.create();

      for (const imgItem of images) {
        const imageBytes = await imgItem.file.arrayBuffer();
        let pdfImage;
        
        if (imgItem.file.type === "image/png") {
          pdfImage = await pdfDoc.embedPng(imageBytes);
        } else {
          pdfImage = await pdfDoc.embedJpg(imageBytes);
        }

        const page = pdfDoc.addPage(PageSizes.A4);
        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        // Calculate margin size
        const marginPts = margin === "no-margin" ? 0 : margin === "small" ? 20 : 50;
        
        const availableWidth = pageWidth - (marginPts * 2);
        const availableHeight = pageHeight - (marginPts * 2);

        const imgDims = pdfImage.scaleToFit(availableWidth, availableHeight);

        // Center the image
        const xPos = (pageWidth / 2) - (imgDims.width / 2);
        const yPos = (pageHeight / 2) - (imgDims.height / 2);

        page.drawImage(pdfImage, {
          x: xPos,
          y: yPos,
          width: imgDims.width,
          height: imgDims.height,
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
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  const handleReset = () => {
    images.forEach(img => URL.revokeObjectURL(img.previewUrl));
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
        <div className="bg-yellow-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-yellow-200">
          <ImageIcon className="w-8 h-8 text-yellow-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          JPG/PNG to PDF
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Convert multiple images into a single, high-quality PDF document securely in your browser.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <motion.div layout className="bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden">
          
          {/* Dropzone (always visible unless completed/error) */}
          {status !== "completed" && status !== "error" && (
            <div
              {...getRootProps()}
              className={`mb-8 border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ease-in-out ${
                isDragActive ? "border-yellow-500 bg-yellow-50" : "border-gray-300 hover:border-yellow-400 hover:bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />
              <div className="bg-yellow-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-xl font-bold text-gray-800 mb-1">Add Images</p>
              <p className="text-gray-500">Drop your JPGs and PNGs here</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {images.length > 0 && status === "idle" && (
              <motion.div
                key="image-list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {/* Options */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-6 border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Page Margin</h3>
                  <div className="flex gap-4">
                    {(["no-margin", "small", "big"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setMargin(m)}
                        className={`flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all border-2 ${
                          margin === m ? "border-yellow-500 bg-yellow-100 text-yellow-800" : "border-transparent bg-white text-gray-600 hover:border-gray-300 shadow-sm"
                        }`}
                      >
                        {m === "no-margin" ? "None" : m === "small" ? "Small" : "Large"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* List of images */}
                <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {images.map((img, index) => (
                    <div key={img.id} className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all group">
                      <img src={img.previewUrl} alt={img.file.name} className="w-16 h-16 object-cover rounded-lg border border-gray-100" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">{img.file.name}</p>
                        <p className="text-xs text-gray-500">{(img.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => moveImage(index, -1)} disabled={index === 0} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-30">
                          <ArrowUp size={18} />
                        </button>
                        <button onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-30">
                          <ArrowDown size={18} />
                        </button>
                        <button onClick={() => removeImage(img.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg ml-2">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-4">
                  <button 
                    onClick={() => setImages([])}
                    className="px-6 py-3 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Clear All
                  </button>
                  <button 
                    onClick={handleConvert}
                    className="px-8 py-3 font-bold text-white bg-yellow-500 hover:bg-yellow-600 rounded-xl transition-all shadow-md shadow-yellow-200 hover:shadow-lg flex items-center gap-2"
                  >
                    Convert to PDF
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
                <Loader2 className="w-12 h-12 animate-spin text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Creating PDF...</h3>
                <p className="text-gray-500 mt-2">Merging {images.length} images into a single document.</p>
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">PDF Ready!</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                  Your images have been successfully converted into a PDF document.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href={downloadUrl} 
                    download={`images-to-pdf-${Date.now()}.pdf`}
                    className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md shadow-yellow-200 hover:shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </a>
                  <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold py-4 px-8 rounded-xl transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Create Another
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
