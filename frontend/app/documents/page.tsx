"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DocumentItem, DocumentAnalysisResult } from "@/lib/types";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentAnalysisModal } from "@/components/documents/DocumentAnalysisModal";
import { formatDate, formatFileSize } from "@/lib/formatters";
import {
  FileText,
  Sparkles,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  X,
  FileCheck,
} from "lucide-react";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingDocId, setAnalyzingDocId] = useState<number | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleAnalyze = async (docId: number) => {
    setAnalyzingDocId(docId);
    try {
      const res = await api.analyzeDocument(docId);
      setActiveAnalysis(res);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to analyze document");
    } finally {
      setAnalyzingDocId(null);
    }
  };

  const handleDelete = async (docId: number) => {
    try {
      await api.deleteDocument(docId);
      setDocuments(documents.filter((d) => d.id !== docId));
      setDeleteConfirmId(null);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete document");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-slate-900">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Academic Documents
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
            Upload syllabuses, exam schedules, and homework notices for local extraction & open-weight AI analysis.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <DocumentUploader onUploaded={() => fetchDocuments()} />

      {/* Document List */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900">
          Saved Documents ({documents.length})
        </h2>

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-bold">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="nb-card p-8 text-center bg-white">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No documents added yet</p>
            <p className="text-xs text-slate-500 mt-1">Upload a PDF, DOCX, or TXT file above, or click &quot;Load Sample Data&quot; in the navigation bar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="nb-card p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 border-2 border-slate-900 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-indigo-800" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900 truncate">
                        {doc.original_name}
                      </span>
                      {doc.is_sample && (
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-slate-200 border border-slate-900 rounded">
                          Sample
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 bg-slate-100 border border-slate-400 rounded text-slate-700">
                        {doc.mime_type.split("/").pop()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {formatFileSize(doc.file_size)} • {doc.word_count} words • Added {formatDate(doc.created_at)}
                    </p>

                    {doc.ai_summary && (
                      <p className="text-xs text-indigo-900 font-medium mt-2 bg-indigo-50/70 p-2 rounded border border-indigo-100">
                        <span className="font-bold">Summary:</span> {doc.ai_summary}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => setPreviewDoc(doc)}
                    className="nb-btn px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold"
                    title="View extracted text preview"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    <span>Preview</span>
                  </button>

                  <button
                    onClick={() => handleAnalyze(doc.id)}
                    disabled={analyzingDocId === doc.id}
                    className="nb-btn px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold"
                  >
                    {analyzingDocId === doc.id ? (
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    <span>{analyzingDocId === doc.id ? "Analyzing..." : "Analyze"}</span>
                  </button>

                  {deleteConfirmId === doc.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="nb-btn px-2.5 py-1.5 bg-red-500 text-white text-xs font-bold"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="nb-btn px-2 py-1.5 bg-white text-slate-900 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(doc.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-700 border border-transparent hover:border-slate-900 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analysis Review Modal */}
      {activeAnalysis && (
        <DocumentAnalysisModal
          result={activeAnalysis}
          onClose={() => setActiveAnalysis(null)}
          onTasksConfirmed={() => {
            fetchDocuments();
          }}
        />
      )}

      {/* Text Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="nb-card bg-white w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b-2 border-slate-900 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-sm">Extracted Text: {previewDoc.original_name}</h3>
                <p className="text-xs text-slate-500 font-semibold">{previewDoc.word_count} words extracted locally</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded border border-slate-900 hover:bg-slate-200"
              >
                <X className="w-4 h-4 text-slate-800" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed flex-1">
              {previewDoc.extracted_text || previewDoc.text_preview}
            </div>
            <div className="p-3 border-t-2 border-slate-900 bg-slate-50 flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="nb-btn px-4 py-1.5 bg-white text-slate-900 text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
