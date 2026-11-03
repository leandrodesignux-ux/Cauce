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

export const ESTADOS: readonly { id: Estado; nombre: string }[] = [
  { id: "CDMX", nombre: "CDMX" },
  { id: "Nuevo León", nombre: "Nuevo León" },
  { id: "Jalisco", nombre: "Jalisco" },
  { id: "Edomex", nombre: "Edomex" },
  { id: "Querétaro", nombre: "Querétaro" },
  { id: "Puebla", nombre: "Puebla" },
  { id: "Yucatán", nombre: "Yucatán" },
];
