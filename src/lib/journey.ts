// Cifras del journey board (home) y de su exportación. Puro: todo sale de los selectores.

import { FASES, ORDEN_ETAPAS, TRANSICIONES } from "../config/etapas";
import { NOMBRE_CORTO_POZA, causaVisible } from "../config/pozas";
import { type Filtros, periodoAnterior, tasaTransicion, valorEnRiesgoPorPoza, valorEnRiesgoTotal, volumenPorEtapa } from "./selectors";
import type { EstadoExperimento, EtapaId, Experimento, Fuga, SemanaEtapa } from "./tipos";

export type EtapaJourney = {
  id: EtapaId;
  volumen: number;
  anterior: number;
  /** Tasa de avance a la etapa siguiente (0–1). En Cierre, su proporción sobre Descubrimiento. */
  tasa: number | null;
  /** Delta de la tasa contra el período anterior, en pp. null en Cierre o sin volumen. */
  deltaPp: number | null;
};

export type PozaJourney = {
  id: string;
  /** Índice de la etapa de origen en ORDEN_ETAPAS. */
  desde: number;
  volumen: number;
  valor: number;
  nombre: string;
  causa: string;
};

export type Journey = {
  etapas: EtapaJourney[];
  /** Conversión de cada transición (TRANSICIONES), para la tabla. */
  tasas: (number | null)[];
  deltas: (number | null)[];
  pozas: PozaJourney[];
  valorEnRiesgo: number;
};

export function calcularJourney(flujo: readonly SemanaEtapa[], fugas: readonly Fuga[], filtros: Filtros): Journey {
  const v = volumenPorEtapa(flujo, filtros);
  const a = volumenPorEtapa(flujo, { ...filtros, periodo: periodoAnterior(filtros.periodo) });
  const tasas = TRANSICIONES.map((t) => tasaTransicion(v, t));
  const anteriores = TRANSICIONES.map((t) => tasaTransicion(a, t));
  const deltas = tasas.map((t, i) => (t !== null && anteriores[i] !== null ? (t - anteriores[i]!) * 100 : null));
  const valores = valorEnRiesgoPorPoza(flujo, fugas, filtros);
  const ultima = ORDEN_ETAPAS.length - 1;

  const etapas = ORDEN_ETAPAS.map((id, i) => ({
    id,
    volumen: v[id],
    anterior: a[id],
    tasa: i < ultima ? tasas[i] : v.descubrimiento > 0 ? v[id] / v.descubrimiento : null,
    deltaPp: i < ultima ? deltas[i] : null,
  }));

  const pozas = fugas.map((f, i) => ({
    id: f.id,
    desde: ORDEN_ETAPAS.indexOf(f.desde),
    volumen: valores[i].volumen,
    valor: valores[i].valorMxn,
    nombre: NOMBRE_CORTO_POZA[f.id] ?? f.causa,
    causa: causaVisible(f),
  }));

  return { etapas, tasas, deltas, pozas, valorEnRiesgo: valorEnRiesgoTotal(valores) };
}

export type ValorFase = { fase: (typeof FASES)[number]["id"]; nombre: string; valor: number; proporcion: number };

/** Valor en riesgo agrupado por la fase de la etapa donde se origina cada fuga. */
export function valorPorFase(pozas: readonly PozaJourney[]): ValorFase[] {
  const total = pozas.reduce((s, p) => s + p.valor, 0);
  return FASES.map((f) => {
    const valor = pozas.filter((p) => f.etapas.includes(ORDEN_ETAPAS[p.desde])).reduce((s, p) => s + p.valor, 0);
    return { fase: f.id, nombre: f.nombre, valor, proporcion: total > 0 ? valor / total : 0 };
  });
}

const PRIORIDAD_ESTADO: Record<EstadoExperimento, number> = { leyendo: 0, en_curso: 1, validado: 2, diseno: 3, refutado: 4 };

/**
 * Experimentos del board: primero el más reciente en lectura (el tile destacado), después los demás
 * por estado (en curso, validado, diseño, refutado) y, dentro de cada estado, del más reciente al más viejo.
 */
export function experimentosDelBoard(experimentos: readonly Experimento[], maximo = 6): Experimento[] {
  return [...experimentos]
    .sort((x, y) => PRIORIDAD_ESTADO[x.estado] - PRIORIDAD_ESTADO[y.estado] || y.despliegue.localeCompare(x.despliegue))
    .slice(0, maximo);
}

/** Experimentos activos: desplegados (en curso) o en ventana de lectura. */
export function experimentosActivos(experimentos: readonly Experimento[]): number {
  return experimentos.filter((e) => e.estado === "en_curso" || e.estado === "leyendo").length;
}

/** El experimento destacado: el más reciente en estado "leyendo". */
export function experimentoDestacado(experimentos: readonly Experimento[]): string | null {
  const leyendo = experimentos.filter((e) => e.estado === "leyendo").sort((x, y) => y.despliegue.localeCompare(x.despliegue));
  return leyendo[0]?.id ?? null;
}

type LeadRescatable = { id: string; score: number; fugaId?: string; ultimaActividad: string };

/** Leads pendientes (ni rescatados ni descartados) de una poza, del score más alto al más bajo; a igual score, el más reciente. */
export function pendientesDePoza<T extends LeadRescatable>(
  leads: readonly T[],
  poza: string,
  tratados: (id: string) => boolean,
): T[] {
  return leads
    .filter((l) => l.fugaId === poza && !tratados(l.id))
    .sort((a, b) => b.score - a.score || b.ultimaActividad.localeCompare(a.ultimaActividad));
}

/** Iniciales para el avatar: "José Luis P." → "JP". */
export function iniciales(nombre: string): string {
  const partes = nombre.replace(/\./g, "").split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "";
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

function celda(valor: string | number): string {
  const texto = String(valor);
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

/** CSV del journey con los filtros vigentes: etapas y pozas, con las mismas cifras que el board. */
export function csvJourney(journey: Journey, nombres: Record<EtapaId, string>): string {
  const filas: (string | number)[][] = [["Etapa", "Volumen", "Período anterior", "Tasa de avance (%)", "Delta (pp)"]];
  for (const e of journey.etapas) {
    filas.push([
      nombres[e.id],
      e.volumen,
      e.anterior,
      e.tasa === null ? "" : (e.tasa * 100).toFixed(2),
      e.deltaPp === null ? "" : e.deltaPp.toFixed(2),
    ]);
  }
  filas.push([]);
  filas.push(["Poza", "Etapa de origen", "Perdidos", "Valor estimado (MXN)"]);
  for (const p of journey.pozas) filas.push([p.causa, nombres[ORDEN_ETAPAS[p.desde]], p.volumen, p.valor]);
  return filas.map((f) => f.map(celda).join(",")).join("\n");
}
