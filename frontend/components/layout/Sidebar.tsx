"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  CalendarDays,
  Brain,
  Settings as SettingsIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/plan", label: "Study Plan", icon: CalendarDays },
  { href: "/revision", label: "Revision", icon: Brain },
  { href: "/settings", label: "Settings & AI", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 shrink-0 bg-white border-r-2 border-slate-900 md:min-h-[calc(100vh-65px)] p-4 flex flex-col justify-between">
      <nav className="space-y-1.5">
        <div className="text-[11px] font-black tracking-wider uppercase text-slate-500 px-3 py-2">
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-bold text-sm border-2 transition-all ${
                isActive
                  ? "bg-amber-300 border-slate-900 shadow-[2px_2px_0px_#0f172a] text-slate-900 translate-x-1"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-slate-900" : "text-slate-500"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sloth Philosophy Widget */}
      <div className="mt-8 p-3.5 bg-amber-50 border-2 border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🌿</span>
          <span className="font-extrabold text-xs uppercase tracking-wide text-amber-900">
            Sloth Rule #1
          </span>
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-medium">
          Do not multitask. Pick the single highest-impact task, complete it calmly, then rest.
        </p>
      </div>
    </aside>
  );
}
