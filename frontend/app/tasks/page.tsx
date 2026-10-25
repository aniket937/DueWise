"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { TaskItem } from "@/lib/types";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskModal } from "@/components/tasks/TaskModal";
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Clock,
  CheckCircle2,
  ListTodo,
} from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("due_date");
  const [sortOrder, setSortOrder] = useState("asc");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getTasks({
        status: statusFilter === "all" ? undefined : statusFilter,
        priority: priorityFilter === "all" ? undefined : priorityFilter,
        subject: subjectFilter === "all" ? undefined : subjectFilter,
        search: search.trim() || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      setTasks(data);
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [statusFilter, priorityFilter, subjectFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTasks();
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.deleteTask(taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to delete task");
    }
  };

  // Distinct subjects for filter dropdown
  const subjects = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.subject) set.add(t.subject);
    });
    return Array.from(set);
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-slate-900">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Academic Tasks
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
            Organize assignments, lab submissions, and exams. Persistent and grounded in your course materials.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            setModalOpen(true);
          }}
          className="nb-btn px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="nb-card p-4 bg-white space-y-3">
        {/* Search & Status Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks, descriptions..."
                className="nb-input text-xs pl-9 pr-3 py-1.5 w-full"
              />
            </div>
            <button type="submit" className="nb-btn px-3 py-1.5 text-xs bg-slate-100 font-bold">
              Search
            </button>
          </form>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "in_progress", label: "In Progress" },
              { id: "completed", label: "Completed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 text-xs font-bold rounded-md border-2 transition-all shrink-0 ${
                  statusFilter === tab.id
                    ? "bg-amber-300 border-slate-900 shadow-[1px_1px_0px_#0f172a] text-slate-950"
                    : "border-transparent text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters: Priority, Subject, Sort */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="nb-input text-xs py-1 px-2 bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {subjects.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Subject:</span>
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="nb-input text-xs py-1 px-2 bg-white"
              >
                <option value="all">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="nb-input text-xs py-1 px-2 bg-white"
            >
              <option value="due_date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="effort">Effort</option>
              <option value="created_at">Date Created</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="nb-btn px-2 py-1 text-xs bg-slate-100 font-bold"
              title="Toggle sort direction"
            >
              {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
            </button>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div>
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-bold">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="nb-card p-12 text-center bg-white">
            <ListTodo className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-black text-slate-800 text-base">No tasks match your filter</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create a custom task with the &quot;New Task&quot; button or upload an academic syllabus in the Documents tab.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={fetchTasks}
                onEdit={(t) => {
                  setEditingTask(t);
                  setModalOpen(true);
                }}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => setModalOpen(false)}
          onSaved={fetchTasks}
        />
      )}
    </div>
  );
}
