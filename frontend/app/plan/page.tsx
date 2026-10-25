"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StudyPlan } from "@/lib/types";
import { PlannerGrid } from "@/components/planner/PlannerGrid";
import { formatDuration } from "@/lib/formatters";
import {
  CalendarDays,
  Sparkles,
  Settings2,
  Clock,
  RefreshCw,
  Sliders,
} from "lucide-react";

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function StudyPlanPage() {
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Planner Configuration
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [dailyMinutes, setDailyMinutes] = useState(120);
  const [sessionMinutes, setSessionMinutes] = useState(45);
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const plan = await api.getCurrentPlan();
      setCurrentPlan(plan);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleGeneratePlan = async () => {
    if (selectedDays.length === 0) {
      alert("Please select at least one study day.");
      return;
    }
    setGenerating(true);
    try {
      const newPlan = await api.generatePlan({
        week_start_date: startDate,
        available_daily_minutes: dailyMinutes,
        session_duration_minutes: sessionMinutes,
        available_days: selectedDays,
      });
      setCurrentPlan(newPlan);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to generate study plan");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-slate-900">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Weekly Study Planner
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
            Balanced, deadline-aware scheduling. Respects daily limits and avoids scheduling past deadlines.
          </p>
        </div>
        <button
          onClick={handleGeneratePlan}
          disabled={generating}
          className="nb-btn px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shrink-0"
        >
          {generating ? (
            <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-1.5" />
          )}
          <span>{generating ? "Calculating Schedule..." : "Generate Weekly Plan"}</span>
        </button>
      </div>

      {/* Configuration Box */}
      <div className="nb-card p-5 bg-white space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-slate-100">
          <Sliders className="w-4 h-4 text-amber-600" />
          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wide">
            Planner Preferences & Capacity
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
          <div>
            <label className="block text-slate-700 font-black mb-1">Week Starting Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="nb-input text-xs w-full"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-black mb-1">Daily Study Limit</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={30}
                max={480}
                step={15}
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(parseInt(e.target.value) || 120)}
                className="nb-input text-xs w-full"
              />
              <span className="text-slate-500 font-bold shrink-0">({formatDuration(dailyMinutes)})</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-black mb-1">Session Chunk Duration</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={15}
                max={120}
                step={15}
                value={sessionMinutes}
                onChange={(e) => setSessionMinutes(parseInt(e.target.value) || 45)}
                className="nb-input text-xs w-full"
              />
              <span className="text-slate-500 font-bold shrink-0">({formatDuration(sessionMinutes)})</span>
            </div>
          </div>
        </div>

        {/* Days selector */}
        <div>
          <label className="block text-slate-700 text-xs font-black mb-1.5">Available Study Days</label>
          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1 text-xs font-bold rounded border-2 transition-all cursor-pointer ${
                    active
                      ? "bg-amber-300 border-slate-900 shadow-[1.5px_1.5px_0px_#0f172a] text-slate-950"
                      : "bg-slate-100 border-slate-300 text-slate-500 hover:border-slate-800"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plan Grid */}
      <div>
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading weekly plan...</div>
        ) : !currentPlan || currentPlan.items.length === 0 ? (
          <div className="nb-card p-12 text-center bg-white">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-black text-slate-800 text-base">No active weekly study plan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click &quot;Generate Weekly Plan&quot; above to automatically schedule your active tasks without violating deadlines or daily time limits.
            </p>
          </div>
        ) : (
          <PlannerGrid plan={currentPlan} onRefresh={fetchPlan} />
        )}
      </div>
    </div>
  );
}
