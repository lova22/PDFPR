"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { UploadCloud, File as FileIcon, Loader2, Download, AlertCircle, FileText, FileUp, RefreshCw, CheckCircle2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { queueWordToPdfJob } from "@/app/actions/wordToPdf";
import { createClient } from "@/lib/supabase/client";

const AdPlaceholder = () => (
  <div className="w-full h-full min-h-[400px] lg:min-h-[600px] bg-gray-100 border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 font-medium relative overflow-hidden">
    Ad Space
  </div>
);

export default function WordToPdfClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    accept: { 
      "application/msword": [".doc"], 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] 
    },
    maxFiles: 1,
    multiple: false,
  });

  // Smart simulated progress bar effect
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    if (status === "processing") {
      setProgress(0);
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 85) {
            return prev + Math.floor(Math.random() * 8) + 2; // Jump quickly to 85%
          } else if (prev < 95) {
            return prev + Math.random(); // Crawl slowly to 95%
          }
          return prev; // Hold at 95% until backend completes
        });
      }, 500);
    } else if (status === "completed") {
      setProgress(100);
    } else if (status === "idle" || status === "error") {
      setProgress(0);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [status]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleConvert = async () => {
    if (!file) return;

    setStatus("processing");
    setProgress(0);
    setErrorMessage("");
    
    try {
      const supabase = createClient();
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session. Please refresh the page.");

      const userId = session.user.id;
      const originalStoragePath = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;

      const { error: uploadError } = await supabase.storage
        .from('pdf_documents')
        .upload(originalStoragePath, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const res = await queueWordToPdfJob(originalStoragePath, file.size);
      
      if (!res.success || !res.jobId) {
        throw new Error(res.error || "Failed to queue job.");
      }

      const jobId = res.jobId;

      pollIntervalRef.current = setInterval(async () => {
        const { data: job, error: jobError } = await supabase
          .from('user_jobs')
          .select('status, result_file_path, error_message')
          .eq('id', jobId)
          .single();

        if (jobError) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setErrorMessage(`Error checking job status: ${jobError.message}`);
          setStatus("error");
          return;
        }

        if (job.status === 'completed' && job.result_file_path) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          
          const { data: urlData, error: urlError } = await supabase.storage
            .from('pdf_documents')
            .createSignedUrl(job.result_file_path, 3600);
            
          if (urlError || !urlData) {
            setErrorMessage("Job completed but failed to generate download link.");
            setStatus("error");
          } else {
            setDownloadUrl(urlData.signedUrl);
            setStatus("completed");
          }
        } else if (job.status === 'failed') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setErrorMessage(job.error_message || "Conversion failed unexpectedly.");
          setStatus("error");
        }
      }, 2000);

    } catch (err: any) {
      console.error(err);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setDownloadUrl(null);
    setProgress(0);
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-8 pt-32 pb-20 min-h-screen">
      <div className="text-center mb-16 relative">

        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Word to PDF
        </h1>
        <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto font-medium">
          Convert your Word documents (.doc, .docx) into universally compatible PDFs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="hidden lg:block lg:col-span-3">
          <AdPlaceholder />
        </div>

        <div className="lg:col-span-6 flex flex-col items-center">
          <motion.div 
            layout
            className="w-full bg-white border border-gray-200 rounded-3xl p-8 md:p-10 shadow-lg relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {status === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div 
                    {...(getRootProps() as any)} 
                    className={`group relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                      isDragActive 
                        ? "border-rose-500 bg-rose-50 scale-[1.02]" 
                        : "border-gray-300 hover:border-rose-300 hover:bg-gray-50"
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="bg-rose-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-transform group-hover:scale-110">
                      <FileText className="w-10 h-10 text-rose-600" />
                    </div>
                    
                    {file ? (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                          <FileIcon className="w-6 h-6 text-rose-600" />
                          <span className="truncate max-w-[200px] md:max-w-xs">{file.name}</span>
                        </div>
                        <span className="text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full text-sm border border-gray-200">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ) : (
                      <>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-rose-600 transition-colors">
                          Drag & Drop your Word file
                        </h3>
                        <p className="text-gray-500 font-medium">or click to browse from your device</p>
                      </>
                    )}
                  </div>

                  <AnimatePresence>
                    {file && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      >
                        <button
                          onClick={handleConvert}
                          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-3 relative overflow-hidden group"
                        >
                          <FileUp className="w-6 h-6" /> 
                          <span>Convert to PDF Now</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {status === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="py-16 flex flex-col items-center justify-center text-center"
                >
                  <div className="relative w-24 h-24 mb-8">
                    <svg className="w-full h-full text-gray-200" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" stroke="currentColor" />
                      <circle 
                        cx="50" cy="50" r="45" fill="none" strokeWidth="8" 
                        stroke="#e11d48" strokeLinecap="round"
                        strokeDasharray="283"
                        strokeDashoffset={283 - (283 * progress) / 100}
                        className="transition-all duration-300 ease-out"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-900">
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Converting Document</h3>
                  <p className="text-gray-500 font-medium">Please wait while we process your file...</p>
                </motion.div>
              )}

              {status === "completed" && downloadUrl && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", bounce: 0.4 }}
                  className="py-12 flex flex-col items-center justify-center text-center"
                >
                  <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">Success!</h3>
                  <p className="text-gray-500 font-medium mb-10 text-lg">Your Word document has been converted to PDF.</p>
                  
                  <div className="flex flex-col w-full gap-4">
                    <a 
                      href={downloadUrl} 
                      download={`${file?.name.replace(/\.[^/.]+$/, "")}.pdf`}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-md flex justify-center items-center gap-3"
                    >
                      <Download className="w-6 h-6" /> Download Converted PDF
                    </a>
                    <button 
                      onClick={handleReset}
                      className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-lg py-4 rounded-xl transition-all flex justify-center items-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" /> Convert Another File
                    </button>
                  </div>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center"
                >
                  <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Conversion Failed</h3>
                  <div className="bg-red-50 border border-red-200 p-5 rounded-xl w-full max-w-md mb-8">
                    <p className="text-red-600 font-medium break-words text-sm">{errorMessage}</p>
                  </div>
                  <button 
                    onClick={handleReset}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-8 rounded-xl transition-colors"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="hidden lg:block lg:col-span-3">
          <AdPlaceholder />
        </div>
      </div>
      
      <div className="mt-8 lg:hidden block w-full h-[150px] bg-gray-100 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 font-medium">
        Ad Space
      </div>
    </div>
  );
}
