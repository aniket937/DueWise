"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AIStatus } from "@/lib/types";
import {
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Trash2,
  FileText,
  Key,
} from "lucide-react";

export default function SettingsPage() {
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [backendHealth, setBackendHealth] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const [h, s] = await Promise.all([
        api.getHealth(),
        api.getAIStatus(),
      ]);
      setBackendHealth(h.status);
      setAIStatus(s);
    } catch {
      setBackendHealth("offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleResetSampleData = async () => {
    if (!confirm("Are you sure you want to clear all sample data? Your custom user documents and tasks will not be deleted.")) {
      return;
    }
    setResetting(true);
    try {
      const res = await api.resetDemoData();
      setResetMsg(res.message);
      setTimeout(() => setResetMsg(null), 4000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to reset sample data");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-2 border-b-2 border-slate-900">
        <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
          Settings & AI Runtime
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
          Verify runtime connectivity, OpenRouter open-weight configuration, and sample data state.
        </p>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backend Health Card */}
        <div className="nb-card p-5 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              FastAPI Backend
            </span>
            <span
              className={`nb-badge ${
                backendHealth === "healthy"
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-red-100 text-red-900"
              }`}
            >
              {backendHealth === "healthy" ? "Online" : "Disconnected"}
            </span>
          </div>
          <p className="text-sm font-bold text-slate-800">
            Endpoint: <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded">http://localhost:8000</code>
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            SQLite database with asynchronous SQLAlchemy and local file storage.
          </p>
        </div>

        {/* AI Provider Status Card */}
        <div className="nb-card p-5 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Runtime AI Provider
            </span>
            {aiStatus && (
              <span
                className={`nb-badge ${
                  aiStatus.mode === "live"
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {aiStatus.mode === "live" ? "Live Inference" : "Demo Mode"}
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-slate-800">
            Configured Model:{" "}
            <code className="text-xs font-mono bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded">
              {aiStatus?.model || "meta-llama/llama-3.3-70b-instruct"}
            </code>
          </p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Provider: OpenRouter API (<code className="text-[11px] font-mono">https://openrouter.ai/api/v1</code>)
          </p>
        </div>
      </div>

      {/* AI Mode Detailed Explanation */}
      <div className="nb-card p-6 bg-amber-50/70 border-2 border-slate-900 space-y-3">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-amber-700" />
          <h3 className="font-black text-slate-900 text-base">How to Configure OpenRouter Live AI</h3>
        </div>

        <div className="text-xs text-slate-700 space-y-2 leading-relaxed font-medium">
          <p>
            DueWise uses a <strong>backend-only</strong> architecture for AI security. Your API key is never exposed to the browser or frontend network requests.
          </p>
          <ol className="list-decimal list-inside space-y-1 bg-white p-3.5 rounded border border-slate-300 font-mono text-[11px]">
            <li>Open the backend environment file: <code>backend/.env</code></li>
            <li>Set your OpenRouter key: <code>OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx</code></li>
            <li>(Optional) Configure model: <code>OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct</code></li>
            <li>Restart the backend service. DueWise will automatically switch from Demo Mode to Live AI inference.</li>
          </ol>
          <div className="flex items-center gap-2 text-indigo-900 font-semibold pt-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Zero-Leak Guarantee: The key is kept strictly in Python backend memory and excluded from Git commits.</span>
          </div>
        </div>
      </div>

      {/* Tesseract OCR Status */}
      <div className="nb-card p-5 bg-white space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-sm">Tesseract Optical Character Recognition (OCR)</h3>
          <span
            className={`nb-badge ${
              aiStatus?.tesseract_available
                ? "bg-emerald-100 text-emerald-900"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {aiStatus?.tesseract_available ? "Installed & Active" : "Not Found (Graceful Fallback)"}
          </span>
        </div>
        <p className="text-xs text-slate-600 font-medium">
          PyMuPDF extracts digital text from standard PDFs, DOCX, and TXT files natively. If Tesseract is not installed in the Windows PATH, DueWise gracefully processes documents without crashing.
        </p>
      </div>

      {/* Safe Sample Data Reset */}
      <div className="nb-card p-5 bg-white space-y-3 border-red-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-sm">Demo Sample Data Management</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Clear preloaded CS301 syllabus and sample tasks without deleting any of your personal uploads.
            </p>
          </div>
          <button
            onClick={handleResetSampleData}
            disabled={resetting}
            className="nb-btn px-4 py-2 bg-red-100 hover:bg-red-200 text-red-900 text-xs font-bold shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1 text-red-700" />
            <span>{resetting ? "Resetting..." : "Clear Sample Records"}</span>
          </button>
        </div>

        {resetMsg && (
          <div className="p-3 bg-emerald-100 border border-emerald-300 rounded text-xs font-bold text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{resetMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
}
