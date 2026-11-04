import type { Sector } from "../lib/tipos";

/** Último lunes con datos y fecha de corte (domingo de esa semana). */
export const ULTIMA_SEMANA = "2026-10-26";
export const FECHA_CORTE = "2026-11-01";
export const SEMANAS_DE_DATOS = 26;

/**
 * Supuesto del demo: tipo de cambio fijo para expresar en dólares los montos que el análisis original daba en pesos.
 * Toda la app muestra USD; esta es la única conversión.
 */
export const MXN_POR_USD = 18;

/** Pesos → dólares con el tipo de cambio del demo (sin redondear). */
export function aUsd(mxn: number): number {
  return mxn / MXN_POR_USD;
}

/** Valores iniciales del modelo de pérdida en /fugas. Únicas cifras reales permitidas (docs/DATA.md). */
export const PARAMETROS_PERDIDA_INICIALES = {
  fantasmas: { valor: 643, origen: "Análisis cruzado 2 feb – 4 may 2026" },
  leadACita: { valor: 0.3, origen: "Supuesto del modelo Ghost" },
  citaAContrato: { valor: 0.1, origen: "Supuesto del modelo Ghost" },
  comisionUsd: { valor: Math.round(aUsd(18_000)), origen: "Supuesto del modelo Ghost" },
} as const;

/** Poza que se valúa con el modelo de pérdida, para mostrar el mismo monto en el cauce y en /fugas. */
export const FUGA_MODELO_PERDIDA = "fantasmas";

/**
 * Demo: multiplicador de la comisión promedio por sector (industrial y terreno con ticket más alto,
 * coworking al revés). Se usa para valuar las pozas del cauce.
 */
export const MULTIPLICADOR_COMISION_SECTOR: Record<Sector, number> = {
  oficina: 1,
  industrial: 1.6,
  terreno: 1.9,
  bodega: 1.2,
  local: 0.8,
  coworking: 0.5,
};

export function comisionPorSector(sector: Sector): number {
  return PARAMETROS_PERDIDA_INICIALES.comisionUsd.valor * MULTIPLICADOR_COMISION_SECTOR[sector];
}

/** Bandas de score de intención (docs/PRODUCT.md). */
export const BANDAS_SCORE = { alto: 70, medio: 40 } as const;
