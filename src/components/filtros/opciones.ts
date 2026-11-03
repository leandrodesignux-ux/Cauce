import { CANALES, ESTADOS, SECTORES } from "@/config/dimensiones";
import type { PeriodoElegido } from "@/lib/filtros-url";

export const OPCIONES_PERIODO: readonly { id: PeriodoElegido; corto: string; medio: string; largo: string }[] = [
  { id: "7d", corto: "7 d", medio: "7 días", largo: "Últimos 7 días" },
  { id: "30d", corto: "30 d", medio: "30 días", largo: "Últimos 30 días" },
  { id: "90d", corto: "90 d", medio: "90 días", largo: "Últimos 90 días" },
];

export const DIMENSIONES = [
  { clave: "canales", nombre: "Canal", opciones: CANALES },
  { clave: "sectores", nombre: "Sector", opciones: SECTORES },
  { clave: "estados", nombre: "Estado", opciones: ESTADOS },
] as const;

export type ClaveDimension = (typeof DIMENSIONES)[number]["clave"];

