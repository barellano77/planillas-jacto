import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AttachmentsState, PlanillaPhoto, PlanillaState } from "../types";
import { JACTO_LOGO_BASE64, JACTO_LOGO_WIDTH, JACTO_LOGO_HEIGHT } from "../assets/jactoLogoBase64";
import {
  getAttachmentGroup,
  MOTOR_BULLETS,
  MOTOR_SPECS,
  MOTOR_SPECS_NOTE,
  EMBRAGUE_TIPS,
  EMBRAGUE_REGULACIONES,
  EMBRAGUE_EXCLUSION,
  EMBRAGUE_TABLE,
} from "../data/attachmentGroups";

const PAGE_BOTTOM = 780;
const MARGIN_X = 40;

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_BOTTOM) {
    doc.addPage();
    return 50;
  }
  return y;
}

function drawFormTitle(doc: jsPDF, title: string, subtitle?: string): number {
  let y = 50;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN_X, y, { maxWidth: 515 });
  y += 20;
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(subtitle, MARGIN_X, y);
    y += 16;
  }
  y += 6;
  return y;
}

function drawFieldPairs(doc: jsPDF, y: number, pairs: [string, string][]): number {
  doc.setFontSize(10);
  pairs.forEach(([label, value]) => {
    y = ensureSpace(doc, y, 16);
    doc.setFont("helvetica", "bold");
    doc.text(label, MARGIN_X, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value || "-"), MARGIN_X + 200, y, { maxWidth: 315 });
    y += 16;
  });
  return y;
}

function drawSectionHeading(doc: jsPDF, y: number, text: string): number {
  y = ensureSpace(doc, y, 20);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(text, MARGIN_X, y);
  return y + 16;
}

function renderPiezaFaltante(doc: jsPDF, state: PlanillaState, pf: AttachmentsState["piezaFaltante"], copy: number) {
  doc.addPage();
  let y = drawFormTitle(
    doc,
    "SOLICITUD DE PIEZA FALTANTE O ROTA EN MAQUINA NUEVA",
    `Copia ${copy} de 2`
  );
  y = drawSectionHeading(doc, y, "Datos del Revendedor");
  y = drawFieldPairs(doc, y, [
    ["Nombre:", pf.revendedorNombre],
    ["Dirección:", pf.direccion],
    ["Teléfono:", pf.telefono],
    ["Ciudad:", pf.ciudad],
    ["Provincia:", pf.provincia],
  ]);
  y += 6;
  y = drawSectionHeading(doc, y, "Datos del Equipo");
  y = drawFieldPairs(doc, y, [
    ["Nombre:", pf.clienteNombre || state.header.cliente],
    ["Modelo:", state.header.modelo],
    ["Número de Chasis:", state.header.chasisN],
  ]);
  y += 10;

  const rows = pf.rows.map((r) => [r.code || "-", r.qty || "-", r.desc || "-"]);
  autoTable(doc, {
    startY: y,
    head: [["Código", "Cantidad", "Descripción del Problema"]],
    body: rows.length ? rows : [["-", "-", "-"]],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [30, 64, 175] },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });
  // @ts-expect-error lastAutoTable is injected by the plugin at runtime
  y = (doc.lastAutoTable?.finalY ?? y) + 20;

  y = ensureSpace(doc, y, 60);
  y = drawFieldPairs(doc, y, [
    ["Confeccionado por:", pf.confeccionadoPor],
    ["Teléfono particular:", pf.telefonoParticular],
    ["Fecha:", pf.fecha],
  ]);
  y += 20;
  y = ensureSpace(doc, y, 40);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    "Los reclamos se aceptan antes de los 5 días de comercializada la máquina o consignada.",
    MARGIN_X,
    y,
    { maxWidth: 515 }
  );
}

function renderBanderillero(doc: jsPDF, bd: AttachmentsState["banderillero"], copy: number) {
  doc.addPage();
  let y = drawFormTitle(doc, "ANEXO DE ENTREGA DE BANDERILLERO", `Copia ${copy} de 2`);
  y = drawSectionHeading(doc, y, "Indicaciones Importantes");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const points = [
    "1. No haga adaptaciones ni agregue fichas para la alimentación de otros accesorios de la máquina en el Cable de Alimentación del Banderillero. Las fichas originales son protegidas con fusibles y cualquier adaptación puede producir daños irreparables y causar graves roturas.",
    "2. Para la fijación del banderillero en el interior de la cabina de la máquina debe tenerse en cuenta lo siguiente:",
    "   a) Las superficies deben estar limpias (pasar un paño con alcohol).",
    "   b) Las superficies deben ser lisas, sin poros que permitan la entrada de aire, humedad o impurezas.",
    "   c) Después de cada uso, limpie la sopapa, limpie la superficie de fijación y guarde los componentes del banderillero hasta su nuevo uso. Repita esta operación cuando vuelva a colocarlo.",
    "   d) Tenga en cuenta que la fijación vía sopapa no es una fijación permanente, es necesario realizar las tareas indicadas anteriormente; su incumplimiento puede causar la caída y rotura del equipamiento.",
    "3. Antes de apagar el banderillero siempre debe cerrar el trabajo que tiene abierto, y apagar el equipo desde la pantalla (Touch Screen). Nunca se debe apagar el equipo del botón de encendido o desconectando el equipo.",
  ];
  points.forEach((p) => {
    const lines = doc.splitTextToSize(p, 515);
    y = ensureSpace(doc, y, lines.length * 12 + 6);
    doc.text(lines, MARGIN_X, y);
    y += lines.length * 12 + 6;
  });
  y += 6;
  y = ensureSpace(doc, y, 30);
  doc.setFont("helvetica", "bold");
  const warn = doc.splitTextToSize(
    "IMPORTANTE: EL INCUMPLIMIENTO DE ESTAS INDICACIONES PUEDE CAUSAR PROBLEMAS Y ROTURAS NO ALCANZADAS POR LOS TÉRMINOS DE GARANTÍA.",
    515
  );
  doc.text(warn, MARGIN_X, y);
  y += warn.length * 12 + 24;

  y = ensureSpace(doc, y, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Firma del Propietario o Usuario: ____________________", MARGIN_X, y);
  y += 18;
  doc.text(`Aclaración: ${bd.aclaracion || "_______________________"}`, MARGIN_X, y);
  y += 18;
  doc.text("Por Multijacto S.A.: ____________________", MARGIN_X, y);
  y += 18;
  doc.text(`Fecha: ${bd.fecha || "___/___/______"}`, MARGIN_X, y);
}

function renderTelemetria(doc: jsPDF, tm: AttachmentsState["telemetria"], copy: number) {
  doc.addPage();
  let y = drawFormTitle(doc, "DATOS PARA LA TELEMETRIA", `Copia ${copy} de 2`);
  y = drawSectionHeading(doc, y, "Datos de la Máquina");
  y = drawFieldPairs(doc, y, [
    ["Modelo de Máquina:", tm.modeloMaquina],
    ["Número de Chasis:", tm.numeroChasis],
    ["Tamaño de Barra:", tm.tamanoBarra],
    ["Compañía del Chip:", tm.companiaChip],
    ["N° de Serie Módulo Telemetría:", tm.numeroSerieModulo],
    ["Versión de Firmware:", tm.versionFirmware],
    ["Versión de BSP:", tm.versionBSP],
  ]);
  y += 6;
  y = drawSectionHeading(doc, y, "Datos del Propietario");
  y = drawFieldPairs(doc, y, [
    ["Nombre:", tm.propietarioNombre],
    ["Número de Contacto:", tm.propietarioContacto],
    ["E-mail de Contacto:", tm.propietarioEmail],
  ]);
  y += 6;
  y = drawSectionHeading(doc, y, "Datos de Contacto Connect");
  y = drawFieldPairs(doc, y, [
    ["Nombre Registrado en la App:", tm.connectNombreApp],
    ["Nombre de Contacto:", tm.connectNombreContacto],
    ["Función:", tm.connectFuncion],
    ["Número de Contacto:", tm.connectContacto],
    ["E-mail de Contacto:", tm.connectEmail],
  ]);
  y += 6;
  y = drawSectionHeading(doc, y, "Datos de la Propiedad");
  y = drawFieldPairs(doc, y, [
    ["Nombre:", tm.propiedadNombre],
    ["Provincia:", tm.propiedadProvincia],
    ["Ciudad:", tm.propiedadCiudad],
  ]);
}

function renderCumminsRevision(doc: jsPDF, cr: AttachmentsState["cumminsRevision"], copy: number) {
  doc.addPage();
  let y = drawFormTitle(doc, "FORMULARIO DE REVISION INICIAL / PUESTA EN MARCHA", `Copia ${copy} de 2`);
  y = drawSectionHeading(doc, y, "Propietario");
  y = drawFieldPairs(doc, y, [
    ["Apellido y Nombre o Razón Social:", cr.propietarioNombre],
    ["Dirección:", cr.direccion],
    ["Localidad - Provincia:", cr.localidadProvincia],
  ]);
  y += 6;
  y = drawSectionHeading(doc, y, "Motor");
  y = drawFieldPairs(doc, y, [
    ["N° de Serie:", cr.motorSerie],
    ["Modelo / Shop Order:", cr.motorModeloShopOrder],
    ["Fecha de Fabricación:", cr.motorFechaFabricacion],
  ]);
  y += 6;
  y = drawSectionHeading(doc, y, "Equipo");
  y = drawFieldPairs(doc, y, [
    ["Fabricante:", cr.equipoFabricante],
    ["Tipo:", cr.equipoTipo],
    ["Modelo / Serie:", cr.equipoModeloSerie],
    ["Fecha de Fabricación:", cr.equipoFechaFabricacion],
    ["Equipo Original:", cr.equipoOriginal],
    ["Repotenciación:", cr.repotenciacion],
  ]);
  y += 6;
  y = drawFieldPairs(doc, y, [["Fecha de Venta (Inicio de Garantía):", cr.fechaVenta]]);
  y += 20;
  y = ensureSpace(doc, y, 40);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Firma y sello de empresa vendedora: ____________________", MARGIN_X, y);
  y += 18;
  doc.text("Firma del propietario: ____________________", MARGIN_X, y);
  y += 26;
  y = ensureSpace(doc, y, 40);
  doc.setFontSize(8);
  const foot = doc.splitTextToSize(
    "Distribuidora Cummins S.A. — Centro Nacional de Distribución: Ruta Panamericana Km 32,5 - (1618) El Talar - Pcia. de Buenos Aires. Tel. (011) 4736-6400 (líneas rotativas) – Fax (011) 4736-6406 – E-mail: info@cummins.com.ar",
    515
  );
  doc.text(foot, MARGIN_X, y);
}

function renderUsoMotorCummins(
  doc: jsPDF,
  um: AttachmentsState["usoMotorCummins"],
  group: { motorHeader: string; motorTitle: string; motorEquipa: string },
  copy: number
) {
  doc.addPage();
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${group.motorHeader} — Copia ${copy} de 2`, MARGIN_X, 40);
  let y = drawFormTitle(doc, group.motorTitle.toUpperCase(), group.motorEquipa);
  doc.setFontSize(9);
  MOTOR_BULLETS.forEach((b) => {
    const lines = doc.splitTextToSize(`•  ${b}`, 515);
    y = ensureSpace(doc, y, lines.length * 11 + 6);
    doc.text(lines, MARGIN_X, y);
    y += lines.length * 11 + 6;
  });

  doc.addPage();
  y = 50;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Cummins requiere de las siguientes especificaciones para el combustible utilizado:", MARGIN_X, y, {
    maxWidth: 515,
  });
  y += 24;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  MOTOR_SPECS.forEach((s) => {
    const lines = doc.splitTextToSize(`o  ${s}`, 515);
    y = ensureSpace(doc, y, lines.length * 11 + 6);
    doc.text(lines, MARGIN_X, y);
    y += lines.length * 11 + 6;
  });
  y += 6;
  const note = doc.splitTextToSize(MOTOR_SPECS_NOTE, 515);
  y = ensureSpace(doc, y, note.length * 11 + 20);
  doc.text(note, MARGIN_X, y);
  y += note.length * 11 + 30;

  y = ensureSpace(doc, y, 40);
  doc.setFontSize(10);
  doc.text(`Firma: ${um.firma || "____________________"}`, MARGIN_X, y);
  y += 18;
  doc.text(`Aclaración: ${um.aclaracion || "____________________"}`, MARGIN_X, y);
}

function renderEmbrague(doc: jsPDF, em: NonNullable<AttachmentsState["embrague"]>, copy: number) {
  doc.addPage();
  let y = drawFormTitle(doc, "GARANTIA EMBRAGUES", `Copia ${copy} de 2`);
  y = drawSectionHeading(doc, y, "1. Recomendaciones para el Buen Uso. Algunos Ejemplos.");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  EMBRAGUE_TIPS.forEach((tip) => {
    const lines = doc.splitTextToSize(`•  ${tip}`, 515);
    y = ensureSpace(doc, y, lines.length * 11 + 6);
    doc.text(lines, MARGIN_X, y);
    y += lines.length * 11 + 6;
  });
  y += 6;
  y = drawSectionHeading(doc, y, "2. Regulaciones.");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let lines = doc.splitTextToSize(EMBRAGUE_REGULACIONES, 515);
  y = ensureSpace(doc, y, lines.length * 11 + 6);
  doc.text(lines, MARGIN_X, y);
  y += lines.length * 11 + 12;

  y = drawSectionHeading(doc, y, "3. Exclusión de Garantía.");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  lines = doc.splitTextToSize(EMBRAGUE_EXCLUSION, 515);
  y = ensureSpace(doc, y, lines.length * 11 + 6);
  doc.text(lines, MARGIN_X, y);
  y += lines.length * 11 + 16;

  y = ensureSpace(doc, y, 30);
  const rows = EMBRAGUE_TABLE.map((r) => [r.falla, r.causa, r.correccion]);
  autoTable(doc, {
    startY: y,
    head: [["Falla", "Causas Probables", "Correcciones"]],
    body: rows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 64, 175] },
    margin: { left: MARGIN_X, right: MARGIN_X },
  });
  // @ts-expect-error lastAutoTable is injected by the plugin at runtime
  y = (doc.lastAutoTable?.finalY ?? y) + 24;

  y = ensureSpace(doc, y, 40);
  doc.setFontSize(10);
  doc.text(`Firma del Propietario o Usuario: ${em.firma || "____________________"}`, MARGIN_X, y);
  y += 18;
  doc.text(`Aclaración y D.N.I.: ${em.aclaracion || "____________________"}`, MARGIN_X, y);
}

function renderPhotos(doc: jsPDF, photos: PlanillaPhoto[]) {
  if (!photos.length) return;
  photos.forEach((photo, idx) => {
    doc.addPage();
    let y = drawFormTitle(doc, "FOTOS ADJUNTAS", `Foto ${idx + 1} de ${photos.length}`);
    const isPng = photo.dataUrl.startsWith("data:image/png");
    const isWebp = photo.dataUrl.startsWith("data:image/webp");
    const format = isPng ? "PNG" : isWebp ? "WEBP" : "JPEG";
    try {
      const props = doc.getImageProperties(photo.dataUrl);
      const maxWidth = 515;
      const maxHeight = PAGE_BOTTOM - y - 10;
      let w = maxWidth;
      let h = (props.height / props.width) * w;
      if (h > maxHeight) {
        h = maxHeight;
        w = (props.width / props.height) * h;
      }
      doc.addImage(photo.dataUrl, format, MARGIN_X, y, w, h);
    } catch {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("No se pudo cargar esta imagen.", MARGIN_X, y);
    }
  });
}

function appendExtraForms(doc: jsPDF, state: PlanillaState) {
  const group = getAttachmentGroup(state.header.modeloId);
  if (!state.attachments) return;
  const a = state.attachments;
  // La Solicitud de Pieza Faltante se incluye siempre, tenga o no el modelo un
  // grupo de anexos (Cummins/telemetría/banderillero) asociado.
  for (let copy = 1; copy <= 2; copy++) {
    renderPiezaFaltante(doc, state, a.piezaFaltante, copy);
  }
  if (!group) return;
  for (let copy = 1; copy <= 2; copy++) {
    renderBanderillero(doc, a.banderillero, copy);
    renderTelemetria(doc, a.telemetria, copy);
    renderCumminsRevision(doc, a.cumminsRevision, copy);
    renderUsoMotorCummins(doc, a.usoMotorCummins, group, copy);
    if (group.hasEmbrague && a.embrague) {
      renderEmbrague(doc, a.embrague, copy);
    }
  }
}

export function buildPdf(state: PlanillaState): jsPDF {
  const { header, items } = state;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  let y = 50;

  const logoDisplayWidth = 70;
  const logoDisplayHeight = (JACTO_LOGO_HEIGHT / JACTO_LOGO_WIDTH) * logoDisplayWidth;
  const logoTop = y - 20;
  try {
    doc.addImage(JACTO_LOGO_BASE64, "PNG", marginX, logoTop, logoDisplayWidth, logoDisplayHeight);
  } catch {
    // Si por algún motivo la imagen no puede incrustarse, se continúa sin logo.
  }
  const textX = marginX + logoDisplayWidth + 16;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PLANILLA DE ARMADO DE EQUIPOS", textX, y);
  y += 14;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("JACTO ARGENTINA", textX, y);
  y = Math.max(y, logoTop + logoDisplayHeight) + 22;

  doc.setFontSize(11);
  const fieldLines: [string, string][] = [
    ["Modelo:", header.modelo],
    ["Cliente:", header.cliente || "-"],
    ["Chasis N°:", header.chasisN || "-"],
    ["Serie N°:", header.serieN || "-"],
    ["Bomba N°:", header.bombaN || "-"],
    ["Motor N°:", header.motorN || "-"],
  ];
  fieldLines.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), marginX + 80, y);
    y += 16;
  });
  y += 6;

  const rows = items.map((it, i) => [
    String(i + 1),
    it.desc,
    it.code || "-",
    String(it.qty),
    it.status,
  ]);

  autoTable(doc, {
    startY: y,
    head: [["N°", "Descripción", "Código", "Cantidad", "Estado"]],
    body: rows,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [30, 64, 175] },
    columnStyles: {
      0: { cellWidth: 30, halign: "center" },
      2: { cellWidth: 70, halign: "center" },
      3: { cellWidth: 60, halign: "center" },
      4: { cellWidth: 55, halign: "center" },
    },
    margin: { left: marginX, right: marginX },
  });

  // @ts-expect-error lastAutoTable is injected by the plugin at runtime
  const finalY = doc.lastAutoTable?.finalY ?? y;
  let footerY = finalY + 30;
  if (footerY > 760) {
    doc.addPage();
    footerY = 50;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Fecha de armado:", marginX, footerY);
  doc.setFont("helvetica", "normal");
  doc.text(header.fecha || "-", marginX + 110, footerY);

  footerY += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Realizado por:", marginX, footerY);
  doc.setFont("helvetica", "normal");
  doc.text(header.realizadoPor || "-", marginX + 110, footerY);

  appendExtraForms(doc, state);
  renderPhotos(doc, state.photos ?? []);

  return doc;
}

export function pdfFileName(state: PlanillaState): string {
  const { header } = state;
  const base = `Planilla_${header.modelo}_${header.cliente || "sin_cliente"}`
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${base}.pdf`;
}
