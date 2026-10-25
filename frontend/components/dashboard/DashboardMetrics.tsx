import React from "react";
import { DashboardStats } from "@/lib/types";
import { formatDuration } from "@/lib/formatters";
import { CheckCircle2, Clock, AlertCircle, FileText, Calendar, Award } from "lucide-react";

interface Props {
  stats: DashboardStats;
}

export function DashboardMetrics({ stats }: Props) {
  const metricCards = [
    {
      label: "Active Tasks",
      value: stats.active_tasks,
      icon: Clock,
      color: "bg-blue-100",
      accent: "text-blue-700",
    },
    {
      label: "Due Soon (≤3 Days)",
      value: stats.due_soon_tasks,
      icon: AlertCircle,
      color: "bg-amber-100",
      accent: "text-amber-800",
    },
    {
      label: "Overdue",
      value: stats.overdue_tasks,
      icon: AlertCircle,
      color: stats.overdue_tasks > 0 ? "bg-red-100" : "bg-slate-100",
      accent: stats.overdue_tasks > 0 ? "text-red-700" : "text-slate-600",
    },
    {
      label: "Study Planned",
      value: formatDuration(stats.total_study_minutes_planned),
      icon: Calendar,
      color: "bg-purple-100",
      accent: "text-purple-700",
    },
    {
      label: "Completion Rate",
      value: `${stats.completion_rate_percentage}%`,
      icon: Award,
      color: "bg-emerald-100",
      accent: "text-emerald-700",
    },
    {
      label: "Documents Analyzed",
      value: stats.total_documents,
      icon: FileText,
      color: "bg-slate-100",
      accent: "text-slate-800",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {metricCards.map((m, idx) => {
        const Icon = m.icon;
        return (
          <div key={idx} className={`nb-card p-4 ${m.color} flex flex-col justify-between`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">{m.label}</span>
              <Icon className={`w-4 h-4 ${m.accent}`} />
            </div>
            <div className={`text-2xl font-black ${m.accent}`}>
              {m.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
