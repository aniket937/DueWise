"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { RevisionItem, DocumentItem } from "@/lib/types";
import { RevisionFlashcard } from "@/components/revision/RevisionFlashcard";
import { Brain, Sparkles, Filter, RefreshCw, BookOpen } from "lucide-react";

export default function RevisionPage() {
  const [items, setItems] = useState<RevisionItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedDocId, setSelectedDocId] = useState<number | undefined>(undefined);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await api.getRevisionItems({
        subject: selectedSubject === "all" ? undefined : selectedSubject,
        document_id: selectedDocId,
      });
      setItems(data);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (e: unknown) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [selectedSubject, selectedDocId]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.generateRevision({
        document_id: selectedDocId,
      });
      fetchItems();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to generate revision items");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deleteRevisionItem(id);
      setItems(items.filter((it) => it.id !== id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete item");
    }
  };

  const subjects = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      if (it.subject) set.add(it.subject);
    });
    return Array.from(set);
  }, [items]);

  const completedCount = items.filter((it) => it.is_completed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-slate-900">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Revision Checklist & Flashcards
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
            Test your knowledge with bite-sized, grounded Q&A flashcards extracted from your syllabus.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="nb-btn px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shrink-0"
        >
          {generating ? (
            <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-1.5" />
          )}
          <span>{generating ? "Extracting Cards..." : "Generate Revision Cards"}</span>
        </button>
      </div>

      {/* Progress & Filters Bar */}
      <div className="nb-card p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold uppercase text-slate-500">Mastery Progress:</span>
          <span className="nb-badge bg-emerald-100 text-emerald-900">
            {completedCount} / {items.length} Mastered
          </span>
          {items.length > 0 && (
            <span className="text-xs font-bold text-slate-600">
              ({Math.round((completedCount / items.length) * 100)}%)
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          {documents.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Document:</span>
              <select
                value={selectedDocId || ""}
                onChange={(e) => setSelectedDocId(e.target.value ? parseInt(e.target.value) : undefined)}
                className="nb-input text-xs py-1 px-2 bg-white"
              >
                <option value="">All Documents</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.original_name.substring(0, 25)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {subjects.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Subject:</span>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="nb-input text-xs py-1 px-2 bg-white"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div>
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading revision cards...</div>
        ) : items.length === 0 ? (
          <div className="nb-card p-12 text-center bg-white">
            <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-black text-slate-800 text-base">No revision flashcards found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click &quot;Generate Revision Cards&quot; to synthesize Q&A flashcards from your uploaded material.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((it) => (
              <RevisionFlashcard
                key={it.id}
                item={it}
                onUpdate={fetchItems}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
