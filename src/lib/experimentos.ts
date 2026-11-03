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
