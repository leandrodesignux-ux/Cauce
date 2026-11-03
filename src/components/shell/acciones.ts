"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { ETAPAS } from "@/config/etapas";
import { useJourney } from "@/hooks/useJourney";
import { csvJourney } from "@/lib/journey";
import type { EtapaId } from "@/lib/tipos";

const NOMBRES = Object.fromEntries(ETAPAS.map((e) => [e.id, e.nombre])) as Record<EtapaId, string>;

/** Acciones del home que comparten el rail, la barra móvil y el encabezado del board. */
export function useAccionesCauce() {
  const { journey, estado, actualizar } = useJourney();

  const alternarComparar = useCallback(() => actualizar((a) => ({ comparar: !a.comparar })), [actualizar]);
  const alternarTabla = useCallback(() => actualizar((a) => ({ tabla: !a.tabla })), [actualizar]);

  const exportar = useCallback(() => {
    // BOM para que Excel lea los acentos.
    const blob = new Blob(["﻿" + csvJourney(journey, NOMBRES)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `cauce-journey-${estado.periodo.desde}-a-${estado.periodo.hasta}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
    toast.dismiss();
    toast("Se descargó el journey en CSV con los filtros vigentes.", { duration: 5000 });
  }, [journey, estado.periodo]);

  return { comparar: estado.comparar, tabla: estado.tabla, alternarComparar, alternarTabla, exportar };
}
