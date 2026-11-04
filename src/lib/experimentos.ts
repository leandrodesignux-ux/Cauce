// Fechas y situación de un experimento respecto de "hoy" (la fecha de corte de los datos).

import { FECHA_CORTE } from "@/config/modelo";
import { sumarDias } from "./selectors";
import type { Experimento } from "./tipos";

/** "Hoy" para el registro: la fecha de corte de los datos demo, para que estados y fechas sean coherentes. */
export const HOY = FECHA_CORTE;

export function inicioLectura(e: Experimento): string {
  return sumarDias(e.despliegue, 7 * e.ventanaSemanas[0]);
}

/** Último día (domingo) de la ventana de lectura. */
export function finLectura(e: Experimento): string {
  return sumarDias(e.despliegue, 7 * e.ventanaSemanas[1] + 6);
}

const DIA_MS = 86_400_000;
const dias = (desde: string, hasta: string) => Math.round((Date.parse(hasta) - Date.parse(desde)) / DIA_MS);

export type Situacion = { texto: string; fase: "antes" | "ejecucion" | "lectura" | "cerrada" };

export function situacion(e: Experimento, hoy = HOY): Situacion {
  if (hoy < e.despliegue) {
    const semanas = Math.ceil(dias(hoy, e.despliegue) / 7);
    return { fase: "antes", texto: `Despliegue en ${semanas} ${semanas === 1 ? "semana" : "semanas"}` };
  }
  if (hoy < inicioLectura(e)) {
    const semanas = Math.ceil(dias(hoy, inicioLectura(e)) / 7);
    return { fase: "ejecucion", texto: `Se puede leer en ${semanas} ${semanas === 1 ? "semana" : "semanas"}` };
  }
  if (hoy <= finLectura(e)) return { fase: "lectura", texto: "En ventana de lectura" };
  return { fase: "cerrada", texto: "Ventana de lectura cerrada" };
}

// ---------------------------------------------------------------------------
// Lectura simulada (modo demo en vivo)

/** Semanas simuladas: las `n` que siguen a la última semana con datos. */
export function semanasSimuladas(ultimaSemana: string, n: number): string[] {
  return Array.from({ length: n }, (_, k) => sumarDias(ultimaSemana, 7 * (k + 1)));
}

/**
 * Despliegue contra el que se mide la lectura simulada: el real si su ventana todavía no empezó; si ya pasó,
 * se corre para que la ventana empiece en la primera semana simulada (la lectura simulada siempre es futura).
 */
export function despliegueDeLectura(e: Experimento, ultimaSemana: string): string {
  return inicioLectura(e) > ultimaSemana ? e.despliegue : sumarDias(ultimaSemana, 7 - 7 * e.ventanaSemanas[0]);
}

/** Qué parte de la ventana de lectura (0–1) cubren los datos con `n` semanas simuladas. */
export function progresoLectura(e: Experimento, n: number, ultimaSemana: string): number {
  const despliegue = despliegueDeLectura(e, ultimaSemana);
  const [v0, v1] = e.ventanaSemanas;
  const hasta = sumarDias(ultimaSemana, 7 * n);
  let cubiertas = 0;
  for (let k = v0; k <= v1; k++) if (sumarDias(despliegue, 7 * k) <= hasta) cubiertas++;
  return cubiertas / (v1 - v0 + 1);
}
