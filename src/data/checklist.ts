export const CHECKLIST_QUESTIONS_UNIPORT: string[] = [
  "¿La baliza está en la máquina?",
  "¿La antena está en la máquina?",
  "¿Están atadas las barras y el cuadro?",
  "¿Está el juego de llaves completo?",
  "¿Está la llave corta corriente?",
  "¿Están los retoques de pintura hechos?",
  "¿Está la caja de accesorios en la máquina?",
];

export const CHECKLIST_QUESTIONS_GENERAL: string[] = [
  "¿Están los retoques de pintura hechos?",
  "¿Se guardó el grifo?",
  "¿Están completos los accesorios de la barra?",
  "¿Están completos los accesorios del cuadro?",
  "¿El aceite está completo?",
  "¿El cardán está en la máquina?",
];

/** Las planillas de modelos Uniport (UP y UNIPORT) usan un set de preguntas distinto al resto. */
export function isUniportModel(modelo: string): boolean {
  return modelo.toUpperCase().includes("UNIPORT");
}

export function getChecklistQuestions(modelo: string): string[] {
  return isUniportModel(modelo) ? CHECKLIST_QUESTIONS_UNIPORT : CHECKLIST_QUESTIONS_GENERAL;
}
