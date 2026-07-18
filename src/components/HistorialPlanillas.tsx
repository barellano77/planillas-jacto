import { useEffect, useState } from "react";
import { apiFetch, apiUrl } from "../lib/auth";
import type { ChecklistAnswer, PlanillaState } from "../types";
import QrCodeModal from "./QrCodeModal";

type PlanillaSummary = {
  id: string;
  modelo: string;
  cliente: string;
  chasis: string;
  fecha: string;
  realizadoPor: string;
  createdAt: string;
  checklist?: ChecklistAnswer[] | null;
};

type Props = {
  onOpen: (state: PlanillaState) => void;
  onClose: () => void;
};

export default function HistorialPlanillas({ onOpen, onClose }: Props) {
  const [items, setItems] = useState<PlanillaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [qrTarget, setQrTarget] = useState<PlanillaSummary | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function load(search: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/planillas${search ? `?search=${encodeURIComponent(search)}` : ""}`);
      if (!res.ok) throw new Error("No se pudo obtener el historial de planillas.");
      setItems(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo obtener el historial de planillas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(query), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function handleOpen(id: string) {
    setOpeningId(id);
    try {
      const res = await apiFetch(`/api/planillas/${id}`);
      if (!res.ok) throw new Error("No se pudo abrir la planilla.");
      const state = (await res.json()) as PlanillaState;
      onOpen(state);
    } catch {
      setError("No se pudo abrir la planilla seleccionada.");
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Planillas guardadas
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Se listan las planillas para las que se generó un código QR. Puede buscar por modelo,
          cliente o chasis.
        </p>

        <input
          className="w-full rounded border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-3"
          placeholder="Buscar por modelo, cliente o chasis..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}

        {loading ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No hay planillas guardadas todavía. Se guardan automáticamente al generar un código QR.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded max-h-[50vh] overflow-y-auto">
            {items.map((it) => (
              <li key={it.id} className="px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-slate-800 dark:text-slate-100 font-semibold truncate">
                      {it.modelo || "(sin modelo)"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Cliente: {it.cliente || "-"} · Chasis: {it.chasis || "-"} · Fecha: {it.fecha || "-"}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpen(it.id)}
                      disabled={openingId === it.id}
                      className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60"
                    >
                      {openingId === it.id ? "Abriendo..." : "Abrir"}
                    </button>
                    <a
                      href={apiUrl(`/api/planillas/${it.id}/pdf`)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/60"
                    >
                      PDF
                    </a>
                    <button
                      type="button"
                      onClick={() => setQrTarget(it)}
                      className="text-xs px-2 py-1 rounded bg-orange-100 dark:bg-orange-800/40 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-800/60"
                    >
                      QR
                    </button>
                  </div>
                </div>
                {it.checklist && it.checklist.length > 0 && (
                  <details className="mt-1.5">
                    <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer select-none">
                      Ver recordatorio ({it.checklist.length} preguntas)
                    </summary>
                    <ul className="mt-1.5 space-y-1 border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                      {it.checklist.map((c, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex justify-between gap-2">
                          <span>{c.question}</span>
                          <span
                            className={`shrink-0 font-semibold ${
                              c.answer === "si"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {c.answer === "si" ? "Sí" : "No"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Cerrar
          </button>
        </div>
      </div>

      {qrTarget && (
        <QrCodeModal
          existingId={qrTarget.id}
          state={{
            header: {
              modeloId: "",
              modelo: qrTarget.modelo,
              cliente: qrTarget.cliente,
              chasisN: qrTarget.chasis,
              serieN: "",
              bombaN: "",
              motorN: "",
              fecha: qrTarget.fecha,
              realizadoPor: qrTarget.realizadoPor,
            },
            items: [],
            attachments: null,
            photos: [],
            checklist: null,
          }}
          onClose={() => setQrTarget(null)}
        />
      )}
    </div>
  );
}
