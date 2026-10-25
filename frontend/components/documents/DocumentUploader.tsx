"use client";

import React, { useState, useRef } from "react";
import { api } from "@/lib/api";
import { DocumentItem } from "@/lib/types";
import { Upload, FileUp, AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  onUploaded: (doc: DocumentItem) => void;
}

export function DocumentUploader({ onUploaded }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(null);

    // Extension check
    const allowed = [".pdf", ".docx", ".doc", ".txt", ".text", ".md"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setError(`Unsupported file type '${ext}'. Please upload a PDF, DOCX, or TXT document.`);
      return;
    }

    // Size check (15 MB)
    if (file.size > 15 * 1024 * 1024) {
      setError("File exceeds 15 MB limit. Please select a smaller academic document.");
      return;
    }

    setUploading(true);
    try {
      const doc = await api.uploadDocument(file);
      setSuccess(`'${doc.original_name}' uploaded and text extracted (${doc.word_count} words).`);
      onUploaded(doc);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`nb-card p-8 border-dashed border-2 cursor-pointer text-center transition-all ${
          isDragging
            ? "border-amber-500 bg-amber-50 scale-[1.01]"
            : "border-slate-900 bg-white hover:bg-slate-50"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          accept=".pdf,.docx,.doc,.txt,.text,.md"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-lg bg-amber-300 border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
            {uploading ? (
              <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileUp className="w-6 h-6 text-slate-900" />
            )}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-base">
              {uploading ? "Extracting academic text..." : "Drop your syllabus, assignment, or notice here"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-semibold">
              Supports PDF, DOCX, and TXT (up to 15 MB)
            </p>
          </div>
          <button
            type="button"
            disabled={uploading}
            className="nb-btn px-4 py-2 bg-amber-400 text-slate-950 text-xs font-bold pointer-events-none"
          >
            {uploading ? "Parsing..." : "Browse Files"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-100 border-2 border-slate-900 rounded-md flex items-center gap-2 text-xs font-bold text-red-900">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-100 border-2 border-slate-900 rounded-md flex items-center gap-2 text-xs font-bold text-emerald-900">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
