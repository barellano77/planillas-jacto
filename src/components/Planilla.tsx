import { useRef, useState } from "react";
import type { AttachmentsState, ChecklistAnswer, ItemRow, ItemType, PlanillaPhoto, PlanillaState } from "../types";
import ItemRowView from "./ItemRowView";
import Attachments from "./Attachments";
import QrCodeModal from "./QrCodeModal";
import ChecklistModal from "./ChecklistModal";
import { pdfFileName } from "../utils/pdf";
import { downloadJson, readJsonFile } from "../utils/storage";
import { compressImageFile } from "../utils/image";
import { BOQUILLAS_CATALOG, TAPAS_CATALOG, FILTROS_CATALOG, type CatalogItem } from "../data/catalogs";
import { useCustomCatalog } from "../hooks/useCustomCatalog";
import { getAttachmentGroup } from "../data/attachmentGroups";
import { getChecklistQuestions } from "../data/checklist";
import { apiFetch } from "../lib/auth";

type Props = {
  state: PlanillaState;
  setState: (updater: (prev: PlanillaState) => PlanillaState) => void;
  onLoadPlanilla: (s: PlanillaState) => void;
  onBack: () => void;
};

let rowIdCounter = 0;
function newRowId() {
  rowIdCounter += 1;
  return `new-${Date.now()}-${rowIdCounter}`;
}

export default function Planilla({ state, setState, onLoadPlanilla, onBack }: Props) {
  const { header, items } = state;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [showQr, setShowQr] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistMessage, setChecklistMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const { items: customCatalogItems } = useCustomCatalog();
  const showFullAttachmentSet = !!getAttachmentGroup(header.modeloId);
  const photos = state.photos ?? [];
  const checklistQuestions = getChecklistQuestions(header.modelo);

  const catalogFor = (type: ItemType): (CatalogItem & { qty?: number })[] | null => {
    const custom = customCatalogItems.filter((c) => c.type === type);
    if (type === "boquilla") return [...BOQUILLAS_CATALOG, ...custom];
    if (type === "tapa") return [...TAPAS_CATALOG, ...custom];
    if (type === "filtro") return [...FILTROS_CATALOG, ...custom];
    return null;
  };

  function updateHeader(patch: Partial<PlanillaState["header"]>) {
    setState((prev) => ({ ...prev, header: { ...prev.header, ...patch } }));
  }

  function setAttachments(updater: (prev: AttachmentsState) => AttachmentsState) {
    setState((prev) => (prev.attachments ? { ...prev, attachments: updater(prev.attachments) } : prev));
  }

  function updateItem(id: string, patch: Partial<ItemRow>) {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }

  function deleteItem(id: string) {
    setState((prev) => ({ ...prev, items: prev.items.filter((it) => it.id !== id) }));
  }

  function addItem(type: ItemType) {
    const catalog = catalogFor(type);
    const first = catalog?.[0];
    const row: ItemRow = {
      id: newRowId(),
      desc: first ? first.desc : "NUEVO ARTICULO",
      code: first ? first.code : "",
      qty: first?.qty ?? 0,
      status: "-",
      type,
    };
    setState((prev) => ({ ...prev, items: [...prev.items, row] }));
  }

  async function handleSave() {
    const name = pdfFileName(state).replace(/\.pdf$/, ".json");
    downloadJson(state, name);

    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await apiFetch("/api/planillas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      if (!res.ok) throw new Error();
      setSaveMessage("Planilla guardada correctamente (disponible en Planillas guardadas).");
    } catch {
      setSaveMessage(
        "Se descargó el archivo local, pero no se pudo guardar en el servidor. Verifique la conexión."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleOpenClick() {
    fileInputRef.current?.click();
  }

  function handleAddPhotoClick() {
    photoInputRef.current?.click();
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      const photo: PlanillaPhoto = { id: newRowId(), dataUrl };
      setState((prev) => ({ ...prev, photos: [...(prev.photos ?? []), photo] }));
    } catch {
      alert("No se pudo cargar la imagen. Intente nuevamente.");
    } finally {
      e.target.value = "";
    }
  }

  function removePhoto(id: string) {
    setState((prev) => ({ ...prev, photos: (prev.photos ?? []).filter((p) => p.id !== id) }));
  }

  function handleChecklistComplete(answers: ChecklistAnswer[]) {
    setState((prev) => ({ ...prev, checklist: answers }));
    setShowChecklist(false);
    setChecklistMessage("Recordatorio completado y guardado junto a la planilla.");
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const loaded = await readJsonFile(file);
      onLoadPlanilla(loaded);
    } catch {
      alert("No se pudo leer el archivo. Verifique que sea una planilla guardada válida (.json).");
    } finally {
      e.target.value = "";
    }
  }

  const headerInputCls =
    "w-full rounded border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100";

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 print:shadow-none print:border-none">
        <div className="mb-3 no-print">
          <button
            type="button"
            onClick={onBack}
            className="text-xs px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            ← Volver
          </button>
        </div>
        <div className="text-center mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
            PLANILLA DE ARMADO DE EQUIPOS
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">JACTO ARGENTINA</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              MODELO
            </label>
            <input
              className={`${headerInputCls} bg-slate-100 dark:bg-slate-800`}
              value={header.modelo}
              readOnly
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              CLIENTE
            </label>
            <input
              className={headerInputCls}
              value={header.cliente}
              onChange={(e) => updateHeader({ cliente: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              CHASIS N°
            </label>
            <input
              className={headerInputCls}
              value={header.chasisN}
              onChange={(e) => updateHeader({ chasisN: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              SERIE N°
            </label>
            <input
              className={headerInputCls}
              value={header.serieN}
              onChange={(e) => updateHeader({ serieN: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              BOMBA N°
            </label>
            <input
              className={headerInputCls}
              value={header.bombaN}
              onChange={(e) => updateHeader({ bombaN: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              MOTOR N°
            </label>
            <input
              className={headerInputCls}
              value={header.motorN}
              onChange={(e) => updateHeader({ motorN: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-3 no-print">
          <button
            type="button"
            onClick={() => addItem("boquilla")}
            className="text-xs px-3 py-1.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60"
          >
            + Agregar boquilla
          </button>
          <button
            type="button"
            onClick={() => addItem("tapa")}
            className="text-xs px-3 py-1.5 rounded bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60"
          >
            + Agregar tapa
          </button>
          <button
            type="button"
            onClick={() => addItem("filtro")}
            className="text-xs px-3 py-1.5 rounded bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60"
          >
            + Agregar filtro
          </button>
          <button
            type="button"
            onClick={() => addItem("generic")}
            className="text-xs px-3 py-1.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            + Agregar artículo
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800 dark:bg-black text-white text-xs">
                <th className="px-2 py-2 w-10">N°</th>
                <th className="px-2 py-2">Descripción</th>
                <th className="px-2 py-2">Código</th>
                <th className="px-2 py-2">Cantidad</th>
                <th className="px-2 py-2">Estado</th>
                <th className="px-2 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <ItemRowView
                  key={item.id}
                  item={item}
                  index={i}
                  catalog={catalogFor(item.type)}
                  onChange={updateItem}
                  onDelete={deleteItem}
                />
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Total de ítems: {items.length} — Marcar "-" si la pieza está presente, "X" si falta.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              FECHA DE ARMADO
            </label>
            <input
              type="date"
              className={headerInputCls}
              value={header.fecha}
              onChange={(e) => updateHeader({ fecha: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              REALIZADO POR
            </label>
            <input
              className={headerInputCls}
              value={header.realizadoPor}
              onChange={(e) => updateHeader({ realizadoPor: e.target.value })}
              placeholder="Nombre y apellido"
            />
          </div>
        </div>
      </div>

      {state.attachments && (
        <Attachments
          attachments={state.attachments}
          header={{ modelo: header.modelo, chasisN: header.chasisN }}
          setAttachments={setAttachments}
          showFullSet={showFullAttachmentSet}
        />
      )}

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 print:shadow-none print:border-none mt-4 break-inside-avoid">
        <div className="text-center mb-4 no-print">
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">Fotos Adjuntas</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Las fotos que agregue se incluirán también al final del PDF.
          </p>
        </div>
        {photos.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center no-print">
            Todavía no se agregaron fotos.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo, i) => (
              <div key={photo.id} className="relative rounded border border-slate-200 dark:border-slate-700 overflow-hidden">
                <img src={photo.dataUrl} alt={`Foto ${i + 1}`} className="w-full h-28 object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1 right-1 no-print bg-black/60 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/80"
                  title="Quitar foto"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center mt-4 no-print">
        <button
          type="button"
          onClick={handleAddPhotoClick}
          className="px-4 py-2 rounded bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
        >
          📷 Agregar imagen
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoSelected}
        />
        <button
          type="button"
          onClick={() => {
            setChecklistMessage(null);
            setShowChecklist(true);
          }}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
        >
          Siguiente →
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded bg-slate-700 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar planilla"}
        </button>
        <button
          type="button"
          onClick={handleOpenClick}
          className="px-4 py-2 rounded bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          Abrir planilla
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleFileSelected}
        />
        <button
          type="button"
          onClick={() => setShowQr(true)}
          className="px-4 py-2 rounded bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
        >
          Generar código QR
        </button>
      </div>
      {saveMessage && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2 no-print">
          {saveMessage}
        </p>
      )}
      {checklistMessage && (
        <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 mt-1 no-print">
          {checklistMessage}
        </p>
      )}

      {showQr && <QrCodeModal state={state} onClose={() => setShowQr(false)} />}
      {showChecklist && (
        <ChecklistModal
          questions={checklistQuestions}
          onComplete={handleChecklistComplete}
          onClose={() => setShowChecklist(false)}
        />
      )}
    </div>
  );
}
