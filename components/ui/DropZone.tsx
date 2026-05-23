"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { UploadCloud, FileText, X, AlertCircle } from "lucide-react";
import { isPdf } from "@/lib/pdf/validate";

interface DropZoneProps {
  onFilesAccepted: (files: File[]) => void;
  maxFiles?: number;
  existingFiles?: File[];
  onRemoveFile?: (index: number) => void;
}

export default function DropZone({
  onFilesAccepted,
  maxFiles = 20,
  existingFiles = [],
  onRemoveFile,
}: DropZoneProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const onDrop = useCallback(
    async (accepted: File[], rejected: FileRejection[]) => {
      const errors: string[] = [];

      // Validate rejected by react-dropzone (wrong MIME type etc.)
      rejected.forEach((r) => {
        errors.push(`"${r.file.name}" was rejected: ${r.errors.map((e) => e.message).join(", ")}`);
      });

      // SECURITY: Validate magic bytes — don't trust the extension or MIME type alone
      const verified: File[] = [];
      await Promise.all(
        accepted.map(async (file) => {
          const valid = await isPdf(file);
          if (valid) {
            verified.push(file);
          } else {
            errors.push(
              `"${file.name}" failed PDF signature check. Only real PDF files are accepted.`
            );
          }
        })
      );

      setValidationErrors(errors);

      if (verified.length > 0) {
        onFilesAccepted(verified);
      }
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles,
    // 200 MB max per file
    maxSize: 200 * 1024 * 1024,
  });

  const borderColor = isDragReject
    ? "var(--error)"
    : isDragActive
    ? "var(--brand-primary)"
    : "rgba(99,102,241,0.25)";

  const bgColor = isDragActive
    ? "rgba(99,102,241,0.08)"
    : "rgba(18,18,26,0.6)";

  return (
    <div style={{ width: "100%" }}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        id="pdf-dropzone"
        role="button"
        aria-label="Click or drag and drop PDF files here"
        tabIndex={0}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: "20px",
          padding: "3.5rem 2rem",
          textAlign: "center",
          cursor: "pointer",
          background: bgColor,
          transition: "all 0.25s ease",
          outline: "none",
        }}
      >
        <input {...getInputProps()} id="pdf-file-input" aria-label="PDF file input" />

        <div
          aria-hidden="true"
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: isDragActive
                ? "rgba(99,102,241,0.2)"
                : "rgba(99,102,241,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${borderColor}`,
              transition: "all 0.25s ease",
              animation: isDragActive ? "pulse-glow 1s ease-in-out infinite" : "none",
            }}
          >
            <UploadCloud
              size={32}
              color={isDragActive ? "#818cf8" : "#6366f1"}
              strokeWidth={1.5}
            />
          </div>
        </div>

        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: 700,
            color: isDragActive ? "#a5b4fc" : "var(--text-primary)",
            marginBottom: "0.5rem",
            letterSpacing: "-0.01em",
            transition: "color 0.2s",
          }}
        >
          {isDragActive ? "Drop your PDFs here!" : "Drag & Drop PDFs Here"}
        </h2>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1rem" }}>
          or click to browse files — up to {maxFiles} files, 200 MB each
        </p>

        <button
          type="button"
          className="btn-primary"
          style={{ fontSize: "0.875rem", padding: "0.6rem 1.75rem" }}
          onClick={(e) => e.stopPropagation()}
        >
          Browse Files
        </button>

        <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          🔒 Files are processed entirely in your browser — never uploaded to a server
        </p>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div
          role="alert"
          style={{
            marginTop: "1rem",
            padding: "1rem",
            borderRadius: "12px",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
          }}
        >
          {validationErrors.map((err, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                color: "var(--error)",
                fontSize: "0.82rem",
                marginBottom: i < validationErrors.length - 1 ? "0.5rem" : 0,
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
              {err}
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      {existingFiles.length > 0 && (
        <div
          aria-label="Selected PDF files"
          style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}
        >
          {existingFiles.map((file, idx) => (
            <div
              key={`${file.name}-${idx}`}
              role="listitem"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                borderRadius: "12px",
                background: "rgba(18,18,26,0.8)",
                border: "1px solid var(--surface-border)",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "8px",
                  background: "rgba(99,102,241,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileText size={18} color="#818cf8" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {file.name}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              {onRemoveFile && (
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => onRemoveFile(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: "4px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--error)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
