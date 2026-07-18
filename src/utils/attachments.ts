import type { AttachmentsState } from "../types";

let rowSeq = 0;
function newPiezaRow() {
  rowSeq += 1;
  return { id: `pf-${Date.now()}-${rowSeq}`, desc: "", code: "", qty: "" };
}

export function buildEmptyAttachments(withEmbrague = false): AttachmentsState {
  return {
    piezaFaltante: {
      revendedorNombre: "",
      direccion: "",
      telefono: "",
      ciudad: "",
      provincia: "",
      clienteNombre: "",
      rows: [newPiezaRow(), newPiezaRow(), newPiezaRow()],
      confeccionadoPor: "",
      telefonoParticular: "",
      fecha: "",
    },
    banderillero: {
      aclaracion: "",
      fecha: "",
    },
    telemetria: {
      modeloMaquina: "",
      numeroChasis: "",
      tamanoBarra: "",
      companiaChip: "",
      numeroSerieModulo: "",
      versionFirmware: "",
      versionBSP: "",
      propietarioNombre: "",
      propietarioContacto: "",
      propietarioEmail: "",
      connectNombreApp: "",
      connectNombreContacto: "",
      connectFuncion: "",
      connectContacto: "",
      connectEmail: "",
      propiedadNombre: "",
      propiedadProvincia: "",
      propiedadCiudad: "",
    },
    cumminsRevision: {
      propietarioNombre: "",
      direccion: "",
      localidadProvincia: "",
      motorSerie: "",
      motorModeloShopOrder: "",
      motorFechaFabricacion: "",
      equipoFabricante: "",
      equipoTipo: "",
      equipoModeloSerie: "",
      equipoFechaFabricacion: "",
      equipoOriginal: "",
      repotenciacion: "",
      fechaVenta: "",
    },
    usoMotorCummins: {
      firma: "",
      aclaracion: "",
    },
    embrague: withEmbrague ? { firma: "", aclaracion: "", dni: "" } : undefined,
  };
}

export function newPiezaFaltanteRow() {
  return newPiezaRow();
}
