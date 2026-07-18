export type ItemType = "boquilla" | "tapa" | "filtro" | "generic";

export type ItemRow = {
  id: string;
  desc: string;
  code: string;
  qty: number;
  status: "-" | "X";
  type: ItemType;
};

export type ModelTemplate = {
  id: string;
  modelo: string;
  items: {
    id: string;
    desc: string;
    code: string;
    qty: number;
    status: "-" | "X";
    type: ItemType;
  }[];
};

export type PlanillaHeader = {
  modeloId: string;
  modelo: string;
  cliente: string;
  chasisN: string;
  serieN: string;
  bombaN: string;
  motorN: string;
  fecha: string;
  realizadoPor: string;
};

export type PlanillaPhoto = {
  id: string;
  dataUrl: string;
};

export type ChecklistAnswer = {
  question: string;
  answer: "si" | "no";
};

export type PiezaFaltanteRow = {
  id: string;
  desc: string;
  code: string;
  qty: string;
};

export type AttachmentsState = {
  piezaFaltante: {
    revendedorNombre: string;
    direccion: string;
    telefono: string;
    ciudad: string;
    provincia: string;
    clienteNombre: string;
    rows: PiezaFaltanteRow[];
    confeccionadoPor: string;
    telefonoParticular: string;
    fecha: string;
  };
  banderillero: {
    aclaracion: string;
    fecha: string;
  };
  telemetria: {
    modeloMaquina: string;
    numeroChasis: string;
    tamanoBarra: string;
    companiaChip: string;
    numeroSerieModulo: string;
    versionFirmware: string;
    versionBSP: string;
    propietarioNombre: string;
    propietarioContacto: string;
    propietarioEmail: string;
    connectNombreApp: string;
    connectNombreContacto: string;
    connectFuncion: string;
    connectContacto: string;
    connectEmail: string;
    propiedadNombre: string;
    propiedadProvincia: string;
    propiedadCiudad: string;
  };
  cumminsRevision: {
    propietarioNombre: string;
    direccion: string;
    localidadProvincia: string;
    motorSerie: string;
    motorModeloShopOrder: string;
    motorFechaFabricacion: string;
    equipoFabricante: string;
    equipoTipo: string;
    equipoModeloSerie: string;
    equipoFechaFabricacion: string;
    equipoOriginal: string;
    repotenciacion: string;
    fechaVenta: string;
  };
  usoMotorCummins: {
    firma: string;
    aclaracion: string;
  };
  embrague?: {
    firma: string;
    aclaracion: string;
    dni: string;
  };
};

export type PlanillaState = {
  header: PlanillaHeader;
  items: ItemRow[];
  attachments: AttachmentsState | null;
  photos: PlanillaPhoto[];
  /** Recordatorio de verificación final (preguntas sí/no). No se incluye en el PDF ni en el QR. */
  checklist: ChecklistAnswer[] | null;
};
