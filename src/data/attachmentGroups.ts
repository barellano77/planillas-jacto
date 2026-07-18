export type AttachmentGroupId = "cummins-8030" | "cummins-2530" | "cummins-2030-2500plus-3000";

export type AttachmentGroup = {
  id: AttachmentGroupId;
  modelIds: string[];
  motorHeader: string;
  motorTitle: string;
  motorEquipa: string;
  hasEmbrague?: boolean;
};

export const ATTACHMENT_GROUPS: AttachmentGroup[] = [
  {
    id: "cummins-8030",
    modelIds: ["UP 3030", "UP 4530", "UP 5030", "UP 8030"],
    motorHeader: "Entrega Técnica Uniport 3030-4530-5030-8030",
    motorTitle: "Recomendaciones para el Uso de Motor Cummins QSB 6.7 – Tier III Electrónico - B20",
    motorEquipa: "(Equipa el UNIPORT 3030 / UNIPORT 4530 / UNIPORT 5030 / UNIPORT 8030)",
  },
  {
    id: "cummins-2530",
    modelIds: ["UNIPORT 2530-36"],
    motorHeader: "Entrega Técnica Uniport 2530",
    motorTitle: "Recomendaciones para el Uso de Motor Cummins QSB4.5 – Mar-1 Electrónico",
    motorEquipa: "(Equipa el UNIPORT 2030/UNIPORT 2530)",
  },
  {
    id: "cummins-2030-2500plus-3000",
    modelIds: [
      "UNIPORT 2030",
      "UNIPORT 3000-ARG",
      "UNIPORT 2500 PLUS",
      "UNIPORT 2500 PLUS 24",
    ],
    motorHeader: "Entrega Técnica Uniport 3000-2030-2500 Plus",
    motorTitle: "Recomendaciones para el Uso de Motor Cummins QSB4.5 – Mar-1 Electrónico",
    motorEquipa: "(Equipa el UNIPORT 2030/UNIPORT 2530)",
    hasEmbrague: true,
  },
];

export const EMBRAGUE_TIPS: string[] = [
  "No mover con la máquina en Tercera marcha.",
  "No contar surcos con el pie en el embrague.",
  "No usar el pie para descansar arriba del embrague.",
  "No realizar golpes de embrague.",
  "No traccionar con la máquina ningún tipo de herramienta, etc.",
];

export const EMBRAGUE_REGULACIONES =
  "Para una buena Regulación dirigirse al Manual del operario. Capítulo 5, Hoja Nº 34 para Uniport 2500 Plus y Capítulo 4, Hoja Nº 33 Uniport 2500/3000 Star.";

export const EMBRAGUE_EXCLUSION =
  "En los casos donde se compruebe Rotura de embrague por Patinaje del mismo, la garantía será rechazada en su totalidad.";

export const EMBRAGUE_TABLE: { falla: string; causa: string; correccion: string }[] = [
  {
    falla: "Dificultad de accionamiento",
    causa: "Placa de Presión no vuelve.",
    correccion: "Verificar deformación en los resortes. Verificar si las palancas están correctamente colocadas.",
  },
  {
    falla: "Dificultad de accionamiento",
    causa: "Disco Torcido.",
    correccion: "Verificar el disco y si es necesario sustituirlo. Instalación Incorrecta.",
  },
  {
    falla: "Dificultad de accionamiento",
    causa: "Eje piloto/cubo entallado de los discos c/ desgaste.",
    correccion:
      "Verificar el alineamiento del motor/transmisión. Verificar las condiciones de los cubos entallados de los discos y el eje piloto. Si es necesario sustituirlos.",
  },
  {
    falla: "Dificultad de accionamiento",
    causa: "Placa Intermedia averiada.",
    correccion:
      "Sustituir el conjunto de placa y discos. Montaje incorrecto. Orientar al conductor sobre abusos en la operación: sobrecarga, arranque en marcha errada, deslizamiento excesivo, etc.",
  },
  {
    falla: "Dificultad de accionamiento",
    causa: "Embrague no funciona.",
    correccion: "Verificar nivel del fluido en el depósito y fugas en los cilindros y tubos.",
  },
  {
    falla: "Dificultad de accionamiento",
    causa: "Dificultad al enganchar las marchas.",
    correccion: "Verificar agua de fluido en el cilindro papal y auxiliar.",
  },
  {
    falla: "Deslizamiento del embrague",
    causa: "Pedal sin Holgura.",
    correccion: "Verificar la varilla del cilindro principal.",
  },
  {
    falla: "Deslizamiento del embrague",
    causa: "Presión flaca de los resortes.",
    correccion: "Verificar y si es necesario cambiar los resortes.",
  },
  {
    falla: "Deslizamiento del embrague",
    causa: "Desgaste excesivo en los discos, placa intermedia y placa de presión.",
    correccion: "Verificar los límites de desgastes de los componentes; sustituir lo que sea necesario.",
  },
  {
    falla: "Deslizamiento del embrague",
    causa: "Articulaciones de la horquilla presas.",
    correccion: "Verificar y Lubricar.",
  },
  {
    falla: "Deslizamiento del embrague",
    causa: "Grasa o aceite en los discos.",
    correccion: "Eliminar los excesos o fugas; Sustituir los discos.",
  },
];

export const MOTOR_BULLETS: string[] = [
  "Mantener los tanques de combustible siempre llenos para evitar condensaciones de agua. Esto debe hacerse tanto para el tanque de la máquina como para los tanques de abastecimiento y de apoyo.",
  "Colocar Filtros Tipo sedimentador PRO DP 240 en los depósitos, la medida del filtro a colocar dependerá del caudal de la bomba utilizada.",
  "Cambio de filtro y aceite de la máquina según norma del fabricante (cada 250 hs.) – ver manual.",
  "Controlar Nivel de Aceite de motor periódicamente, un nivel de aceite muy bajo provocará serios desgastes y roturas en el turbo o en el propio motor, principalmente. Por su parte, estar pasado del nivel de aceite también puede dañar el turbo o reventar manguitos por un exceso de presión.",
  "No dejar que se consuma la totalidad del combustible ya que puede absorber las impurezas del fondo, saturar los filtros y/o pasar al sistema de inyección. En lo posible completar cuando el medidor indique ¼ de tanque.",
  "Purgar el filtro de gasoil (Diésel Pro) al menos cada 3 o 4 días o cuando el sensor de la computadora lo indique (OM). Si el combustible de la tachada fuera de dudosa procedencia hacerlo con mayor periodicidad.",
  "Observar periódicamente la saturación del elemento filtrante del Diésel Pro (cambio de color, de claro a Oscuro).",
  "No utilizar para almacenamiento y/o traspasos de combustible envases que hayan contenido derivados de solvente y/o agroquímicos.",
  "Antes de detener el motor luego de realizar una tarea prolongada (trabajo o traslado) se debe mantener el motor en ralentí por 2 min., esto ayuda a mantener la vida útil del turbo (lubricación) ya que el aceite caliente acumulado en la turbina puede carbonizarse, y eso terminará por romper el turbo.",
  "Si el motor está frío (luego del arranque) se debería esperar unos 10 segundos a ralentí antes de comenzar a circular, esto asegurará que la bomba del aceite haya levantado el suficiente aceite y haya comenzado a lubricar todo el motor. No se debe acelerar a fondo ni superar las 2.500/3.000 rpm hasta que el indicador de temperatura del motor de la instrumentación no marque su temperatura normal – unos 90ºC –.",
  "Utilizar siempre Gasoil tipo EURO y no utilizar cortes con Biodiesel que supere el permitido para el tipo de motor (B20 en el caso de UP 3030).",
];

export const MOTOR_SPECS: string[] = [
  "Viscosidad: 1.3 a 4.1 centistokes a 40°C [104°F]",
  "Número de Cetano: 42 mínimo por encima de 0°C [32°F]; 45 mínimo por debajo de 0°C [32°F]",
  "Contenido de Azufre: No exceder de 15 ppm",
  "Azufre Activo: La Corrosión de la Tira de Cobre no debe exceder del rango Número 3 después de 3 horas a 50°C [122°F].",
  "Sedimento de Agua: No exceder del 0.05 por ciento en volumen",
  "Residuo de Carbón: No exceder del 0.35 por ciento de masa en 10 por ciento de volumen de residuo.",
  "Densidad: 0.816 a 0.876 gramos por centímetro cúbico (g/cc) a 15°C [59°F].",
  "Punto de Turbidez: 6°C ó 11°F por debajo de la temperatura ambiente más baja en la cual se espera que opere el combustible.",
  "Ceniza: No exceder del 0.02 por ciento de masa.",
  "Destilación Máxima: 10 por ciento en volumen a 282°C [540°F], máxima 90 por ciento en volumen a 360°C [680°F], máxima 100 por ciento en volumen a 385°C [725°F]. La curva de destilación debe ser uniforme y continua.",
  "Lubricidad: (HFRR o SLBOCLE) HFRR: Diámetro de Marca de Desgaste (WSD) Máximo de 0.52 mm [0.020 in] a 60°C [140°F]. SLBOCLE: Mínimo de 3100 gramos.",
];

export const MOTOR_SPECS_NOTE =
  "Además de los requerimientos arriba descriptos, Cummins Inc. recomienda encarecidamente el uso de combustible con conteos de partículas menores al código ISO 4406 de 18/16/13. El combustible debe mantener los requerimientos apropiados de punto de inflamación para satisfacer las regulaciones locales de seguridad. Las regulaciones regionales, nacionales, o internacionales pueden requerir un contenido de azufre más bajo que el que se lista.";

export function getAttachmentGroup(modelId: string): AttachmentGroup | null {
  return ATTACHMENT_GROUPS.find((g) => g.modelIds.includes(modelId)) ?? null;
}
