"use client";

import React, { useState } from "react";
import { TaskItem } from "@/lib/types";
import { formatDate, formatDuration } from "@/lib/formatters";
import { api } from "@/lib/api";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit2,
} from "lucide-react";

interface Props {
  task: TaskItem;
  onUpdate: () => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (taskId: number) => void;
}

export function TaskCard({ task, onUpdate, onEdit, onDelete }: Props) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [toggling, setToggling] = useState(false);

  const isCompleted = task.status === "completed";

  const handleToggleComplete = async () => {
    setToggling(true);
    try {
      await api.updateTask(task.id, {
        status: isCompleted ? "pending" : "completed",
      });
      onUpdate();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to toggle status");
    } finally {
      setToggling(false);
    }
  };

  const handleToggleSubtask = async (subtaskId: number) => {
    try {
      await api.toggleSubtask(task.id, subtaskId);
      onUpdate();
    } catch (e: unknown) {
      console.error(e);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setAddingSubtask(true);
    try {
      await api.addSubtask(task.id, {
        title: newSubtaskTitle.trim(),
        estimated_minutes: 15,
      });
      setNewSubtaskTitle("");
      onUpdate();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to add subtask");
    } finally {
      setAddingSubtask(false);
    }
  };

  const priorityColor = {
    high: "bg-red-100 text-red-900 border-red-800",
    medium: "bg-amber-100 text-amber-900 border-amber-800",
    low: "bg-slate-100 text-slate-800 border-slate-700",
  }[task.priority || "medium"];

  return (
    <div
      className={`nb-card p-4 transition-all ${
        isCompleted
          ? "bg-slate-50 opacity-75 border-slate-400 shadow-none"
          : "bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Completion Checkbox */}
        <button
          onClick={handleToggleComplete}
          disabled={toggling}
          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
          ) : (
            <Circle className="w-5 h-5 hover:text-slate-900" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-black text-sm text-slate-900 ${
                isCompleted ? "line-through text-slate-500" : ""
              }`}
            >
              {task.title}
            </span>

            {task.is_sample && (
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 bg-slate-200 border border-slate-900 rounded">
                Sample
              </span>
            )}

            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${priorityColor}`}>
              {task.priority}
            </span>

            {task.is_overdue && !isCompleted && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-500 text-white border border-slate-900 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Overdue
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Meta details */}
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 font-semibold flex-wrap">
            {task.subject && (
              <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {task.subject}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(task.estimated_effort_minutes)}
            </span>
            {task.due_date && (
              <span className={task.is_overdue && !isCompleted ? "text-red-700 font-bold" : ""}>
                Due: {formatDate(task.due_date)}
              </span>
            )}
          </div>

          {/* Subtasks summary / accordion */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowSubtasks(!showSubtasks)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
              >
                <span>
                  Subtasks ({task.subtasks.filter((s) => s.is_completed).length}/{task.subtasks.length})
                </span>
                {showSubtasks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showSubtasks && (
                <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-slate-200">
                  {task.subtasks.map((st) => (
                    <div
                      key={st.id}
                      onClick={() => handleToggleSubtask(st.id)}
                      className="flex items-center gap-2 text-xs cursor-pointer hover:text-slate-900"
                    >
                      <input
                        type="checkbox"
                        checked={st.is_completed}
                        readOnly
                        className="rounded border-slate-900 text-emerald-600 cursor-pointer w-3.5 h-3.5"
                      />
                      <span className={st.is_completed ? "line-through text-slate-400" : "font-medium text-slate-700"}>
                        {st.title} ({st.estimated_minutes}m)
                      </span>
                    </div>
                  ))}

                  {/* Add subtask mini input */}
                  <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2 pt-1">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Add subtask..."
                      className="nb-input text-[11px] py-0.5 px-2 flex-1"
                    />
                    <button
                      type="submit"
                      disabled={addingSubtask || !newSubtaskTitle.trim()}
                      className="nb-btn px-2 py-0.5 text-[11px] bg-slate-100 font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-700 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
