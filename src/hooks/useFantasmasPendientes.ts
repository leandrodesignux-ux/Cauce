"use client";

import { useMemo } from "react";
import { useDatos } from "@/components/Proveedores";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import { pendientesDePoza } from "@/lib/journey";
import { useSesion } from "@/lib/stores";

/** Leads sin atender (fuga del modelo de pérdida) todavía pendientes, del score más alto al más bajo. */
export function useFantasmasPendientes() {
  const { leads } = useDatos();
  const rescatados = useSesion((s) => s.rescatados);
  const descartados = useSesion((s) => s.descartados);
  return useMemo(
    () => pendientesDePoza(leads, FUGA_MODELO_PERDIDA, (id) => !!rescatados[id] || !!descartados[id]),
    [leads, rescatados, descartados],
  );
}
