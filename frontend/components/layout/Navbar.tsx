"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AIStatus } from "@/lib/types";
import { Sparkles, Cpu, RefreshCw, CheckCircle2 } from "lucide-react";

export function Navbar() {
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  const fetchStatus = () => {
    api.getAIStatus()
      .then(setAIStatus)
      .catch(() => null);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await api.loadDemoData();
      setDemoMessage(res.message);
      setTimeout(() => {
        setDemoMessage(null);
        window.location.reload();
      }, 1000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to load sample data");
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#fbfbf9] border-b-2 border-slate-900 px-4 lg:px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-amber-400 border-2 border-slate-900 flex items-center justify-center font-black text-xl shadow-[2px_2px_0px_#0f172a] group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform">
            🦥
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">DueWise</span>
            <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-slate-200 border border-slate-900 rounded-full">
              Slow & Steady
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {/* AI Mode Indicator */}
        {aiStatus && (
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border-2 border-slate-900 text-xs font-bold ${
              aiStatus.mode === "live"
                ? "bg-emerald-100 text-emerald-900 shadow-[2px_2px_0px_#0f172a]"
                : "bg-amber-100 text-amber-900 shadow-[2px_2px_0px_#0f172a]"
            }`}
            title={aiStatus.message}
          >
            {aiStatus.mode === "live" ? (
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            ) : (
              <Cpu className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>{aiStatus.mode === "live" ? `Live AI: ${aiStatus.model.split("/").pop()}` : "Demo Mode (Local)"}</span>
          </div>
        )}

        {/* Demo Sample Data Button */}
        <button
          onClick={handleLoadDemo}
          disabled={loadingDemo}
          className="nb-btn px-3 py-1.5 text-xs bg-white hover:bg-slate-50 text-slate-900"
          title="Load realistic sample academic syllabus, tasks, and study schedule"
        >
          {loadingDemo ? (
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
          )}
          <span>{demoMessage ? "Loaded!" : "Load Sample Data"}</span>
        </button>

        <Link
          href="/settings"
          className="nb-btn px-3 py-1.5 text-xs bg-amber-400 hover:bg-amber-300 text-slate-900"
        >
          Configure AI
        </Link>
      </div>
    </header>
  );
}
