import type { EstadoExperimento } from "@/lib/tipos";

export const ETIQUETA_ESTADO_EXPERIMENTO: Record<EstadoExperimento, string> = {
  diseno: "Diseño",
  en_curso: "En curso",
  leyendo: "Leyendo",
  validado: "Validado",
  refutado: "Refutado",
};
