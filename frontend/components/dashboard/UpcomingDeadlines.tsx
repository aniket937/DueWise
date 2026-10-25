import React from "react";
import Link from "next/link";
import { TaskItem } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/formatters";
import { AlertCircle, Calendar, ArrowRight } from "lucide-react";

interface Props {
  deadlines: TaskItem[];
}

export function UpcomingDeadlines({ deadlines }: Props) {
  if (deadlines.length === 0) {
    return (
      <div className="nb-card p-6 bg-white text-center">
        <p className="text-sm font-semibold text-slate-500">No upcoming deadlines found.</p>
        <p className="text-xs text-slate-400 mt-1">Upload an academic syllabus or create a new task with a deadline.</p>
      </div>
    );
  }

  return (
    <div className="nb-card p-5 bg-white">
      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600" />
          <h3 className="font-black text-slate-900 text-base">Approaching Deadlines</h3>
        </div>
        <Link href="/tasks" className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1">
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {deadlines.map((t) => (
          <div
            key={t.id}
            className={`p-3 rounded border-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-[2px_2px_0px_#0f172a] ${
              t.is_overdue ? "bg-red-50" : "bg-white"
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 truncate">{t.title}</span>
                {t.is_sample && (
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-slate-200 border border-slate-800 rounded">
                    Sample
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                {t.subject && <span className="text-indigo-700 font-semibold">{t.subject}</span>}
                <span>Effort: {formatDuration(t.estimated_effort_minutes)}</span>
              </div>
            </div>

            <div className="shrink-0 text-left sm:text-right">
              <span
                className={`text-xs font-extrabold inline-block px-2 py-0.5 rounded border border-slate-900 ${
                  t.is_overdue
                    ? "bg-red-200 text-red-900"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {t.is_overdue ? "Overdue: " : "Due: "}{formatDate(t.due_date)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
