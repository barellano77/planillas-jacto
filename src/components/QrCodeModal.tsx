import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { PlanillaState } from "../types";
import { apiFetch, API_BASE } from "../lib/auth";

type Props = {
  state: PlanillaState;
  existingId?: string;
  onClose: () => void;
};

export default function QrCodeModal({ state, existingId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let id = existingId;
        if (!id) {
          const res = await apiFetch("/api/planillas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(state),
          });
          if (!res.ok) throw new Error("No se pudo guardar la planilla en el servidor.");
          ({ id } = (await res.json()) as { id: string });
        }
        const origin = API_BASE || window.location.origin;
        const url = `${origin}/api/planillas/${id}/pdf`;
        const dataUrl = await QRCode.toDataURL(url, { width: 320, margin: 1 });
        if (cancelled) return;
        setPdfUrl(url);
        setQrDataUrl(dataUrl);
      } catch {
        if (cancelled) return;
        setError(
          "No se pudo generar el código QR. Verifique la conexión con el servidor e intente nuevamente."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePrint() {
    if (!qrDataUrl) return;
    const w = window.open("", "_blank", "width=420,height=560");
    if (!w) return;
    w.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>QR - ${state.header.modelo}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 24px; }
            h1 { font-size: 16px; margin-bottom: 4px; }
            p { font-size: 12px; margin: 2px 0; color: #333; }
            img { margin-top: 16px; width: 260px; height: 260px; }
          </style>
        </head>
        <body>
          <h1>PLANILLA DE ARMADO DE EQUIPOS</h1>
          <p>JACTO ARGENTINA</p>
          <p><strong>Modelo:</strong> ${state.header.modelo}</p>
          <p><strong>Cliente:</strong> ${state.header.cliente || "-"}</p>
          <p><strong>Chasis N°:</strong> ${state.header.chasisN || "-"}</p>
          <img src="${qrDataUrl}" alt="Código QR" />
          <p>Escanee este código para ver la planilla completa en PDF.</p>
          <script>window.onload = () => { window.print(); };</script>
        </body>
      </html>
    `);
    w.document.close();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-sm w-full p-6 text-center">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
          Código QR de la planilla
        </h2>
        {loading && (
          <p className="text-sm text-slate-500 dark:text-slate-400">Generando código QR...</p>
        )}
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {qrDataUrl && (
          <>
            <img src={qrDataUrl} alt="Código QR" className="mx-auto w-64 h-64" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 break-all">{pdfUrl}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Al escanear este código se abrirá el PDF completo de esta planilla.
            </p>
          </>
        )}
        <div className="flex gap-2 justify-center mt-4">
          {qrDataUrl && (
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700"
            >
              Imprimir
            </button>
          )}
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
