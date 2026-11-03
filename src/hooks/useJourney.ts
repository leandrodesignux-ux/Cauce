"use client";

import { useMemo } from "react";
import { useDatos } from "@/components/Proveedores";
import { calcularJourney } from "@/lib/journey";
import { useFiltros } from "./useFiltros";

/** Cifras del journey con los filtros de la URL (board, tabla y exportación). */
export function useJourney() {
  const { flujo, fugas } = useDatos();
  const filtrosUrl = useFiltros();
  const journey = useMemo(() => calcularJourney(flujo, fugas, filtrosUrl.filtros), [flujo, fugas, filtrosUrl.filtros]);
  return { journey, ...filtrosUrl };
}
