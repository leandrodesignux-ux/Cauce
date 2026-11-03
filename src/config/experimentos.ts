import type { EstadoExperimento } from "@/lib/tipos";

export const ETIQUETA_ESTADO_EXPERIMENTO: Record<EstadoExperimento, string> = {
  diseno: "Diseño",
  en_curso: "En curso",
  leyendo: "Leyendo",
  validado: "Validado",
  refutado: "Refutado",
};

/** Clases del chip de estado: nunca solo color, siempre con la etiqueta. */
export const TONO_ESTADO_EXPERIMENTO: Record<EstadoExperimento, string> = {
  diseno: "border-linea-fuerte text-niebla",
  en_curso: "border-cauce text-cauce",
  leyendo: "border-laton text-laton",
  validado: "border-cauce bg-cauce text-sobre-cauce",
  refutado: "border-oxido text-oxido",
};
