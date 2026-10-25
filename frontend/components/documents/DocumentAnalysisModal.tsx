"use client";

import React, { useState } from "react";
import { DocumentAnalysisResult, ExtractedTaskCandidate } from "@/lib/types";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/formatters";
import {
  X,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Calendar,
  BookOpen,
  ListTodo,
  Check,
} from "lucide-react";

interface Props {
  result: DocumentAnalysisResult;
  onClose: () => void;
  onTasksConfirmed: () => void;
}

export function DocumentAnalysisModal({ result, onClose, onTasksConfirmed }: Props) {
  const [tasks, setTasks] = useState<ExtractedTaskCandidate[]>(result.candidate_tasks);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(result.candidate_tasks.map((_, i) => i))
  );
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleSelect = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === tasks.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(tasks.map((_, i) => i)));
    }
  };

  const handleUpdateTask = (index: number, field: keyof ExtractedTaskCandidate, value: any) => {
    const next = [...tasks];
    next[index] = { ...next[index], [field]: value };
    setTasks(next);
  };

  const handleConfirm = async () => {
    const selectedTasks = tasks.filter((_, i) => selectedIndices.has(i));
    if (selectedTasks.length === 0) {
      alert("Please select at least one task to confirm.");
      return;
    }

    setSaving(true);
    try {
      await api.confirmDocumentTasks(result.document_id, selectedTasks);
      setSavedSuccess(true);
      setTimeout(() => {
        onTasksConfirmed();
        onClose();
      }, 1000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to confirm tasks");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="nb-card bg-white w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b-2 border-slate-900 bg-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-amber-400 border-2 border-slate-900 flex items-center justify-center text-lg">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-slate-900">Document Analysis Review</h3>
                {result.is_demo ? (
                  <span className="nb-badge bg-amber-200 text-amber-900">Demo Analysis</span>
                ) : (
                  <span className="nb-badge bg-emerald-200 text-emerald-900">Open-Weight AI</span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-semibold">
                Carefully review and select extracted tasks before adding them to your schedule.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 border border-slate-900 text-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-900">
          {/* Summary Box */}
          <div className="p-4 rounded-md border-2 border-slate-900 bg-slate-50">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1">
              Executive Summary
            </h4>
            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Grid: Requirements, Deadlines, Uncertainties */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Requirements */}
            <div className="p-3.5 rounded border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0f172a]">
              <div className="flex items-center gap-1.5 font-black text-xs text-indigo-900 uppercase tracking-wide mb-2">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Requirements ({result.academic_requirements.length})</span>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-700 font-medium">
                {result.academic_requirements.slice(0, 4).map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-indigo-600">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Deadlines */}
            <div className="p-3.5 rounded border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0f172a]">
              <div className="flex items-center gap-1.5 font-black text-xs text-amber-900 uppercase tracking-wide mb-2">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Extracted Deadlines ({result.deadlines.length})</span>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-700 font-medium">
                {result.deadlines.length > 0 ? (
                  result.deadlines.slice(0, 4).map((d, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{d}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400 italic">No explicit deadline dates found.</li>
                )}
              </ul>
            </div>

            {/* Uncertainties */}
            <div className="p-3.5 rounded border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0f172a]">
              <div className="flex items-center gap-1.5 font-black text-xs text-red-900 uppercase tracking-wide mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>Uncertainties to Verify</span>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-700 font-medium">
                {result.uncertainties.length > 0 ? (
                  result.uncertainties.slice(0, 4).map((u, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-red-800">
                      <span>⚠️</span>
                      <span>{u}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-emerald-700 font-semibold">No high ambiguities flagged.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Actionable Candidate Tasks Review */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-slate-900" />
                <h4 className="font-black text-slate-900 text-base">
                  Candidate Actionable Tasks ({selectedIndices.size}/{tasks.length} selected)
                </h4>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-bold text-amber-800 hover:underline"
              >
                {selectedIndices.size === tasks.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="space-y-3">
              {tasks.map((task, idx) => {
                const isSelected = selectedIndices.has(idx);
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-md border-2 border-slate-900 transition-all ${
                      isSelected ? "bg-amber-50/60 shadow-[2px_2px_0px_#0f172a]" : "bg-slate-50 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(idx)}
                        className="mt-1 w-4 h-4 rounded border-2 border-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => handleUpdateTask(idx, "title", e.target.value)}
                            placeholder="Task title"
                            className="nb-input text-xs font-bold sm:col-span-2 py-1 px-2"
                          />
                          <select
                            value={task.priority}
                            onChange={(e) => handleUpdateTask(idx, "priority", e.target.value)}
                            className="nb-input text-xs font-bold py-1 px-2 bg-white"
                          >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <input
                            type="text"
                            value={task.subject || ""}
                            onChange={(e) => handleUpdateTask(idx, "subject", e.target.value)}
                            placeholder="Subject / Course"
                            className="nb-input text-xs py-1 px-2"
                          />
                          <input
                            type="date"
                            value={task.due_date || ""}
                            onChange={(e) => handleUpdateTask(idx, "due_date", e.target.value || null)}
                            className="nb-input text-xs py-1 px-2"
                          />
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-500 shrink-0">Minutes:</span>
                            <input
                              type="number"
                              value={task.estimated_effort_minutes}
                              onChange={(e) => handleUpdateTask(idx, "estimated_effort_minutes", parseInt(e.target.value) || 30)}
                              className="nb-input text-xs py-1 px-2 w-full"
                            />
                          </div>
                        </div>

                        {task.evidence_text && (
                          <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 italic font-mono">
                            Evidence: &quot;{task.evidence_text}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t-2 border-slate-900 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            {savedSuccess ? "Tasks saved successfully!" : "Unreviewed suggestions are never saved automatically."}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="nb-btn px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || selectedIndices.size === 0}
              className="nb-btn px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold"
            >
              <Check className="w-4 h-4 mr-1.5" />
              <span>{saving ? "Saving Tasks..." : `Approve & Add (${selectedIndices.size}) Tasks`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
