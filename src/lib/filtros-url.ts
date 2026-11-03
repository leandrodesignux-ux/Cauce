// Filtros compartibles ↔ search params. Los valores por defecto no se escriben en la URL.

import { CANALES, ESTADOS, SECTORES } from "@/config/dimensiones";
import { type Periodo, type PresetPeriodo, SEMANAS_POR_PRESET, periodoDesdePreset } from "./selectors";
import type { Canal, Estado, Sector } from "./tipos";

export type PeriodoElegido = PresetPeriodo | "personalizado";

export type EstadoFiltros = {
  preset: PeriodoElegido;
  periodo: Periodo;
  canales: Canal[];
  sectores: Sector[];
  estados: Estado[];
  comparar: boolean;
  tabla: boolean;
};

export const PRESET_POR_DEFECTO: PresetPeriodo = "30d";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

function lista<T extends string>(valor: string | null, validos: readonly { id: T; slug?: string }[]): T[] {
  if (!valor) return [];
  const partes = valor.split(",");
  return validos.filter((v) => partes.includes(v.slug ?? v.id)).map((v) => v.id);
}

export function leerFiltros(params: URLSearchParams, semanas: readonly string[]): EstadoFiltros {
  const primera = semanas[0];
  const ultima = semanas[semanas.length - 1];
  const valor = params.get("periodo");

  let preset: PeriodoElegido = PRESET_POR_DEFECTO;
  let periodo = periodoDesdePreset(PRESET_POR_DEFECTO, ultima);
  if (valor && valor in SEMANAS_POR_PRESET) {
    preset = valor as PresetPeriodo;
    periodo = periodoDesdePreset(preset, ultima);
  } else if (valor?.includes("_")) {
    const [desde, hasta] = valor.split("_");
    if (ISO.test(desde) && ISO.test(hasta) && semanas.includes(desde) && semanas.includes(hasta) && desde <= hasta) {
      preset = "personalizado";
      periodo = { desde, hasta };
    }
  }
  // El período anterior tiene que caber en los datos para poder comparar.
  if (periodo.desde < primera) periodo = { ...periodo, desde: primera };

  return {
    preset,
    periodo,
    canales: lista(params.get("canal"), CANALES),
    sectores: lista(params.get("sector"), SECTORES),
    estados: lista(params.get("estado"), ESTADOS),
    comparar: params.get("comparar") === "1",
    tabla: params.get("vista") === "tabla",
  };
}

/** Escribe los filtros sobre `base`, conservando los demás parámetros (etapa, poza…). */
export function escribirFiltros(f: EstadoFiltros, base: URLSearchParams): URLSearchParams {
  const p = new URLSearchParams(base);
  const poner = (clave: string, valor: string | null) => (valor ? p.set(clave, valor) : p.delete(clave));

  poner(
    "periodo",
    f.preset === "personalizado" ? `${f.periodo.desde}_${f.periodo.hasta}` : f.preset === PRESET_POR_DEFECTO ? null : f.preset,
  );
  poner("canal", f.canales.join(",") || null);
  poner("sector", f.sectores.join(",") || null);
  poner("estado", f.estados.map((e) => ESTADOS.find((x) => x.id === e)!.slug).join(",") || null);
  poner("comparar", f.comparar ? "1" : null);
  poner("vista", f.tabla ? "tabla" : null);
  return p;
}

export function contarFiltrosActivos(f: EstadoFiltros): number {
  return (f.preset !== PRESET_POR_DEFECTO ? 1 : 0) + f.canales.length + f.sectores.length + f.estados.length;
}
