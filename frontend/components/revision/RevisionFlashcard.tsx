"use client";

import React, { useState } from "react";
import { RevisionItem } from "@/lib/types";
import { api } from "@/lib/api";
import { CheckCircle2, Circle, Eye, EyeOff, Trash2 } from "lucide-react";

interface Props {
  item: RevisionItem;
  onUpdate: () => void;
  onDelete: (id: number) => void;
}

export function RevisionFlashcard({ item, onUpdate, onDelete }: Props) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await api.updateRevisionItem(item.id, { is_completed: !item.is_completed });
      onUpdate();
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div
      className={`nb-card p-5 transition-all flex flex-col justify-between ${
        item.is_completed ? "bg-slate-50 opacity-70 border-slate-400" : "bg-white"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-xs uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-slate-900">
              {item.topic}
            </span>
            {item.subject && (
              <span className="text-[11px] font-bold text-slate-500">
                {item.subject}
              </span>
            )}
          </div>
          <button
            onClick={() => onDelete(item.id)}
            className="text-slate-400 hover:text-red-600 transition-colors"
            title="Delete card"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
          {item.question}
        </h3>

        {/* Answer section */}
        {showAnswer ? (
          <div className="mt-3 p-3 bg-amber-50 rounded border-2 border-slate-900 text-xs font-semibold text-slate-800 leading-relaxed shadow-[1.5px_1.5px_0px_#0f172a]">
            <p className="text-[10px] font-black uppercase text-amber-900 tracking-wider mb-1">
              Answer:
            </p>
            {item.answer}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-400 italic">
            Click &quot;Reveal Answer&quot; to test your recall.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="nb-btn px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold"
        >
          {showAnswer ? (
            <>
              <EyeOff className="w-3.5 h-3.5 mr-1" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 mr-1" />
              <span>Reveal Answer</span>
            </>
          )}
        </button>

        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`nb-btn px-3 py-1 text-xs font-bold ${
            item.is_completed
              ? "bg-slate-200 text-slate-700"
              : "bg-emerald-300 hover:bg-emerald-200 text-slate-950"
          }`}
        >
          {item.is_completed ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-700" />
              <span>Mastered</span>
            </>
          ) : (
            <>
              <Circle className="w-3.5 h-3.5 mr-1" />
              <span>Mark Mastered</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
