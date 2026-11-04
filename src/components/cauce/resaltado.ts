import type { EtapaId } from "@/lib/tipos";

/**
 * Resaltado compartido del Recorrido (estado local de VistaCauce, no va en la URL).
 * - etapa: [etapa, siguiente]. La primera se eleva y muestra su avance; la siguiente lleva borde azul suave.
 * - fuga: [desde, hacia], con borde coral punteado.
 * - fase: sus etapas.
 * - experimento: la etapa de origen de su transición.
 */
export type Resaltado = { etapas: EtapaId[]; origen: "etapa" | "fuga" | "experimento" | "fase" } | null;

export type OnResaltar = (r: Resaltado) => void;

/** Props de hover y foco que fijan un resaltado al entrar y lo limpian al salir. */
export function propsResaltar(onResaltar: OnResaltar, r: Exclude<Resaltado, null>) {
  return {
    onMouseEnter: () => onResaltar(r),
    onMouseLeave: () => onResaltar(null),
    onFocus: () => onResaltar(r),
    onBlur: () => onResaltar(null),
  };
}
