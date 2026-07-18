import type { AttachmentsState, PiezaFaltanteRow } from "../types";
import { newPiezaFaltanteRow } from "../utils/attachments";
import { EMBRAGUE_TABLE, EMBRAGUE_TIPS, EMBRAGUE_REGULACIONES, EMBRAGUE_EXCLUSION } from "../data/attachmentGroups";

type Props = {
  attachments: AttachmentsState;
  header: { modelo: string; chasisN: string };
  setAttachments: (updater: (prev: AttachmentsState) => AttachmentsState) => void;
  /** Si el modelo no tiene un grupo de anexos asociado (Cummins/telemetría/banderillero),
   *  solo se muestra la planilla de Solicitud de Pieza Faltante. */
  showFullSet?: boolean;
};

const inputCls =
  "w-full rounded border border-slate-300 dark:border-slate-600 px-2 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100";
const labelCls = "block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1";

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 print:shadow-none print:border-none mt-4 break-inside-avoid">
      <div className="text-center mb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input type={type} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export default function Attachments({ attachments, setAttachments, showFullSet = true }: Props) {
  const update = <K extends keyof AttachmentsState>(key: K, patch: Partial<AttachmentsState[K]>) => {
    setAttachments((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  function updatePiezaRow(id: string, patch: Partial<PiezaFaltanteRow>) {
    setAttachments((prev) => ({
      ...prev,
      piezaFaltante: {
        ...prev.piezaFaltante,
        rows: prev.piezaFaltante.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      },
    }));
  }

  function addPiezaRow() {
    setAttachments((prev) => ({
      ...prev,
      piezaFaltante: { ...prev.piezaFaltante, rows: [...prev.piezaFaltante.rows, newPiezaFaltanteRow()] },
    }));
  }

  function removePiezaRow(id: string) {
    setAttachments((prev) => ({
      ...prev,
      piezaFaltante: {
        ...prev.piezaFaltante,
        rows: prev.piezaFaltante.rows.filter((r) => r.id !== id),
      },
    }));
  }

  const pf = attachments.piezaFaltante;
  const bd = attachments.banderillero;
  const tm = attachments.telemetria;
  const cr = attachments.cumminsRevision;
  const um = attachments.usoMotorCummins;

  return (
    <div>
      <div className="text-center mt-8 mb-2 no-print">
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">Planillas Adjuntas</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Estas planillas se incluirán por duplicado al final del PDF descargado.
        </p>
      </div>

      {/* Solicitud de Pieza Faltante */}
      <Card title="Solicitud de Pieza Faltante o Rota en Máquina Nueva" subtitle="Datos del Revendedor">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <Field label="Nombre" value={pf.revendedorNombre} onChange={(v) => update("piezaFaltante", { revendedorNombre: v })} />
          <Field label="Dirección" value={pf.direccion} onChange={(v) => update("piezaFaltante", { direccion: v })} />
          <Field label="Teléfono" value={pf.telefono} onChange={(v) => update("piezaFaltante", { telefono: v })} />
          <Field label="Ciudad" value={pf.ciudad} onChange={(v) => update("piezaFaltante", { ciudad: v })} />
          <Field label="Provincia" value={pf.provincia} onChange={(v) => update("piezaFaltante", { provincia: v })} />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Datos del Equipo</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <Field label="Nombre" value={pf.clienteNombre} onChange={(v) => update("piezaFaltante", { clienteNombre: v })} />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
          Descripción del Problema y Código
        </p>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded mb-2">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-800 dark:bg-black text-white text-xs">
                <th className="px-2 py-2">Código</th>
                <th className="px-2 py-2">Cantidad</th>
                <th className="px-2 py-2">Descripción del Problema</th>
                <th className="px-2 py-2 w-8 no-print"></th>
              </tr>
            </thead>
            <tbody>
              {pf.rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-2 py-1">
                    <input
                      className={inputCls}
                      value={row.code}
                      onChange={(e) => updatePiezaRow(row.id, { code: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className={inputCls}
                      value={row.qty}
                      onChange={(e) => updatePiezaRow(row.id, { qty: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1">
                    <input
                      className={inputCls}
                      value={row.desc}
                      onChange={(e) => updatePiezaRow(row.id, { desc: e.target.value })}
                    />
                  </td>
                  <td className="px-2 py-1 no-print">
                    <button
                      type="button"
                      onClick={() => removePiezaRow(row.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addPiezaRow}
          className="text-xs px-3 py-1.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 no-print mb-4"
        >
          + Agregar fila
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Confeccionado Por" value={pf.confeccionadoPor} onChange={(v) => update("piezaFaltante", { confeccionadoPor: v })} />
          <Field label="Teléfono Particular" value={pf.telefonoParticular} onChange={(v) => update("piezaFaltante", { telefonoParticular: v })} />
          <Field label="Fecha" type="date" value={pf.fecha} onChange={(v) => update("piezaFaltante", { fecha: v })} />
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
          Los reclamos se aceptan antes de los 5 días de comercializada la máquina o consignada.
        </p>
      </Card>

      {/* Entrega de Banderillero */}
      {showFullSet && (
      <Card title="Anexo de Entrega de Banderillero" subtitle="Indicaciones Importantes">
        <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-300 space-y-2 mb-4">
          <li>
            No haga adaptaciones ni agregue fichas para la alimentación de otros accesorios de la máquina en el
            Cable de Alimentación del Banderillero. Las fichas originales son protegidas con fusibles y cualquier
            adaptación puede producir daños irreparables y causar graves roturas.
          </li>
          <li>
            Para la fijación del banderillero en el interior de la cabina de la máquina debe tenerse en cuenta lo
            siguiente:
            <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
              <li>Las superficies deben estar limpias (pasar un paño con alcohol).</li>
              <li>Las superficies deben ser lisas, sin poros que permitan la entrada de aire, humedad o impurezas.</li>
              <li>
                Después de cada uso, limpie la sopapa, limpie la superficie de fijación y guarde los componentes del
                banderillero hasta su nuevo uso. Repita esta operación cuando vuelva a colocarlo.
              </li>
              <li>
                Tenga en cuenta que la fijación vía sopapa no es una fijación permanente, es necesario realizar las
                tareas indicadas anteriormente; su incumplimiento puede causar la caída y rotura del equipamiento.
              </li>
            </ul>
          </li>
          <li>
            Antes de apagar el banderillero siempre debe cerrar el trabajo que tiene abierto, y apagar el equipo
            desde la pantalla (Touch Screen). Nunca se debe apagar el equipo del botón de encendido o desconectando
            el equipo.
          </li>
        </ol>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-4">
          IMPORTANTE: EL INCUMPLIMIENTO DE ESTAS INDICACIONES PUEDE CAUSAR PROBLEMAS Y ROTURAS NO ALCANZADAS POR LOS
          TÉRMINOS DE GARANTÍA.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Aclaración (Firma del Propietario o Usuario)" value={bd.aclaracion} onChange={(v) => update("banderillero", { aclaracion: v })} />
          <Field label="Fecha" type="date" value={bd.fecha} onChange={(v) => update("banderillero", { fecha: v })} />
        </div>
      </Card>
      )}

      {/* Registro Telemetria */}
      {showFullSet && (
      <Card title="Datos para la Telemetría" subtitle="Registro de Telemetría">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Datos de la Máquina</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <Field label="Modelo de Máquina" value={tm.modeloMaquina} onChange={(v) => update("telemetria", { modeloMaquina: v })} />
          <Field label="Número de Chasis" value={tm.numeroChasis} onChange={(v) => update("telemetria", { numeroChasis: v })} />
          <Field label="Tamaño de Barra" value={tm.tamanoBarra} onChange={(v) => update("telemetria", { tamanoBarra: v })} />
          <Field label="Compañía del Chip" value={tm.companiaChip} onChange={(v) => update("telemetria", { companiaChip: v })} />
          <Field label="N° de Serie Módulo de Telemetría" value={tm.numeroSerieModulo} onChange={(v) => update("telemetria", { numeroSerieModulo: v })} />
          <Field label="Versión de Firmware" value={tm.versionFirmware} onChange={(v) => update("telemetria", { versionFirmware: v })} />
          <Field label="Versión de BSP" value={tm.versionBSP} onChange={(v) => update("telemetria", { versionBSP: v })} />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Datos del Propietario</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <Field label="Nombre" value={tm.propietarioNombre} onChange={(v) => update("telemetria", { propietarioNombre: v })} />
          <Field label="Número de Contacto" value={tm.propietarioContacto} onChange={(v) => update("telemetria", { propietarioContacto: v })} />
          <Field label="E-mail de Contacto" value={tm.propietarioEmail} onChange={(v) => update("telemetria", { propietarioEmail: v })} />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Datos de Contacto Connect</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <Field label="Nombre Registrado en la Aplicación" value={tm.connectNombreApp} onChange={(v) => update("telemetria", { connectNombreApp: v })} />
          <Field label="Nombre de Contacto" value={tm.connectNombreContacto} onChange={(v) => update("telemetria", { connectNombreContacto: v })} />
          <Field label="Función (Dueño / Administrador / Ing. de Campo)" value={tm.connectFuncion} onChange={(v) => update("telemetria", { connectFuncion: v })} />
          <Field label="Número de Contacto" value={tm.connectContacto} onChange={(v) => update("telemetria", { connectContacto: v })} />
          <Field label="E-mail de Contacto" value={tm.connectEmail} onChange={(v) => update("telemetria", { connectEmail: v })} />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Datos de la Propiedad</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre" value={tm.propiedadNombre} onChange={(v) => update("telemetria", { propiedadNombre: v })} />
          <Field label="Provincia" value={tm.propiedadProvincia} onChange={(v) => update("telemetria", { propiedadProvincia: v })} />
          <Field label="Ciudad" value={tm.propiedadCiudad} onChange={(v) => update("telemetria", { propiedadCiudad: v })} />
        </div>
      </Card>
      )}

      {/* Formulario Revision Inicial Cummins */}
      {showFullSet && (
      <Card title="Formulario de Revisión Inicial / Puesta en Marcha" subtitle="Distribuidora Cummins S.A.">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Propietario</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <Field label="Apellido y Nombre o Razón Social" value={cr.propietarioNombre} onChange={(v) => update("cumminsRevision", { propietarioNombre: v })} />
          <Field label="Dirección" value={cr.direccion} onChange={(v) => update("cumminsRevision", { direccion: v })} />
          <Field label="Localidad - Provincia" value={cr.localidadProvincia} onChange={(v) => update("cumminsRevision", { localidadProvincia: v })} />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Motor</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <Field label="N° de Serie" value={cr.motorSerie} onChange={(v) => update("cumminsRevision", { motorSerie: v })} />
          <Field label="Modelo / Shop Order" value={cr.motorModeloShopOrder} onChange={(v) => update("cumminsRevision", { motorModeloShopOrder: v })} />
          <Field label="Fecha de Fabricación" type="date" value={cr.motorFechaFabricacion} onChange={(v) => update("cumminsRevision", { motorFechaFabricacion: v })} />
        </div>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Equipo</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <Field label="Fabricante" value={cr.equipoFabricante} onChange={(v) => update("cumminsRevision", { equipoFabricante: v })} />
          <Field label="Tipo" value={cr.equipoTipo} onChange={(v) => update("cumminsRevision", { equipoTipo: v })} />
          <Field label="Modelo / Serie" value={cr.equipoModeloSerie} onChange={(v) => update("cumminsRevision", { equipoModeloSerie: v })} />
          <Field label="Fecha de Fabricación" type="date" value={cr.equipoFechaFabricacion} onChange={(v) => update("cumminsRevision", { equipoFechaFabricacion: v })} />
          <Field label="Equipo Original" value={cr.equipoOriginal} onChange={(v) => update("cumminsRevision", { equipoOriginal: v })} />
          <Field label="Repotenciación" value={cr.repotenciacion} onChange={(v) => update("cumminsRevision", { repotenciacion: v })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Fecha de Venta (Inicio de Garantía)" type="date" value={cr.fechaVenta} onChange={(v) => update("cumminsRevision", { fechaVenta: v })} />
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3">
          Distribuidora Cummins S.A. — Centro Nacional de Distribución: Ruta Panamericana Km 32,5 - (1618) El Talar -
          Pcia. de Buenos Aires. Tel. (011) 4736-6400 — E-mail: info@cummins.com.ar
        </p>
      </Card>
      )}

      {/* Uso de Motor Cummins */}
      {showFullSet && (
      <Card title="Recomendaciones para el Uso de Motor Cummins">
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-3">
          Consulte las recomendaciones de uso del motor incluidas en el PDF descargado.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Firma" value={um.firma} onChange={(v) => update("usoMotorCummins", { firma: v })} />
          <Field label="Aclaración" value={um.aclaracion} onChange={(v) => update("usoMotorCummins", { aclaracion: v })} />
        </div>
      </Card>
      )}

      {/* Garantía Embragues */}
      {showFullSet && attachments.embrague && (
        <Card title="Garantía Embragues" subtitle="Recomendaciones para el Buen Uso">
          <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1 mb-4">
            {EMBRAGUE_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Regulaciones</p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">{EMBRAGUE_REGULACIONES}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Exclusión de Garantía</p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">{EMBRAGUE_EXCLUSION}</p>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded mb-4">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800 dark:bg-black text-white text-xs">
                  <th className="px-2 py-2">Falla</th>
                  <th className="px-2 py-2">Causas Probables</th>
                  <th className="px-2 py-2">Correcciones</th>
                </tr>
              </thead>
              <tbody>
                {EMBRAGUE_TABLE.map((row, i) => (
                  <tr key={i} className="border-t border-slate-200 dark:border-slate-700 align-top">
                    <td className="px-2 py-1 text-xs">{row.falla}</td>
                    <td className="px-2 py-1 text-xs">{row.causa}</td>
                    <td className="px-2 py-1 text-xs">{row.correccion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Firma del Propietario o Usuario" value={attachments.embrague.firma} onChange={(v) => update("embrague", { firma: v })} />
            <Field label="Aclaración y D.N.I." value={attachments.embrague.aclaracion} onChange={(v) => update("embrague", { aclaracion: v })} />
          </div>
        </Card>
      )}
    </div>
  );
}
