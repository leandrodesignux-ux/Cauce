"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ORDEN_ETAPAS } from "@/config/etapas";
import type { EtapaId } from "@/lib/tipos";
import { reemplazarUrl } from "@/lib/url";

export type Seleccion = { tipo: "etapa"; etapa: EtapaId } | { tipo: "transicion"; desde: EtapaId; hacia: EtapaId } | null;

function esEtapa(valor: string | undefined): valor is EtapaId {
  return !!valor && (ORDEN_ETAPAS as readonly string[]).includes(valor);
}

export function claveSeleccion(s: Seleccion): string | null {
  if (!s) return null;
  return s.tipo === "etapa" ? `etapa:${s.etapa}` : `transicion:${s.desde}`;
}

/** Etapa o transición seleccionada en el cauce: vive en la URL (?etapa=… o ?transicion=desde-hacia). */
export function useSeleccion() {
  const params = useSearchParams();
  const pathname = usePathname();

  const seleccion = useMemo<Seleccion>(() => {
    const etapa = params.get("etapa") ?? undefined;
    if (esEtapa(etapa)) return { tipo: "etapa", etapa };
    const [desde, hacia] = (params.get("transicion") ?? "").split("-");
    if (esEtapa(desde) && esEtapa(hacia) && ORDEN_ETAPAS.indexOf(hacia) === ORDEN_ETAPAS.indexOf(desde) + 1) {
      return { tipo: "transicion", desde, hacia };
    }
    return null;
  }, [params]);

  const seleccionar = useCallback(
    (s: Seleccion) => {
      const base = new URLSearchParams(window.location.search);
      base.delete("etapa");
      base.delete("transicion");
      if (s?.tipo === "etapa") base.set("etapa", s.etapa);
      if (s?.tipo === "transicion") base.set("transicion", `${s.desde}-${s.hacia}`);
      reemplazarUrl(pathname, base);
    },
    [pathname],
  );

  return { seleccion, seleccionar };
}
