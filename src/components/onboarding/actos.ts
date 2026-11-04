// Copy y duración de los 3 actos del onboarding. Las cifras no van aquí: salen de useJourney en la escena.

export type Acto = { titulo: string; texto: string; /** Autoplay, en ms. */ duracion: number };

export const ACTOS: readonly Acto[] = [
  {
    titulo: "Así llega la demanda",
    texto: "Cada punto es una persona que entra al sitio. Cauce la sigue paso a paso, de la primera visita al contrato.",
    duracion: 5000,
  },
  {
    titulo: "Y así se pierde",
    texto: "En cada paso, una parte se queda. Cauce agrupa esas fugas y calcula cuánto valen.",
    duracion: 5000,
  },
  {
    titulo: "Lo que se pierde, se puede recuperar",
    texto: "Rescate a los leads con más intención y mida qué experimentos mejoran cada paso.",
    duracion: 5500,
  },
];

/** Nombre corto del experimento para el chip del acto 3; si no hay, se usa el nombre completo. */
export const NOMBRE_CORTO_EXPERIMENTO: Record<string, string> = {
  "busqueda-guiada": "Búsqueda guiada",
  "spots-no-disponibles": "Spots no disponibles",
  "panel-contacto": "Panel de contacto",
  "templates-ficha": "Templates de ficha",
  "ficha-complejo-seo": "Ficha de complejo",
  "rescate-fantasmas": "Rescate de leads",
  "validacion-disponibilidad": "Validación en el bot",
};

/**
 * Curvas y tiempos (references/craft.md de motionsites-web-builder, adaptados).
 * Entrada: blur-rise 0.7 s. Cambio de estado entre actos: 0.4 s. Reduced motion: crossfade de 150 ms.
 */
export const CURVA_ENTRADA = [0.22, 1, 0.36, 1] as const;
export const CURVA_ESTADO = [0.4, 0, 0.2, 1] as const;
export const DURACION_ENTRADA = 0.7;
export const DURACION_ESTADO = 0.4;
export const DURACION_CROSSFADE = 0.15;
export const ESCALONADO_NODOS = 0.08;
export const ESCALONADO_PALABRAS = 0.1;
export const DURACION_CONTEO = 1.2;
