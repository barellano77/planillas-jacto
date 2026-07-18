import { useMemo, useState } from "react";
import modelsData from "../data/models.json";
import type { ModelTemplate, PlanillaState } from "../types";
import jactoLogo from "../assets/jacto-logo.png";
import CatalogManager from "./CatalogManager";
import HistorialPlanillas from "./HistorialPlanillas";
import UserManager from "./UserManager";
import { isAdmin } from "../lib/auth";

const models = modelsData as ModelTemplate[];

type Props = {
  onSelect: (model: ModelTemplate) => void;
  onOpenSaved: (state: PlanillaState) => void;
};

export default function ModelSelector({ onSelect, onOpenSaved }: Props) {
  const [query, setQuery] = useState("");
  const [showCatalogManager, setShowCatalogManager] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [showUserManager, setShowUserManager] = useState(false);
  const admin = isAdmin();

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return models;
    return models.filter(
      (m) => m.modelo.toUpperCase().includes(q) || m.id.toUpperCase().includes(q)
    );
  }, [query]);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex justify-center mb-4">
          <img src={jactoLogo} alt="Jacto Argentina" className="h-14 w-auto rounded" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-1">
          PLANILLA DE ARMADO DE EQUIPOS
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
          Seleccione el modelo de equipo para comenzar
        </p>

        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          Buscar modelo
        </label>
        <input
          className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm mb-3"
          placeholder="Ej: UNIPORT, CONDOR, ARBUS..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          Modelo de equipo ({filtered.length})
        </label>
        <select
          className="w-full rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm mb-4"
          size={10}
          onChange={(e) => {
            const model = models.find((m) => m.id === e.target.value);
            if (model) onSelect(model);
          }}
          value=""
        >
          <option value="" disabled>
            -- Elegir modelo --
          </option>
          {filtered.map((m) => (
            <option key={m.id} value={m.id}>
              {m.modelo} ({m.items.length} ítems)
            </option>
          ))}
        </select>

        {admin && (
          <button
            type="button"
            onClick={() => setShowCatalogManager(true)}
            className="w-full px-4 py-2 rounded bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-sm font-semibold mb-2"
          >
            + Agregar boquillas, tapas o filtros al catálogo
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowHistorial(true)}
          className="w-full px-4 py-2 rounded bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-sm font-semibold mb-2"
        >
          Ver planillas guardadas
        </button>

        {admin && (
          <button
            type="button"
            onClick={() => setShowUserManager(true)}
            className="w-full px-4 py-2 rounded bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-sm font-semibold"
          >
            Gestionar usuarios
          </button>
        )}
      </div>

      {showCatalogManager && <CatalogManager onClose={() => setShowCatalogManager(false)} />}
      {showHistorial && (
        <HistorialPlanillas onOpen={onOpenSaved} onClose={() => setShowHistorial(false)} />
      )}
      {showUserManager && <UserManager onClose={() => setShowUserManager(false)} />}
    </div>
  );
}
