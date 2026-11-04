import type { EtapaId, Transicion } from "../lib/tipos";

export const DEFINICION_PENDIENTE = "Definición pendiente de confirmar";

export const ETAPAS: readonly { id: EtapaId; nombre: string; definicion: string }[] = [
  { id: "descubrimiento", nombre: "Descubrimiento", definicion: "Sesiones por canal: SEO, Paid (Search/DSA), Directo, Referidos, Social." },
  { id: "exploracion", nombre: "Exploración", definicion: "Búsqueda y listado." },
  { id: "evaluacion", nombre: "Evaluación", definicion: "Página de producto del espacio o del complejo." },
  { id: "contacto", nombre: "Contacto", definicion: "Formulario, WhatsApp/chatbot o llamada." },
  { id: "calificacion", nombre: "Calificación", definicion: "Score de intención y nivel de lead (L0 → L2; prioridad P1 / P2+)." },
  { id: "asignacion", nombre: "Asignación", definicion: "El lead llega a un asesor." },
  { id: "visita", nombre: "Visita", definicion: "Agendada y luego realizada." },
  { id: "cierre", nombre: "Cierre", definicion: "LOI o contrato firmado." },
];

export const ORDEN_ETAPAS: readonly EtapaId[] = ETAPAS.map((e) => e.id);

export const TRANSICIONES: readonly Transicion[] = ORDEN_ETAPAS.slice(0, -1).map((desde, i) => ({
  desde,
  hacia: ORDEN_ETAPAS[i + 1],
}));

/** Fases del journey board: cada una es una tarjeta con sus etapas en orden. */
export const FASES: readonly { id: "atraer" | "convertir" | "cerrar"; nombre: string; descripcion: string; etapas: readonly EtapaId[] }[] = [
  { id: "atraer", nombre: "Atraer", descripcion: "Del canal a la página de producto", etapas: ["descubrimiento", "exploracion", "evaluacion"] },
  { id: "convertir", nombre: "Convertir", descripcion: "Del contacto al asesor", etapas: ["contacto", "calificacion", "asignacion"] },
  { id: "cerrar", nombre: "Cerrar", descripcion: "De la visita al contrato", etapas: ["visita", "cierre"] },
];

export function nombreEtapa(id: EtapaId): string {
  return ETAPAS.find((e) => e.id === id)!.nombre;
}

// Se muestran en el tooltip de Calificación hasta que el equipo las valide.
export const NIVELES_LEAD = [
  { id: "L0", definicion: DEFINICION_PENDIENTE },
  { id: "L1", definicion: DEFINICION_PENDIENTE },
  { id: "L2", definicion: DEFINICION_PENDIENTE },
] as const;

export const PRIORIDADES = [
  { id: "P1", definicion: DEFINICION_PENDIENTE },
  { id: "P2+", definicion: DEFINICION_PENDIENTE },
] as const;
