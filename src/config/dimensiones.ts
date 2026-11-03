import type { Canal, Estado, Sector } from "../lib/tipos";

export const CANALES: readonly { id: Canal; nombre: string }[] = [
  { id: "seo", nombre: "SEO" },
  { id: "paid", nombre: "Paid" },
  { id: "directo", nombre: "Directo" },
  { id: "referidos", nombre: "Referidos" },
  { id: "social", nombre: "Social" },
];

export const SECTORES: readonly { id: Sector; nombre: string }[] = [
  { id: "oficina", nombre: "Oficina" },
  { id: "industrial", nombre: "Industrial" },
  { id: "local", nombre: "Local" },
  { id: "bodega", nombre: "Bodega" },
  { id: "coworking", nombre: "Coworking" },
  { id: "terreno", nombre: "Terreno" },
];

/** slug: forma del estado en la URL. */
export const ESTADOS: readonly { id: Estado; nombre: string; slug: string }[] = [
  { id: "CDMX", nombre: "CDMX", slug: "cdmx" },
  { id: "Nuevo León", nombre: "Nuevo León", slug: "nuevo-leon" },
  { id: "Jalisco", nombre: "Jalisco", slug: "jalisco" },
  { id: "Edomex", nombre: "Edomex", slug: "edomex" },
  { id: "Querétaro", nombre: "Querétaro", slug: "queretaro" },
  { id: "Puebla", nombre: "Puebla", slug: "puebla" },
  { id: "Yucatán", nombre: "Yucatán", slug: "yucatan" },
];
