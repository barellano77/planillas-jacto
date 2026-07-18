import { useState } from "react";
import type { ChecklistAnswer } from "../types";

type Props = {
  questions: string[];
  onComplete: (answers: ChecklistAnswer[]) => void;
  onClose: () => void;
};

export default function ChecklistModal({ questions, onComplete, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<ChecklistAnswer[]>([]);

  const total = questions.length;
  const current = questions[index];
  const isLast = index === total - 1;

  function answer(value: "si" | "no") {
    const next = [...answers, { question: current, answer: value }];
    if (isLast) {
      onComplete(next);
      return;
    }
    setAnswers(next);
    setIndex((i) => i + 1);
  }

  function goBack() {
    if (index === 0) return;
    setAnswers((prev) => prev.slice(0, -1));
    setIndex((i) => i - 1);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-sm w-full p-6 text-center">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Recordatorio ({index + 1} de {total})
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
            title="Cerrar sin guardar"
          >
            ✕
          </button>
        </div>

        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 min-h-[3rem] flex items-center justify-center">
          {current}
        </p>

        <div className="flex gap-3 justify-center mb-3">
          <button
            type="button"
            onClick={() => answer("si")}
            className="flex-1 px-4 py-3 rounded bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
          >
            Sí
          </button>
          <button
            type="button"
            onClick={() => answer("no")}
            className="flex-1 px-4 py-3 rounded bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700"
          >
            No
          </button>
        </div>

        {index > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ← Volver a la pregunta anterior
          </button>
        )}
      </div>
    </div>
  );
}
