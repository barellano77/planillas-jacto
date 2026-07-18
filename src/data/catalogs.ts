export type CatalogItem = {
  code: string;
  desc: string;
};

export type CatalogItemType = "boquilla" | "tapa" | "filtro";

export const BOQUILLAS_CATALOG: CatalogItem[] = [
  { code: "1264777", desc: "BOQUILLAS JAC-075 ROSA" },
  { code: "1265431", desc: "BOQUILLAS JAC-03 AZUL" },
  { code: "1265351", desc: "BOQUILLAS JAC-015 VERDE" },
  { code: "1264787", desc: "BOQUILLAS JAC-01 NARANJA" },
  { code: "1265412", desc: "BOQUILLAS JAC-025 LILA" },
  { code: "1265403", desc: "BOQUILLAS JAC-02 AMARILLAS" },
  { code: "1259155", desc: "BOQUILLAS JCI-03 AZUL" },
  { code: "1259153", desc: "BOQUILLAS JCI-02 AMARILLAS" },
  { code: "1259154", desc: "BOQUILLAS JCI-025 LILAS" },
  { code: "1259123", desc: "BOQUILLAS JCI-075 ROSA" },
  { code: "1259150", desc: "BOQUILLAS JCI-015 VERDE" },
  { code: "1259124", desc: "BOQUILLAS JCI-01 NARANJA" },
  { code: "1259157", desc: "BOQUILLAS JCI-035 MARRON" },
];

export const TAPAS_CATALOG: CatalogItem[] = [
  { code: "1179282", desc: "TAPAS MARRON (ATR-JCI)" },
  { code: "1233011", desc: "TAPAS ROJA (JAC)" },
];

export const FILTROS_CATALOG: CatalogItem[] = [
  { code: "439067", desc: "FILTRO MALLA 50 NEGRO/ROJO" },
  { code: "439083", desc: "FILTRO MALLA 50 NEGRO/NEGRO" },
  { code: "440156", desc: "FILTRO MALLA 80 VERDE/NEGRO" },
  { code: "440164", desc: "FILTRO MALLA 80 VERDE/ROJO" },
  { code: "873786", desc: "FILTRO MALLA 100 GRIS/ROJO" },
];
