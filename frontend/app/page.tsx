"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { DashboardData } from "@/lib/types";
import { WhatShouldIDoNow } from "@/components/dashboard/WhatShouldIDoNow";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { formatDate } from "@/lib/formatters";
import {
  Upload,
  FileText,
  ArrowRight,
  Sparkles,
  CalendarDays,
  RefreshCw,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-amber-400 border-t-slate-900 animate-spin" />
        <p className="font-extrabold text-sm text-slate-700">Loading your academic cockpit...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="nb-card p-8 bg-red-50 border-red-950 text-center max-w-lg mx-auto mt-12">
        <h2 className="text-xl font-black text-red-900">Failed to connect to backend</h2>
        <p className="text-sm text-slate-700 mt-2 font-medium">{error || "Could not retrieve data"}</p>
        <button
          onClick={loadData}
          className="nb-btn px-4 py-2 mt-4 bg-white text-slate-900 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-slate-900">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Academic Dashboard
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
            Channel your inner sloth: slow and steady wins the academic race.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/documents"
            className="nb-btn px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            <span>Upload Document</span>
          </Link>
          <Link
            href="/tasks"
            className="nb-btn px-4 py-2 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Task</span>
          </Link>
        </div>
      </div>

      {/* Signature Feature: What Should I Do Now */}
      <WhatShouldIDoNow nextAction={data.next_action} onRefresh={loadData} />

      {/* Real Statistics Metrics */}
      <DashboardMetrics stats={data.stats} />

      {/* Grid: Upcoming Deadlines & Recent Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingDeadlines deadlines={data.upcoming_deadlines} />

        {/* Recent Documents */}
        <div className="nb-card p-5 bg-white">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="font-black text-slate-900 text-base">Recent Uploads</h3>
            </div>
            <Link href="/documents" className="text-xs font-bold text-indigo-700 hover:underline flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {data.recent_documents.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 border border-dashed border-slate-300 rounded-md">
              <p className="text-sm font-semibold text-slate-500">No documents uploaded yet.</p>
              <Link href="/documents" className="nb-btn px-3 py-1.5 bg-amber-300 text-slate-900 text-xs mt-3 inline-flex">
                Upload your first syllabus
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.recent_documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded border-2 border-slate-900 bg-white shadow-[2px_2px_0px_#0f172a] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-indigo-50 border border-slate-800 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-indigo-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {doc.original_name}
                        </span>
                        {doc.is_sample && (
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-slate-200 border border-slate-800 rounded">
                            Sample
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {doc.word_count} words • Added {formatDate(doc.created_at)}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/documents`}
                    className="nb-btn px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-900 shrink-0"
                  >
                    Analyze
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
