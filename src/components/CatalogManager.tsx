import { useState } from "react";
import * as XLSX from "xlsx";
import { useCustomCatalog } from "../hooks/useCustomCatalog";
import { BOQUILLAS_CATALOG, TAPAS_CATALOG, FILTROS_CATALOG, type CatalogItemType } from "../data/catalogs";

type Props = {
  onClose: () => void;
};

const TYPE_LABELS: Record<CatalogItemType, string> = {
  boquilla: "Boquilla",
  tapa: "Tapa",
  filtro: "Filtro",
};

const inputCls =
  "w-full rounded border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100";

export default function CatalogManager({ onClose }: Props) {
  const { items, loading, addItem, updateItem, removeItem } = useCustomCatalog();
  const [type, setType] = useState<CatalogItemType>("boquilla");
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editType, setEditType] = useState<CatalogItemType>("boquilla");
  const [editCode, setEditCode] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editQty, setEditQty] = useState(0);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  async function handleAdd() {
    const trimmedCode = code.trim();
    if (!trimmedCode || !desc.trim()) {
      setError("Complete el código y la descripción.");
      return;
    }
    const allExistingCodes = [
      ...BOQUILLAS_CATALOG,
      ...TAPAS_CATALOG,
      ...FILTROS_CATALOG,
      ...items,
    ].map((c) => c.code.trim().toLowerCase());
    if (allExistingCodes.includes(trimmedCode.toLowerCase())) {
      setError(`Ya existe una pieza con el código "${trimmedCode}".`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addItem({ type, code: trimmedCode, desc: desc.trim(), qty });
      setCode("");
      setDesc("");
      setQty(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la pieza.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: number) {
    try {
      await removeItem(id);
    } catch {
      setError("No se pudo eliminar la pieza.");
    }
  }

  function startEdit(it: { id: number; type: CatalogItemType; code: string; desc: string; qty: number }) {
    setEditingId(it.id);
    setEditType(it.type);
    setEditCode(it.code);
    setEditDesc(it.desc);
    setEditQty(it.qty);
    setEditError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleSaveEdit(id: number) {
    const trimmedCode = editCode.trim();
    if (!trimmedCode || !editDesc.trim()) {
      setEditError("Complete el código y la descripción.");
      return;
    }
    const allExistingCodes = [
      ...BOQUILLAS_CATALOG,
      ...TAPAS_CATALOG,
      ...FILTROS_CATALOG,
      ...items.filter((c) => c.id !== id),
    ].map((c) => c.code.trim().toLowerCase());
    if (allExistingCodes.includes(trimmedCode.toLowerCase())) {
      setEditError(`Ya existe una pieza con el código "${trimmedCode}".`);
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      await updateItem(id, { type: editType, code: trimmedCode, desc: editDesc.trim(), qty: editQty });
      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "No se pudo actualizar la pieza.");
    } finally {
      setEditSaving(false);
    }
  }

  function handleExportExcel() {
    const rows = [
      ...BOQUILLAS_CATALOG.map((c) => ({ Tipo: "Boquilla", Código: c.code, Descripción: c.desc, Cantidad: "", Origen: "Sistema" })),
      ...TAPAS_CATALOG.map((c) => ({ Tipo: "Tapa", Código: c.code, Descripción: c.desc, Cantidad: "", Origen: "Sistema" })),
      ...FILTROS_CATALOG.map((c) => ({ Tipo: "Filtro", Código: c.code, Descripción: c.desc, Cantidad: "", Origen: "Sistema" })),
      ...items.map((c) => ({
        Tipo: TYPE_LABELS[c.type],
        Código: c.code,
        Descripción: c.desc,
        Cantidad: c.qty,
        Origen: "Personalizado",
      })),
    ];
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 45 }, { wch: 10 }, { wch: 14 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Catálogo");
    XLSX.writeFile(workbook, "catalogo-jacto.xlsx");
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Agregar piezas al catálogo
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Cargue boquillas, tapas o filtros que no estén en el sistema. Quedan guardados y
          disponibles en los desplegables de todas las planillas.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Tipo
            </label>
            <select
              className={inputCls}
              value={type}
              onChange={(e) => setType(e.target.value as CatalogItemType)}
            >
              <option value="boquilla">Boquilla</option>
              <option value="tapa">Tapa</option>
              <option value="filtro">Filtro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              min={0}
              max={500}
              className={inputCls}
              value={qty}
              onChange={(e) => {
                let v = parseInt(e.target.value, 10);
                if (Number.isNaN(v)) v = 0;
                setQty(Math.max(0, Math.min(500, v)));
              }}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Descripción
            </label>
            <input
              className={inputCls}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ej: BOQUILLA JAC-05 ROJA"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Código
            </label>
            <input
              className={inputCls}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ej: 1234567"
            />
          </div>
        </div>

        {error && <p className="text-xs text-rose-600 mb-2">{error}</p>}

        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="w-full px-4 py-2 rounded bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 disabled:opacity-60 mb-4"
        >
          {saving ? "Guardando..." : "+ Agregar pieza"}
        </button>

        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Piezas agregadas
          </h3>
          <button
            type="button"
            onClick={handleExportExcel}
            className="text-xs px-3 py-1.5 rounded bg-orange-50 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/60"
          >
            Exportar a Excel
          </button>
        </div>
        {loading ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Todavía no se agregaron piezas personalizadas.
          </p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded max-h-64 overflow-y-auto">
            {items.map((it) =>
              editingId === it.id ? (
                <li key={it.id} className="px-3 py-2 text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className={inputCls}
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as CatalogItemType)}
                    >
                      <option value="boquilla">Boquilla</option>
                      <option value="tapa">Tapa</option>
                      <option value="filtro">Filtro</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      className={inputCls}
                      value={editQty}
                      onChange={(e) => {
                        let v = parseInt(e.target.value, 10);
                        if (Number.isNaN(v)) v = 0;
                        setEditQty(Math.max(0, Math.min(500, v)));
                      }}
                    />
                    <input
                      className={`${inputCls} col-span-2`}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Descripción"
                    />
                    <input
                      className={`${inputCls} col-span-2`}
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      placeholder="Código"
                    />
                  </div>
                  {editError && <p className="text-xs text-rose-600">{editError}</p>}
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-xs px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(it.id)}
                      disabled={editSaving}
                      className="text-xs px-3 py-1.5 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60"
                    >
                      {editSaving ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </li>
              ) : (
                <li key={it.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-400 mr-2">
                      {TYPE_LABELS[it.type]}
                    </span>
                    <span className="text-slate-800 dark:text-slate-100">{it.desc}</span>
                    <span className="text-slate-400 dark:text-slate-500 ml-2">({it.code})</span>
                    <span className="text-slate-400 dark:text-slate-500 ml-2">Cant: {it.qty}</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(it)}
                      className="text-slate-400 hover:text-orange-600 text-sm"
                      title="Editar"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(it.id)}
                      className="text-slate-400 hover:text-rose-600 text-sm"
                      title="Eliminar"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              )
            )}
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
    </div>
  );
}
