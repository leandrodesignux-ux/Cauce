import { CANALES, ESTADOS, SECTORES } from "@/config/dimensiones";
import { ORDEN_ETAPAS } from "@/config/etapas";
import type { BancoDemo } from "./demoVivo";
import type { Estado, EtapaId, Experimento, Fuga, Sector, SemanaEtapa } from "./tipos";

/** Lo mínimo de cada lead para buscarlo desde ⌘K. */
export type LeadIndice = {
  id: string;
  nombre: string;
  sector: Sector;
  estado: Estado;
  score: number;
  /** Para los días sin atención de los fantasmas del home. */
  ultimaActividad: string;
  fugaId?: string;
};

/**
 * Flujo en formato plano: por fila, [semana, canal, sector, estado, ...8 volúmenes],
 * con índices sobre `semanas` y las listas de src/config/dimensiones.ts.
 */
export type DatosCompactos = {
  semanas: string[];
  filas: number[];
  fugas: Fuga[];
  experimentos: Experimento[];
  leads: LeadIndice[];
  /** Mensajes, zonas y prefijos de teléfono reales para combinar en los leads del modo demo en vivo. */
  banco: BancoDemo;
};

const ANCHO_FILA = 4 + ORDEN_ETAPAS.length;

export function expandirFlujo({ semanas, filas }: Pick<DatosCompactos, "semanas" | "filas">): SemanaEtapa[] {
  const resultado: SemanaEtapa[] = [];
  for (let i = 0; i < filas.length; i += ANCHO_FILA) {
    const volumen = {} as Record<EtapaId, number>;
    ORDEN_ETAPAS.forEach((etapa, k) => (volumen[etapa] = filas[i + 4 + k]));
    resultado.push({
      semana: semanas[filas[i]],
      canal: CANALES[filas[i + 1]].id,
      sector: SECTORES[filas[i + 2]].id,
      estado: ESTADOS[filas[i + 3]].id,
      volumen,
    });
  }
  return resultado;
}
