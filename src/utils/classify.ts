import type { ItemType } from "../types";

const EXCLUDE_PATTERNS = [/MANUAL/, /LLAVE/, /ENGANCHE/];

export function classifyItem(desc: string): ItemType {
  const d = desc.toUpperCase();
  if (EXCLUDE_PATTERNS.some((re) => re.test(d))) return "generic";
  if (/TAPA/.test(d)) return "tapa";
  if (/BOQUILLA|PICO/.test(d)) return "boquilla";
  if (/FILTRO/.test(d)) return "filtro";
  return "generic";
}
