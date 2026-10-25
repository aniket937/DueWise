"use client";

import React, { useState } from "react";
import Link from "next/link";
import { NextAction } from "@/lib/types";
import { formatDuration, formatDate } from "@/lib/formatters";
import { api } from "@/lib/api";
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, Sparkles, Coffee } from "lucide-react";

interface Props {
  nextAction: NextAction;
  onRefresh: () => void;
}

export function WhatShouldIDoNow({ nextAction, onRefresh }: Props) {
  const [completing, setCompleting] = useState(false);
  const task = nextAction.recommended_task;

  const handleMarkComplete = async () => {
    if (!task) return;
    setCompleting(true);
    try {
      await api.updateTask(task.id, { status: "completed" });
      onRefresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to complete task");
    } finally {
      setCompleting(false);
    }
  };

  if (!task) {
    return (
      <div className="nb-card p-6 bg-emerald-50 border-emerald-950">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-emerald-300 border-2 border-slate-900 flex items-center justify-center text-xl">
            🦥
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">What should I do now?</h2>
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Status: Fully Chilled</p>
          </div>
        </div>
        <p className="text-sm text-slate-700 mt-2 font-medium">
          {nextAction.reason}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/documents" className="nb-btn px-4 py-2 bg-emerald-300 text-slate-900 text-xs">
            Upload New Syllabus or Document
          </Link>
          <Link href="/tasks" className="nb-btn px-4 py-2 bg-white text-slate-900 text-xs">
            Create Custom Task
          </Link>
        </div>
      </div>
    );
  }

  const urgencyBadgeColor = {
    critical: "bg-red-400 text-slate-950",
    high: "bg-amber-400 text-slate-950",
    medium: "bg-blue-300 text-slate-950",
    low: "bg-emerald-300 text-slate-950",
    chill: "bg-purple-300 text-slate-950",
  }[nextAction.urgency_level || "medium"];

  return (
    <div className="nb-card p-6 bg-amber-50 relative overflow-hidden">
      {/* Decorative Stamp */}
      <div className="absolute top-3 right-4 transform rotate-3">
        <span className={`nb-badge ${urgencyBadgeColor} px-3 py-1 uppercase tracking-wider`}>
          {nextAction.urgency_level} Priority
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-amber-400 border-2 border-slate-900 flex items-center justify-center text-xl shadow-[2px_2px_0px_#0f172a]">
          🎯
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">What should I do now?</h2>
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            Signature Recommendation • {nextAction.suggested_focus}
          </p>
        </div>
      </div>

      {/* Recommended Task Card */}
      <div className="mt-4 bg-white border-2 border-slate-900 p-5 rounded-md shadow-[3px_3px_0px_#0f172a]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-2 border-slate-100">
          <div>
            {task.subject && (
              <span className="text-xs font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded mr-2">
                {task.subject}
              </span>
            )}
            <span className="text-xs font-semibold text-slate-500">
              Estimated effort: {formatDuration(task.estimated_effort_minutes)}
            </span>
          </div>
          {task.due_date && (
            <div className={`text-xs font-bold flex items-center gap-1 ${task.is_overdue ? "text-red-600" : "text-amber-700"}`}>
              {task.is_overdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              <span>{task.is_overdue ? "OVERDUE: " : "Due: "}{formatDate(task.due_date)}</span>
            </div>
          )}
        </div>

        <h3 className="text-lg font-black text-slate-900 mt-3">{task.title}</h3>
        {task.description && (
          <p className="text-sm text-slate-600 mt-1 font-medium leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Why this task & AI advice */}
        <div className="mt-4 space-y-2 text-xs bg-slate-50 p-3 rounded border border-slate-200">
          <div className="flex items-start gap-2">
            <span className="font-black text-slate-800 shrink-0">Why now:</span>
            <span className="text-slate-700">{nextAction.reason}</span>
          </div>
          {nextAction.ai_explanation && (
            <div className="flex items-start gap-2 pt-1 border-t border-slate-200 text-indigo-900">
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
              <span className="italic font-medium">{nextAction.ai_explanation}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={handleMarkComplete}
            disabled={completing}
            className="nb-btn px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            <span>{completing ? "Completing..." : "Complete Task"}</span>
          </button>

          <Link
            href="/plan"
            className="nb-btn px-4 py-2 bg-amber-300 hover:bg-amber-200 text-slate-950 text-xs font-bold"
          >
            <Clock className="w-4 h-4 mr-1.5" />
            <span>Schedule in Weekly Plan</span>
          </Link>

          <Link
            href="/tasks"
            className="nb-btn px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold"
          >
            <span>View All Tasks</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
