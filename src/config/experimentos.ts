import type { EstadoExperimento } from "@/lib/tipos";

export const ETIQUETA_ESTADO_EXPERIMENTO: Record<EstadoExperimento, string> = {
  diseno: "Diseño",
  en_curso: "En curso",
  leyendo: "Leyendo",
  validado: "Validado",
  refutado: "Refutado",
};

/** Nombre visible de cada experimento (los ids y el nombre de los datos no cambian). */
export const NOMBRE_VISIBLE_EXPERIMENTO: Record<string, string> = {
  "busqueda-guiada": "Búsqueda guiada en el listado",
  "spots-no-disponibles": "Alternativas cuando no hay disponibilidad",
  "panel-contacto": "Contacto más simple en desktop",
  "templates-ficha": "Páginas de producto por categoría",
  "ficha-complejo-seo": "Páginas de producto optimizadas para SEO",
  "rescate-fantasmas": "Seguimiento a leads sin atender",
  "validacion-disponibilidad": "Confirmar disponibilidad antes de la visita",
};

/** Nombre corto (chips y espacios estrechos, como el onboarding). */
export const NOMBRE_CORTO_EXPERIMENTO: Record<string, string> = {
  "busqueda-guiada": "Búsqueda guiada",
  "spots-no-disponibles": "Alternativas",
  "panel-contacto": "Contacto simple",
  "templates-ficha": "Páginas por categoría",
  "ficha-complejo-seo": "Páginas SEO",
  "rescate-fantasmas": "Seguimiento a leads",
  "validacion-disponibilidad": "Confirmar disponibilidad",
};

export function nombreExperimento(e: { id: string; nombre: string }): string {
  return NOMBRE_VISIBLE_EXPERIMENTO[e.id] ?? e.nombre;
}
