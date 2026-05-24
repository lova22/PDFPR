"use client";

import { useState, useCallback } from "react";
import { FormInput, File as FileIcon, Loader2, Download, AlertCircle, RefreshCw, CheckCircle2, Save } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown } from "pdf-lib";

interface FormFieldData {
  name: string;
  type: "text" | "checkbox" | "dropdown" | "other";
  value: string | boolean;
  options?: string[]; // for dropdowns
}

export default function FillPdfClient() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [status, setStatus] = useState<"idle" | "filling" | "processing" | "completed" | "error">("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [fields, setFields] = useState<FormFieldData[]>([]);

  const loadFormFields = async (fileBytes: ArrayBuffer) => {
    try {
      const pdfDoc = await PDFDocument.load(fileBytes);
      const form = pdfDoc.getForm();
      const extractedFields = form.getFields();
      
      const parsedFields: FormFieldData[] = [];

      for (const field of extractedFields) {
        const name = field.getName();
        
        if (field instanceof PDFTextField) {
          parsedFields.push({ name, type: "text", value: field.getText() || "" });
        } else if (field instanceof PDFCheckBox) {
          parsedFields.push({ name, type: "checkbox", value: field.isChecked() });
        } else if (field instanceof PDFDropdown) {
          parsedFields.push({ 
            name, 
            type: "dropdown", 
            value: field.getSelected()[0] || "",
            options: field.getOptions()
          });
        }
      }

      setFields(parsedFields);
      setPdfBytes(new Uint8Array(fileBytes));
      setStatus("filling");

      if (parsedFields.length === 0) {
        setErrorMessage("No fillable form fields were detected in this PDF.");
        setStatus("error");
      }

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage("Could not parse the PDF form structure.");
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus("processing");
      setErrorMessage("");
      const bytes = await acceptedFiles[0].arrayBuffer();
      await loadFormFields(bytes);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
  });

  const handleFieldChange = (name: string, newValue: string | boolean) => {
    setFields(prev => prev.map(f => f.name === name ? { ...f, value: newValue } : f));
  };

  const savePdf = async () => {
    if (!pdfBytes || !file) return;
    setStatus("processing");
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      for (const fieldData of fields) {
        try {
          const field = form.getField(fieldData.name);
          if (fieldData.type === "text" && field instanceof PDFTextField) {
            field.setText(fieldData.value as string);
          } else if (fieldData.type === "checkbox" && field instanceof PDFCheckBox) {
            if (fieldData.value) field.check();
            else field.uncheck();
          } else if (fieldData.type === "dropdown" && field instanceof PDFDropdown) {
            field.select(fieldData.value as string);
          }
        } catch (e) {
          console.warn(`Failed to set field: ${fieldData.name}`);
        }
      }

      // Optionally flatten to lock the form
      // form.flatten();

      const newPdfBytes = await pdfDoc.save();
      const blob = new Blob([newPdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setStatus("completed");

    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage("An error occurred while saving the filled PDF.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus("idle");
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setDownloadUrl(null);
    setErrorMessage("");
    setFields([]);
    setPdfBytes(null);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="bg-orange-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-orange-200">
          <FormInput className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
          Fill PDF Forms
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
          Easily complete PDF forms, checkboxes, and text fields directly in your browser.
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
                  isDragActive ? "border-orange-500 bg-orange-50" : "border-gray-300 hover:border-orange-400 hover:bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FormInput className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-xl font-bold text-gray-800 mb-2">Drop your fillable PDF here</p>
                <p className="text-gray-500">or click to browse</p>
              </motion.div>
            )}

            {status === "filling" && (
              <motion.div
                key="filling"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-8 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <FileIcon className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-lg">{file?.name}</p>
                      <p className="text-sm text-orange-700 font-medium">{fields.length} form fields detected</p>
                    </div>
                  </div>
                  <button 
                    onClick={savePdf}
                    className="hidden sm:flex px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-md items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save PDF
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  {fields.map((field, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 truncate" title={field.name}>
                        {field.name}
                      </label>
                      {field.type === "text" && (
                        <input
                          type="text"
                          value={field.value as string}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2"
                          placeholder={`Enter ${field.name}`}
                        />
                      )}
                      {field.type === "checkbox" && (
                        <div className="flex items-center mt-2">
                          <input
                            type="checkbox"
                            checked={field.value as boolean}
                            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                            className="w-6 h-6 text-orange-600 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                          />
                          <span className="ml-3 text-gray-700">Check/Uncheck</span>
                        </div>
                      )}
                      {field.type === "dropdown" && (
                        <select
                          value={field.value as string}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 bg-white"
                        >
                          <option value="">Select an option...</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
                  <button 
                    onClick={handleReset}
                    className="px-6 py-3 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={savePdf}
                    className="px-8 py-3 font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-all shadow-md flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" /> Save & Download
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
                <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900">Processing...</h3>
                <p className="text-gray-500 mt-2">Reading form data securely in your browser.</p>
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
                  Your PDF form has been successfully filled and saved.
                </p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <a 
                    href={downloadUrl} 
                    download={`Filled_${file?.name}`}
                    className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md shadow-orange-200"
                  >
                    <Download className="w-5 h-5" />
                    Download PDF
                  </a>
                  <button 
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-4 px-8 rounded-xl transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Fill Another
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
