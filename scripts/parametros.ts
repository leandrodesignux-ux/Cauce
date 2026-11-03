// Pesos de muestreo del generador demo (docs/DATA.md).

import type { Canal, Estado, Sector } from "../src/lib/tipos";

export const PESO_CANAL: Record<Canal, number> = { seo: 42, paid: 28, directo: 18, referidos: 7, social: 5 };

export const PESO_SECTOR: Record<Sector, number> = {
  oficina: 34,
  industrial: 22,
  local: 18,
  bodega: 12,
  coworking: 8,
  terreno: 6,
};

export const PESO_ESTADO: Record<Estado, number> = {
  CDMX: 38,
  "Nuevo León": 16,
  Jalisco: 14,
  Edomex: 12,
  Querétaro: 10,
  Puebla: 6,
  Yucatán: 4,
};
