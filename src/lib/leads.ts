// Utilidades de leads para el feed de /fugas (sin React).

import { BANDAS_SCORE, FECHA_CORTE } from "@/config/modelo";
import type { Lead } from "./tipos";

/** Lo que el feed necesita de cada lead (sin la línea de tiempo completa). */
export type LeadFeed = Omit<Lead, "touchpoints">;

export type Banda = "alto" | "medio" | "bajo";
export type RangoAntiguedad = "critica" | "reciente" | "antigua";

/** Ventana crítica: después de 3 días sin respuesta el lead se enfría. */
export const DIAS_VENTANA_CRITICA = 3;

const DIA_MS = 86_400_000;
const FIN_CORTE = Date.parse(`${FECHA_CORTE}T23:59:59Z`);

export function banda(score: number): Banda {
  return score >= BANDAS_SCORE.alto ? "alto" : score >= BANDAS_SCORE.medio ? "medio" : "bajo";
}

/** Días completos sin actividad, contados hasta la fecha de corte de los datos. */
export function diasSinActividad(lead: Pick<Lead, "ultimaActividad">): number {
  return Math.max(0, Math.floor((FIN_CORTE - Date.parse(lead.ultimaActividad)) / DIA_MS));
}

export function rangoAntiguedad(dias: number): RangoAntiguedad {
  return dias <= DIAS_VENTANA_CRITICA ? "critica" : dias <= 14 ? "reciente" : "antigua";
}

export function textoAntiguedad(dias: number): string {
  return dias === 0 ? "Hoy" : dias === 1 ? "Hace 1 día" : `Hace ${dias} días`;
}

export function sinLineaDeTiempo(leads: readonly Lead[]): LeadFeed[] {
  return leads.map((l) => {
    const resto: Partial<Lead> = { ...l };
    delete resto.touchpoints;
    return resto as LeadFeed;
  });
}
