"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Type, File as FileIcon, Loader2, Download, AlertCircle, RefreshCw, CheckCircle2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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
    script.onerror = () => reject(new Error("Failed to load PDF.js from CDN."));
    document.head.appendChild(script);
  });
}

interface TextItem {
  id: string;
  originalStr: string;
  currentStr: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  pdfLibX: number;
  pdfLibY: number;
  pdfLibWidth: number;
  pdfLibHeight: number;
}

interface PageEdits {
  [pageIndex: number]: TextItem[];
}

export default function EditPdfClient() {
  const [file, setFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "editing" | "saving" | "completed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // PDF.js State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  // Editor State
  const [textItems, setTextItems] = useState<TextItem[]>([]);
  const [pageEdits, setPageEdits] = useState<PageEdits>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initPdf = async (file: File) => {
    setStatus("loading");
    setErrorMessage("");
    try {
      const bytes = await file.arrayBuffer();
      setFileBytes(new Uint8Array(bytes));
      
      const pdfjsLib = await loadPdfjsScript();
      const doc = await pdfjsLib.getDocument(bytes).promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
      setStatus("editing");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage("Failed to load PDF for editing. Ensure it's a valid PDF file.");
    }
  };

  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || status !== "editing") return;
    
    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      setViewportSize({ width: viewport.width, height: viewport.height });

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Extract text content for the overlay
      const textContent = await page.getTextContent();
      const items: TextItem[] = [];

      // We need the unscaled viewport to map to pdf-lib later
      const unscaledViewport = page.getViewport({ scale: 1.0 });

      textContent.items.forEach((item: any, index: number) => {
        // Skip empty strings
        if (!item.str || item.str.trim() === "") return;

        // pdf.js transform: [scaleX, skewY, skewX, scaleY, translateX, translateY]
        const tx = item.transform;
        
        // Convert to scaled viewport for CSS overlay rendering
        const scaledTx = (window as any).pdfjsLib.Util.transform(viewport.transform, tx);
        const fontSize = Math.sqrt((scaledTx[2] * scaledTx[2]) + (scaledTx[3] * scaledTx[3]));
        
        const x = scaledTx[4];
        // y is baseline in pdf.js. CSS top requires adjusting by ascent
        const y = scaledTx[5] - fontSize; 
        const width = item.width * scale;
        const height = fontSize;

        // pdf-lib raw coordinates
        const pdfLibFontSize = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
        const pdfLibX = tx[4];
        const pdfLibY = tx[5]; // pdf-lib Y is exactly the baseline
        const pdfLibWidth = item.width;
        const pdfLibHeight = pdfLibFontSize;

        const id = `page-${currentPage}-item-${index}`;
        
        // If we already edited this item on this page, use the edited string
        const existingEdit = pageEdits[currentPage]?.find(e => e.id === id);

        items.push({
          id,
          originalStr: item.str,
          currentStr: existingEdit ? existingEdit.currentStr : item.str,
          x,
          y,
          width,
          height,
          fontSize,
          pdfLibX,
          pdfLibY,
          pdfLibWidth,
          pdfLibHeight
        });
      });

      setTextItems(items);

    } catch (err) {
      console.error("Error rendering page:", err);
    }
  }, [pdfDoc, currentPage, scale, status, pageEdits]);

  useEffect(() => {
    if (pdfDoc && status === "editing") {
      renderPage();
    }
  }, [pdfDoc, currentPage, scale, status, renderPage]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      initPdf(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
  });

  const handleTextChange = (id: string, newStr: string) => {
    setTextItems(prev => prev.map(item => item.id === id ? { ...item, currentStr: newStr } : item));
    
    // Save to pageEdits
    setPageEdits(prev => {
      const pageArray = prev[currentPage] || [];
      const itemIndex = pageArray.findIndex(e => e.id === id);
      const activeItem = textItems.find(t => t.id === id);
      
      if (!activeItem) return prev;

      const updatedItem = { ...activeItem, currentStr: newStr };

      if (itemIndex >= 0) {
        const newArray = [...pageArray];
        newArray[itemIndex] = updatedItem;
        return { ...prev, [currentPage]: newArray };
      } else {
        return { ...prev, [currentPage]: [...pageArray, updatedItem] };
      }
    });
  };

  const savePdf = async () => {
    if (!fileBytes) return;
    setStatus("saving");
    try {
      const pdf = await PDFDocument.load(fileBytes);
      const helveticaFont = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();

      // Apply edits for all pages
      for (const pageNumStr of Object.keys(pageEdits)) {
        const pageNum = parseInt(pageNumStr);
        const edits = pageEdits[pageNum];
        if (!edits || edits.length === 0) continue;

        // pdf-lib is 0-indexed
        const pdfPage = pages[pageNum - 1];

        for (const edit of edits) {
          if (edit.currentStr === edit.originalStr) continue; // No change

          // 1. Draw a white box over the original text to hide it
          pdfPage.drawRectangle({
            x: edit.pdfLibX,
            y: edit.pdfLibY - (edit.pdfLibHeight * 0.2), // Adjust for descenders
            width: edit.pdfLibWidth + 5, // buffer
            height: edit.pdfLibHeight + 2, // buffer
            color: rgb(1, 1, 1), // White
          });

          // 2. Draw the new text exactly where the old text was
          pdfPage.drawText(edit.currentStr, {
            x: edit.pdfLibX,
            y: edit.pdfLibY,
            size: edit.pdfLibHeight,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
        }
      }

      const newPdfBytes = await pdf.save();
      const blob = new Blob([newPdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus("completed");

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage("Failed to save the edited PDF.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileBytes(null);
    setPdfDoc(null);
    setPageEdits({});
    setTextItems([]);
    setStatus("idle");
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setErrorMessage("");
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="bg-pink-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-pink-200">
          <Type className="w-8 h-8 text-pink-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Online PDF Editor
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          The easiest way to edit PDF files online. Click on any text inside your document to rewrite, edit, or delete it instantly.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        <motion.div layout className="w-full bg-white border border-gray-200 rounded-3xl shadow-lg relative overflow-hidden">
          <AnimatePresence mode="wait">
            {!file && (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getRootProps()}
                className={`p-16 border-2 border-dashed m-8 rounded-2xl text-center cursor-pointer transition-all duration-200 ease-in-out ${
                  isDragActive ? "border-pink-500 bg-pink-50" : "border-gray-300 hover:border-pink-400 hover:bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Type className="w-8 h-8 text-pink-600" />
                </div>
                <p className="text-xl font-bold text-gray-800 mb-2">Drop your PDF here</p>
                <p className="text-gray-500">or click to browse</p>
              </motion.div>
            )}

            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Parsing PDF Structure...</h3>
                <p className="text-gray-500 mt-2">Extracting text layers and coordinates securely.</p>
              </motion.div>
            )}

            {status === "editing" && (
              <motion.div
                key="editing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex flex-col items-center bg-gray-100 p-6 rounded-b-3xl"
              >
                {/* Editor Toolbar */}
                <div className="w-full bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4 border border-gray-200">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-semibold text-gray-700">
                      Page {currentPage} of {numPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                      disabled={currentPage >= numPages}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 mr-4 bg-yellow-50 text-yellow-800 px-3 py-1.5 rounded-lg border border-yellow-200 text-sm font-medium">
                      <AlertCircle className="w-4 h-4" /> Click any text block below to edit it.
                    </div>
                    <button 
                      onClick={handleReset}
                      className="px-4 py-2 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={savePdf}
                      className="px-6 py-2 font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-all shadow-md flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save Changes
                    </button>
                  </div>
                </div>

                {/* PDF Canvas Workspace */}
                <div className="w-full overflow-auto custom-scrollbar bg-gray-200 rounded-xl shadow-inner max-h-[70vh] border border-gray-300 flex justify-center">
                  <div 
                    className="relative bg-white shadow-md m-4 flex-shrink-0" 
                    ref={containerRef}
                    style={{ 
                      width: viewportSize.width > 0 ? `${viewportSize.width}px` : 'auto', 
                      height: viewportSize.height > 0 ? `${viewportSize.height}px` : 'auto' 
                    }}
                  >
                    <canvas ref={canvasRef} className="block" />
                    
                    {/* Interactive Text Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                    {textItems.map((item) => {
                      const isEditing = editingItemId === item.id;
                      const hasChanged = item.currentStr !== item.originalStr;

                      return (
                        <div
                          key={item.id}
                          className={`absolute cursor-text pointer-events-auto rounded-[2px] transition-all
                            ${isEditing ? "outline outline-2 outline-pink-500 bg-white shadow-lg z-10" : "hover:outline hover:outline-1 hover:outline-blue-400 hover:bg-blue-50/30"}
                            ${hasChanged && !isEditing ? "bg-green-100/40 outline outline-1 outline-green-400" : ""}
                          `}
                          style={{
                            left: `${item.x}px`,
                            top: `${item.y}px`,
                            width: `${Math.max(item.width, 20)}px`,
                            height: `${item.height * 1.2}px`,
                            lineHeight: `${item.height}px`,
                          }}
                          onClick={() => {
                            if (!isEditing) setEditingItemId(item.id);
                          }}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              type="text"
                              value={item.currentStr}
                              onChange={(e) => handleTextChange(item.id, e.target.value)}
                              onBlur={() => setEditingItemId(null)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === "Escape") setEditingItemId(null);
                              }}
                              className="w-full h-full bg-transparent border-none outline-none p-0 m-0"
                              style={{
                                fontSize: `${item.fontSize}px`,
                                fontFamily: "sans-serif",
                                color: "transparent", // Hide native text, show caret only? No, we need to show what they type.
                                textShadow: "0 0 0 black", // Trick to show text
                              }}
                            />
                          ) : (
                            <div 
                              className="w-full h-full text-transparent selection:bg-pink-200"
                              title="Click to edit"
                            >
                              {item.currentStr}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

            {status === "saving" && (
              <motion.div
                key="saving"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Applying Changes...</h3>
                <p className="text-gray-500 mt-2">Writing new text streams into the PDF.</p>
              </motion.div>
            )}

            {status === "completed" && downloadUrl && (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                  Your PDF text has been successfully modified.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href={downloadUrl} 
                    download={`Edited_${file?.name}`}
                    className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md shadow-pink-200 hover:shadow-lg"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </a>
                  <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-4 px-8 rounded-xl transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Edit Another
                  </button>
                </div>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
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
