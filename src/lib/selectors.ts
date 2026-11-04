// Selectores puros: todo número que muestra la UI se deriva de acá.

import { ORDEN_ETAPAS, TRANSICIONES } from "../config/etapas";
import { FUGA_MODELO_PERDIDA, PARAMETROS_PERDIDA_INICIALES, comisionPorSector } from "../config/modelo";
import type { Canal, EtapaId, Estado, Fuga, Sector, SemanaEtapa, Transicion } from "./tipos";

// ---------------------------------------------------------------------------
// Fechas y períodos (semanas ISO que empiezan en lunes)

const DIA_MS = 86_400_000;

export function sumarDias(iso: string, dias: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + dias * DIA_MS).toISOString().slice(0, 10);
}

/** Cantidad de semanas entre dos lunes, ambos incluidos. */
export function semanasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(hasta) - Date.parse(desde)) / (7 * DIA_MS)) + 1;
}

/** Rango de lunes, ambos incluidos. */
export type Periodo = { desde: string; hasta: string };

export type PresetPeriodo = "7d" | "30d" | "90d";

export const SEMANAS_POR_PRESET: Record<PresetPeriodo, number> = { "7d": 1, "30d": 4, "90d": 13 };

export function periodoDesdePreset(preset: PresetPeriodo, ultimaSemana: string): Periodo {
  return { desde: sumarDias(ultimaSemana, -7 * (SEMANAS_POR_PRESET[preset] - 1)), hasta: ultimaSemana };
}

/** Período de la misma duración inmediatamente anterior. */
export function periodoAnterior(periodo: Periodo): Periodo {
  const semanas = semanasEntre(periodo.desde, periodo.hasta);
  return { desde: sumarDias(periodo.desde, -7 * semanas), hasta: sumarDias(periodo.desde, -7) };
}

// ---------------------------------------------------------------------------
// Filtros

/** Una lista vacía o ausente significa "todos". */
export type Dimensiones = {
  canales?: readonly Canal[];
  sectores?: readonly Sector[];
  estados?: readonly Estado[];
};

export type Filtros = Dimensiones & { periodo: Periodo };

function incluye<T>(lista: readonly T[] | undefined, valor: T): boolean {
  return !lista || lista.length === 0 || lista.includes(valor);
}

function coincide(fila: SemanaEtapa, dims: Dimensiones): boolean {
  return incluye(dims.canales, fila.canal) && incluye(dims.sectores, fila.sector) && incluye(dims.estados, fila.estado);
}

function enPeriodo(semana: string, periodo: Periodo): boolean {
  return semana >= periodo.desde && semana <= periodo.hasta;
}

// ---------------------------------------------------------------------------
// Volumen y tasas

export type Volumen = Record<EtapaId, number>;

export function volumenVacio(): Volumen {
  return Object.fromEntries(ORDEN_ETAPAS.map((id) => [id, 0])) as Volumen;
}

function acumular(destino: Volumen, origen: Volumen): void {
  for (const id of ORDEN_ETAPAS) destino[id] += origen[id];
}

export function volumenPorEtapa(flujo: readonly SemanaEtapa[], filtros: Filtros): Volumen {
  const total = volumenVacio();
  for (const fila of flujo) {
    if (enPeriodo(fila.semana, filtros.periodo) && coincide(fila, filtros)) acumular(total, fila.volumen);
  }
  return total;
}

/** Tasa de conversión (0–1) de una transición; null si no hubo volumen de origen. */
export function tasaTransicion(volumen: Volumen, t: Transicion): number | null {
  return volumen[t.desde] > 0 ? volumen[t.hacia] / volumen[t.desde] : null;
}

export function tasasPorTransicion(volumen: Volumen): (Transicion & { tasa: number | null })[] {
  return TRANSICIONES.map((t) => ({ ...t, tasa: tasaTransicion(volumen, t) }));
}

export type Delta = { actual: number | null; anterior: number | null; deltaPp: number | null };

export function deltaVsAnterior(flujo: readonly SemanaEtapa[], filtros: Filtros, t: Transicion): Delta {
  const actual = tasaTransicion(volumenPorEtapa(flujo, filtros), t);
  const anterior = tasaTransicion(
    volumenPorEtapa(flujo, { ...filtros, periodo: periodoAnterior(filtros.periodo) }),
    t,
  );
  const deltaPp = actual !== null && anterior !== null ? (actual - anterior) * 100 : null;
  return { actual, anterior, deltaPp };
}

/** Serie semanal de la tasa de una transición: las `semanas` que terminan en `filtros.periodo.hasta`. */
export function serieSemanal(
  flujo: readonly SemanaEtapa[],
  filtros: Filtros,
  t: Transicion,
  semanas = 12,
): { semana: string; tasa: number | null }[] {
  const fin = filtros.periodo.hasta;
  return Array.from({ length: semanas }, (_, i) => {
    const semana = sumarDias(fin, -7 * (semanas - 1 - i));
    const volumen = volumenPorEtapa(flujo, { ...filtros, periodo: { desde: semana, hasta: semana } });
    return { semana, tasa: tasaTransicion(volumen, t) };
  });
}

// ---------------------------------------------------------------------------
// Pozas y valor en riesgo

/** Probabilidad de llegar a Cierre desde una etapa, con las tasas observadas en `volumen`. */
export function probabilidadCierreDesde(volumen: Volumen, etapa: EtapaId): number {
  let probabilidad = 1;
  for (const t of TRANSICIONES.slice(ORDEN_ETAPAS.indexOf(etapa))) {
    probabilidad *= tasaTransicion(volumen, t) ?? 0;
  }
  return probabilidad;
}

export type Poza = { fugaId: string; volumen: number; valorMxn: number };

/**
 * Por cada fuga: volumen perdido = caída de la transición × proporción atribuida a la fuga.
 * Valor = perdidos × probabilidad de cierre si hubieran pasado la transición × comisión del sector.
 */
export function valorEnRiesgoPorPoza(flujo: readonly SemanaEtapa[], fugas: readonly Fuga[], filtros: Filtros): Poza[] {
  const total = volumenVacio();
  const porSector = new Map<Sector, Volumen>();
  for (const fila of flujo) {
    if (!enPeriodo(fila.semana, filtros.periodo) || !coincide(fila, filtros)) continue;
    acumular(total, fila.volumen);
    if (!porSector.has(fila.sector)) porSector.set(fila.sector, volumenVacio());
    acumular(porSector.get(fila.sector)!, fila.volumen);
  }

  return fugas.map((fuga) => {
    // La poza de fantasmas se valúa con el modelo de pérdida (valores iniciales), igual que /fugas.
    if (fuga.id === FUGA_MODELO_PERDIDA) {
      const p = parametrosPerdidaIniciales();
      return { fugaId: fuga.id, volumen: p.fantasmas, valorMxn: modeloPerdida(p).montoMxn };
    }
    const probabilidad = probabilidadCierreDesde(total, fuga.hacia);
    let volumen = 0;
    let valor = 0;
    for (const [sector, v] of porSector) {
      const perdidos = Math.max(0, v[fuga.desde] - v[fuga.hacia]) * fuga.proporcionCaida;
      volumen += perdidos;
      valor += perdidos * probabilidad * comisionPorSector(sector);
    }
    return { fugaId: fuga.id, volumen: Math.round(volumen), valorMxn: Math.round(valor) };
  });
}

export function valorEnRiesgoTotal(pozas: readonly Poza[]): number {
  return pozas.reduce((s, p) => s + p.valorMxn, 0);
}

// ---------------------------------------------------------------------------
// Experimentos

/**
 * Efecto observado en puntos porcentuales: tasa en la ventana de lectura (semanas ventana[0]..ventana[1]
 * después del despliegue) menos la tasa de las 6 semanas previas. null si la ventana todavía no terminó.
 */
export function efectoObservadoPp(
  flujo: readonly SemanaEtapa[],
  t: Transicion,
  despliegue: string,
  ventana: readonly [number, number],
  ultimaSemana: string,
): number | null {
  const lectura = { desde: sumarDias(despliegue, 7 * ventana[0]), hasta: sumarDias(despliegue, 7 * ventana[1]) };
  if (lectura.hasta > ultimaSemana) return null;
  const base = { desde: sumarDias(despliegue, -42), hasta: sumarDias(despliegue, -7) };
  const despues = tasaTransicion(volumenPorEtapa(flujo, { periodo: lectura }), t);
  const antes = tasaTransicion(volumenPorEtapa(flujo, { periodo: base }), t);
  return despues !== null && antes !== null ? (despues - antes) * 100 : null;
}

// ---------------------------------------------------------------------------
// Modelo de pérdida (/fugas)

export type ParametrosPerdida = {
  fantasmas: number;
  leadACita: number; // 0–1
  citaAContrato: number; // 0–1
  comisionMxn: number;
};

export type ResultadoPerdida = {
  citas: number;
  contratos: number;
  /** fantasmas × lead→cita × cita→contrato × comisión, redondeado al peso. */
  montoMxn: number;
};

export function parametrosPerdidaIniciales(): ParametrosPerdida {
  const P = PARAMETROS_PERDIDA_INICIALES;
  return {
    fantasmas: P.fantasmas.valor,
    leadACita: P.leadACita.valor,
    citaAContrato: P.citaAContrato.valor,
    comisionMxn: P.comisionMxn.valor,
  };
}

export function modeloPerdida(p: ParametrosPerdida): ResultadoPerdida {
  const citas = p.fantasmas * p.leadACita;
  const contratos = citas * p.citaAContrato;
  return { citas, contratos, montoMxn: Math.round(contratos * p.comisionMxn) };
}

// ---------------------------------------------------------------------------
// Recorrido (home): métrica de fase, avance de etapa y simulador de mejora

/**
 * Métrica de una fase del recorrido (etapas agrupadas, en orden): volumen de la primera etapa de la fase
 * siguiente sobre el de la primera etapa de esta fase. En la última fase: su última etapa sobre la primera
 * (cierre / visita). null si no hay volumen de origen.
 */
export function tasaDeFase(volumen: Volumen, fases: readonly { etapas: readonly EtapaId[] }[], indice: number): number | null {
  const fase = fases[indice];
  const origen = volumen[fase.etapas[0]];
  if (origen <= 0) return null;
  const siguiente = fases[indice + 1];
  return (siguiente ? volumen[siguiente.etapas[0]] : volumen[fase.etapas[fase.etapas.length - 1]]) / origen;
}

/** Cuántos de una etapa pasan a la siguiente y cuántos se quedan. null en la última etapa. */
export function avanceDeEtapa(volumen: Volumen, etapa: EtapaId): { avanzan: number; seQuedan: number } | null {
  const siguiente = ORDEN_ETAPAS[ORDEN_ETAPAS.indexOf(etapa) + 1];
  if (!siguiente) return null;
  const avanzan = Math.min(volumen[siguiente], volumen[etapa]);
  return { avanzan, seQuedan: volumen[etapa] - avanzan };
}

export type SimulacionMejora = {
  /** Leads extra que pasan la transición: volumen[desde] × puntos / 100. */
  extra: number;
  /** Probabilidad de cerrar una vez en `hacia`, con las tasas observadas. */
  probabilidad: number;
  cierres: number;
  mxn: number;
};

/**
 * Si la transición mejora `puntos` puntos porcentuales: volumen[desde] × (puntos / 100) ×
 * probabilidadCierreDesde(volumen, hacia) cierres extra en el período, por la comisión en MXN.
 */
export function simularMejora(volumen: Volumen, t: Transicion, puntos: number, comisionMxn: number): SimulacionMejora {
  const extra = volumen[t.desde] * (puntos / 100);
  const probabilidad = probabilidadCierreDesde(volumen, t.hacia);
  const cierres = extra * probabilidad;
  return { extra, probabilidad, cierres, mxn: Math.round(cierres * comisionMxn) };
}
