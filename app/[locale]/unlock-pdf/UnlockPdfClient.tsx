"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Unlock, File as FileIcon, Loader2, Download, AlertCircle, RefreshCw, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { queueUnlockPdfJob } from "@/app/actions/queueUnlockPdfJob";
import { createClient } from "@/lib/supabase/client";

export default function UnlockPdfClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "processing" | "completed" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus("idle");
      setErrorMessage("");
      setProgress(0);
      setPassword("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
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
          if (prev < 85) return prev + Math.floor(Math.random() * 8) + 2;
          else if (prev < 95) return prev + Math.random();
          return prev;
        });
      }, 500);
    } else if (status === "completed") setProgress(100);
    else if (status === "idle" || status === "error") setProgress(0);
    return () => { if (progressInterval) clearInterval(progressInterval); };
  }, [status]);

  useEffect(() => {
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
  }, []);

  const handleUnlock = async () => {
    if (!file || !password) return;
    setStatus("processing");
    setProgress(0);
    setErrorMessage("");
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || 'anonymous';
      
      const originalStoragePath = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;

      const { error: uploadError } = await supabase.storage
        .from('pdf_documents')
        .upload(originalStoragePath, file, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const res = await queueUnlockPdfJob(originalStoragePath, password);
      
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
          setErrorMessage(job.error_message || "Unlock failed. Did you provide the correct password?");
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
    setErrorMessage("");
    setPassword("");
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="bg-cyan-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-cyan-200">
          <Unlock className="w-8 h-8 text-cyan-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Unlock PDF
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Remove password security from your PDF documents instantly.
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
                    isDragActive ? "border-cyan-500 bg-cyan-50" : "border-gray-300 hover:border-cyan-400 hover:bg-gray-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="bg-cyan-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Unlock className="w-8 h-8 text-cyan-600" />
                  </div>
                  <p className="text-xl font-bold text-gray-800 mb-2">Drop your protected PDF here</p>
                  <p className="text-gray-500">or click to browse</p>
                </motion.div>
              )}

              {/* Password Entry & Processing State */}
              {file && status !== "completed" && status !== "error" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full"
                >
                  <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-6 mb-8 flex items-center gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <FileIcon className="w-8 h-8 text-cyan-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-lg">{file.name}</p>
                      <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>

                  {status === "idle" && (
                    <div className="mb-8">
                      <label className="block text-gray-700 font-semibold mb-2" htmlFor="password">
                        Enter the document password to unlock it
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Type password..."
                          className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all text-gray-800 text-lg outline-none pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {status === "processing" && (
                    <div className="mb-8">
                      <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>Decrypting PDF...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-center text-sm text-gray-500 mt-4 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Removing password security...
                      </p>
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
                      onClick={handleUnlock}
                      disabled={status === "processing" || !password}
                      className="px-8 py-3 font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-all shadow-md shadow-cyan-200 hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {status === "processing" ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Processing</>
                      ) : (
                        <><Unlock className="w-5 h-5" /> Unlock PDF</>
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
                    Your PDF has been successfully decrypted and unlocked.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <a 
                      href={downloadUrl} 
                      download={`unlocked-${file?.name}`}
                      className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md shadow-cyan-200 hover:shadow-lg"
                    >
                      <Download className="w-5 h-5" />
                      Download Unlocked PDF
                    </a>
                    <button 
                      onClick={handleReset}
                      className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-bold py-4 px-8 rounded-xl transition-all"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Unlock Another
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
