// Copy y duración de los 3 actos del onboarding. Las cifras llegan ya formateadas (salen de los selectores).

export type CifrasActos = { llegaron: string; firmaron: string; fantasmas: string; contratos: string };

export type Acto = { titulo: (c: CifrasActos) => string; texto: (c: CifrasActos) => string; /** Autoplay, en ms. */ duracion: number };

export const ACTOS: readonly Acto[] = [
  {
    titulo: (c) => `${c.llegaron} llegaron. ${c.firmaron} firmaron.`,
    texto: () => "Cauce sigue a cada persona desde que entra al sitio hasta que firma, para ver en qué paso se queda el resto.",
    duracion: 6500,
  },
  {
    titulo: () => "El resto se queda en el camino.",
    texto: () => "Cauce agrupa a los que se pierden en fugas y calcula cuánto valen.",
    duracion: 6500,
  },
  {
    titulo: () => "Una parte se puede recuperar.",
    texto: (c) =>
      `Rescatar los ${c.fantasmas} leads sin atender equivale a ≈${c.contratos} contratos. Los experimentos atacan cada fuga y se miden con datos.`,
    duracion: 7000,
  },
];

/** Etiquetas bajo cada cifra formada por las partículas. */
export const ETIQUETA_CIFRA = {
  sesiones: "sesiones",
  cierres: "cierres",
  riesgo: "en riesgo",
  contratos: "contratos si se rescatan",
} as const;

/** Nombre corto del experimento para el chip del acto 3 (config/experimentos.ts). */
export { NOMBRE_CORTO_EXPERIMENTO } from "@/config/experimentos";

/** Curvas y tiempos (craft.md de motionsites-web-builder, adaptados). */
export const CURVA_ENTRADA = [0.22, 1, 0.36, 1] as const;
export const CURVA_ESTADO = [0.4, 0, 0.2, 1] as const;
/** Título palabra por palabra: 0.7 s, 90 ms de escalonado, y 24 px, blur 10 px → 0. */
export const DURACION_PALABRA = 0.7;
export const ESCALONADO_PALABRAS = 0.09;
/** El texto entra 0.25 s después del título; el título viejo sale en 0.25 s con blur 6 px. */
export const RETRASO_TEXTO = 0.25;
export const DURACION_SALIDA = 0.25;
export const DURACION_CROSSFADE = 0.15;
/** Cierre "Ver mi recorrido": explosión y fade del overlay. */
export const DURACION_CIERRE = 0.6;
