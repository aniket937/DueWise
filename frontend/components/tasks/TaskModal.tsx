"use client";

import React, { useState, useEffect } from "react";
import { TaskItem } from "@/lib/types";
import { api } from "@/lib/api";
import { X, Check, Plus, Trash2 } from "lucide-react";

interface Props {
  task?: TaskItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function TaskModal({ task, onClose, onSaved }: Props) {
  const isEditing = Boolean(task);

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [subject, setSubject] = useState(task?.subject || "");
  const [dueDate, setDueDate] = useState(
    task?.due_date ? task.due_date.substring(0, 10) : ""
  );
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    task?.priority || "medium"
  );
  const [effort, setEffort] = useState(task?.estimated_effort_minutes || 45);
  const [subtasks, setSubtasks] = useState<{ title: string; estimated_minutes: number }[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    setSubtasks([...subtasks, { title: subtaskInput.trim(), estimated_minutes: 15 }]);
    setSubtaskInput("");
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      if (isEditing && task) {
        await api.updateTask(task.id, {
          title: title.trim(),
          description: description.trim() || null,
          subject: subject.trim() || null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          priority,
          estimated_effort_minutes: effort,
        });
      } else {
        await api.createTask({
          title: title.trim(),
          description: description.trim() || null,
          subject: subject.trim() || null,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          priority,
          estimated_effort_minutes: effort,
          subtasks: subtasks.length > 0 ? subtasks : undefined,
        });
      }
      onSaved();
      onClose();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="nb-card bg-white w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b-2 border-slate-900 bg-amber-50 flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-base">
            {isEditing ? "Edit Academic Task" : "Create New Task"}
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 border border-slate-900">
            <X className="w-4 h-4 text-slate-800" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete Operating Systems Homework 3"
              className="nb-input text-xs w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key requirements, rubric notes, questions to solve..."
              className="nb-input text-xs w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Subject / Course
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. CS301"
                className="nb-input text-xs w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="nb-input text-xs w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="nb-input text-xs w-full bg-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Estimated Minutes
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={effort}
                onChange={(e) => setEffort(parseInt(e.target.value) || 30)}
                className="nb-input text-xs w-full"
              />
            </div>
          </div>

          {/* Subtasks on create */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1">
                Subtasks / Action Steps
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder="e.g. Outline draft, review citations..."
                  className="nb-input text-xs flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="nb-btn px-3 py-1.5 bg-slate-100 text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </button>
              </div>

              {subtasks.length > 0 && (
                <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-200">
                  {subtasks.map((st, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded border border-slate-100">
                      <span className="font-medium text-slate-800">{st.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(i)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="nb-btn px-4 py-2 bg-white text-slate-900 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="nb-btn px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold"
            >
              <Check className="w-4 h-4 mr-1.5" />
              <span>{saving ? "Saving..." : isEditing ? "Save Changes" : "Create Task"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
