"use client";

import React from "react";
import { StudyPlan, StudyPlanItem } from "@/lib/types";
import { formatDuration } from "@/lib/formatters";
import { api } from "@/lib/api";
import { CheckCircle2, Circle, Clock, Trash2, AlertCircle } from "lucide-react";

interface Props {
  plan: StudyPlan;
  onRefresh: () => void;
}

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function PlannerGrid({ plan, onRefresh }: Props) {
  const handleToggleItem = async (item: StudyPlanItem) => {
    try {
      await api.updatePlanItem(item.id, { is_completed: !item.is_completed });
      onRefresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update item");
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await api.deletePlanItem(itemId);
      onRefresh();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete item");
    }
  };

  // Group items by day
  const itemsByDay = React.useMemo(() => {
    const map: Record<string, StudyPlanItem[]> = {};
    DAYS_ORDER.forEach((day) => {
      map[day] = [];
    });
    plan.items.forEach((item) => {
      if (map[item.day_of_week]) {
        map[item.day_of_week].push(item);
      } else {
        map[item.day_of_week] = [item];
      }
    });
    return map;
  }, [plan.items]);

  return (
    <div className="space-y-4">
      {/* Overload Warning Notice */}
      {plan.overload_warning && (
        <div className="p-4 bg-amber-50 border-2 border-amber-800 rounded-md shadow-[2px_2px_0px_#0f172a] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black text-xs uppercase text-amber-900 tracking-wider">
              Study Workload Warning
            </h4>
            <p className="text-xs font-semibold text-amber-800 mt-0.5 leading-relaxed">
              {plan.overload_warning}
            </p>
          </div>
        </div>
      )}

      {/* Week Grid (7 columns on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {DAYS_ORDER.map((day) => {
          const dayItems = itemsByDay[day] || [];
          const dayTotalMins = dayItems.reduce((acc, it) => acc + it.duration_minutes, 0);
          const isCapacityExceeded = dayTotalMins > plan.available_daily_minutes;

          return (
            <div
              key={day}
              className="nb-card p-3 bg-white flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b-2 border-slate-900 mb-2">
                  <span className="font-black text-xs uppercase tracking-wide text-slate-900">
                    {day.substring(0, 3)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-900 ${
                      isCapacityExceeded
                        ? "bg-red-200 text-red-900"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {formatDuration(dayTotalMins)}
                  </span>
                </div>

                {/* Day Items */}
                <div className="space-y-2">
                  {dayItems.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic text-center py-6 font-medium">
                      Rest & recharge 🦥
                    </p>
                  ) : (
                    dayItems.map((item) => (
                      <div
                        key={item.id}
                        className={`p-2 rounded border-2 border-slate-900 text-xs shadow-[1.5px_1.5px_0px_#0f172a] transition-all ${
                          item.is_completed ? "bg-emerald-50 opacity-75" : "bg-amber-50/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <button
                            onClick={() => handleToggleItem(item)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                          >
                            {item.is_completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
                            ) : (
                              <Circle className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <span
                            className={`flex-1 font-bold leading-tight ${
                              item.is_completed ? "line-through text-slate-500" : "text-slate-900"
                            }`}
                          >
                            {item.title}
                          </span>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-slate-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200 text-[10px] text-slate-600 font-semibold">
                          <span className="truncate">{item.subject || "Study"}</span>
                          <span>{item.duration_minutes}m</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
