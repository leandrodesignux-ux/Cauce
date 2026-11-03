// Carga de datos en el servidor. El flujo viaja compactado al cliente una sola vez (desde el layout raíz).

import experimentosJson from "@/data/experimentos.json";
import flujoJson from "@/data/flujo.json";
import fugasJson from "@/data/fugas.json";
import leadsJson from "@/data/leads.json";
import { CANALES, ESTADOS, SECTORES } from "@/config/dimensiones";
import { ORDEN_ETAPAS } from "@/config/etapas";
import type { DatosCompactos, LeadIndice } from "./datos-cliente";
import type { Experimento, Fuga, Lead, SemanaEtapa } from "./tipos";

const flujo = flujoJson as unknown as SemanaEtapa[];
const leads = leadsJson as unknown as Lead[];

export const fugas = fugasJson as unknown as Fuga[];
export const experimentos = experimentosJson as unknown as Experimento[];

export function obtenerLeads(): Lead[] {
  return leads;
}

export function datosCompactos(): DatosCompactos {
  const semanas = [...new Set(flujo.map((f) => f.semana))].sort();
  const indiceSemana = new Map(semanas.map((s, i) => [s, i]));
  const indiceCanal = new Map(CANALES.map((c, i) => [c.id, i]));
  const indiceSector = new Map(SECTORES.map((s, i) => [s.id, i]));
  const indiceEstado = new Map(ESTADOS.map((e, i) => [e.id, i]));

  const filas: number[] = [];
  for (const f of flujo) {
    filas.push(indiceSemana.get(f.semana)!, indiceCanal.get(f.canal)!, indiceSector.get(f.sector)!, indiceEstado.get(f.estado)!);
    for (const etapa of ORDEN_ETAPAS) filas.push(f.volumen[etapa]);
  }

  const indiceLeads: LeadIndice[] = leads.map((l) => ({
    id: l.id,
    nombre: l.nombre,
    sector: l.sector,
    estado: l.estado,
    score: l.score,
    ultimaActividad: l.ultimaActividad,
    ...(l.fugaId ? { fugaId: l.fugaId } : {}),
  }));

  return { semanas, filas, fugas, experimentos, leads: indiceLeads };
}
