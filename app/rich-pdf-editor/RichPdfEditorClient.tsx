"use client";

import { useState, useCallback, useEffect } from "react";
import { FileText, Loader2, Download, AlertCircle, RefreshCw, CheckCircle2, Save } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import { queuePdfToWordJob } from "@/app/actions/queuePdfToWordJob";
import { queueHtmlToPdfJob } from "@/app/actions/queueHtmlToPdfJob";
import dynamic from "next/dynamic";
import mammoth from "mammoth";
import "react-quill/dist/quill.snow.css";

// ReactQuill must be loaded dynamically without SSR
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function RichPdfEditorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "converting-word" | "editing" | "converting-pdf" | "completed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setStatus("uploading");
    setErrorMessage("");

    try {
      // 1. Authenticate anonymously
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
      if (authError || !authData.user) throw new Error("Failed to authenticate anonymously.");
      const user = authData.user;

      // 2. Upload original PDF
      const fileExt = selectedFile.name.split(".").pop();
      const storagePath = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("pdf_documents")
        .upload(storagePath, selectedFile);
      
      if (uploadError) throw new Error("Failed to upload the file securely.");

      const { data: { publicUrl } } = supabase.storage
        .from("pdf_documents")
        .getPublicUrl(storagePath);

      // 3. Queue PDF to Word Job
      setStatus("converting-word");
      const { jobId, success, error: queueError } = await queuePdfToWordJob(user.id, selectedFile.name, publicUrl);
      if (!success) throw new Error(queueError);

      // 4. Poll for Word completion
      pollForWordCompletion(jobId!, user.id);

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred.");
    }
  }, []);

  const pollForWordCompletion = (jobId: string, userId: string) => {
    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from("user_jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) {
        clearInterval(interval);
        setStatus("error");
        setErrorMessage("Failed to check job status.");
        return;
      }

      if (data.status === "completed" && data.result_url) {
        clearInterval(interval);
        loadWordIntoEditor(data.result_url);
      } else if (data.status === "failed") {
        clearInterval(interval);
        setStatus("error");
        setErrorMessage(data.error_message || "Failed to convert PDF to flowable text.");
      }
    }, 2000);
  };

  const loadWordIntoEditor = async (docxUrl: string) => {
    try {
      // Download the DOCX file
      const response = await fetch(docxUrl);
      const arrayBuffer = await response.arrayBuffer();

      // Convert DOCX to HTML using mammoth
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setHtmlContent(result.value);
      setStatus("editing");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage("Failed to parse the flowable text document.");
    }
  };

  const savePdf = async () => {
    setStatus("converting-pdf");
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error("User session lost.");

      // Wrap mammoth's partial HTML in a full HTML document with some basic styling
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
    p { margin-bottom: 1em; }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

      // Upload HTML Blob
      const blob = new Blob([fullHtml], { type: "text/html" });
      const htmlFileName = `edited-${Date.now()}.html`;
      const storagePath = `${user.id}/${htmlFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("pdf_documents")
        .upload(storagePath, blob);

      if (uploadError) throw new Error("Failed to securely upload changes.");

      const { data: { publicUrl } } = supabase.storage
        .from("pdf_documents")
        .getPublicUrl(storagePath);

      // Queue HTML to PDF Job
      const { jobId, success, error: queueError } = await queueHtmlToPdfJob(user.id, `Edited_${file?.name || 'document.pdf'}`, publicUrl);
      if (!success) throw new Error(queueError);

      // Poll for final PDF
      pollForPdfCompletion(jobId!);

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Failed to save PDF changes.");
    }
  };

  const pollForPdfCompletion = (jobId: string) => {
    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from("user_jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) {
        clearInterval(interval);
        setStatus("error");
        setErrorMessage("Failed to check save status.");
        return;
      }

      if (data.status === "completed" && data.result_url) {
        clearInterval(interval);
        setDownloadUrl(data.result_url);
        setStatus("completed");
      } else if (data.status === "failed") {
        clearInterval(interval);
        setStatus("error");
        setErrorMessage(data.error_message || "Failed to render final PDF.");
      }
    }, 2000);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
  });

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    setDownloadUrl(null);
    setErrorMessage("");
    setHtmlContent("");
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'clean']
    ],
  };

  return (
    <div className="w-full">
      <div className="text-center mb-10">
        <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-indigo-200">
          <FileText className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Rich PDF Editor
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          A true Word-like experience. We convert your PDF to a flowable format so you can type, highlight, and format text seamlessly.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        <motion.div layout className="w-full bg-white border border-gray-200 rounded-3xl shadow-lg relative overflow-hidden">
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                {...getRootProps()}
                className={`p-16 border-2 border-dashed m-8 rounded-2xl text-center cursor-pointer transition-all duration-200 ease-in-out ${
                  isDragActive ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-xl font-bold text-gray-800 mb-2">Drop a PDF to start writing</p>
                <p className="text-gray-500 text-sm mt-2 font-semibold">⚠️ Note: Highly complex visual layouts (like tax forms) may shift during conversion. Best for text-heavy documents.</p>
              </motion.div>
            )}

            {(status === "uploading" || status === "converting-word") && (
              <motion.div
                key="converting-word"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">
                  {status === "uploading" ? "Uploading securely..." : "Reflowing PDF to text..."}
                </h3>
                <p className="text-gray-500 mt-2">Breaking down absolute vector positions into editable paragraphs.</p>
              </motion.div>
            )}

            {status === "editing" && (
              <motion.div
                key="editing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-gray-50 p-6 rounded-b-3xl"
              >
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center justify-between border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="font-semibold text-gray-900">{file?.name}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleReset}
                      className="px-4 py-2 font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={savePdf}
                      className="px-6 py-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-md flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" /> Save as PDF
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {/* ReactQuill Editor */}
                  <div className="min-h-[500px]">
                    <ReactQuill 
                      theme="snow" 
                      value={htmlContent} 
                      onChange={setHtmlContent}
                      modules={modules}
                      className="h-[500px]"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {status === "converting-pdf" && (
              <motion.div
                key="converting-pdf"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Rebuilding PDF...</h3>
                <p className="text-gray-500 mt-2">Converting your typed text back into a fixed PDF document.</p>
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Editing Complete!</h3>
                <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                  Your flowable text has been converted back into a solid PDF format.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href={downloadUrl} 
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
