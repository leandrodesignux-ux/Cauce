"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { Banda, RangoAntiguedad } from "@/lib/leads";
import { leerPagina } from "@/lib/paginacion";
import { reemplazarUrl } from "@/lib/url";

export type Bandeja = "pendientes" | "rescatados" | "descartados";

export type FiltrosFugas = {
  poza: string;
  banda: Banda | null;
  antiguedad: RangoAntiguedad | null;
  bandeja: Bandeja;
  lead: string | null;
  /** Página del feed (10 por página), desde 1. */
  pagina: number;
};

const BANDAS: Banda[] = ["alto", "medio", "bajo"];
const RANGOS: RangoAntiguedad[] = ["critica", "reciente", "antigua"];
const BANDEJAS: Bandeja[] = ["pendientes", "rescatados", "descartados"];

/**
 * Filtros del feed de /fugas, en la URL para que se puedan compartir. Cambiar fuga, bandeja o un filtro
 * vuelve a la página 1 (salvo que el mismo cambio fije la página).
 */
export function useFiltrosFugas(pozas: readonly string[], porDefecto: string) {
  const params = useSearchParams();
  const pathname = usePathname();

  const filtros = useMemo<FiltrosFugas>(() => {
    const poza = params.get("poza");
    const banda = params.get("banda") as Banda | null;
    const antiguedad = params.get("antiguedad") as RangoAntiguedad | null;
    const bandeja = params.get("bandeja") as Bandeja | null;
    return {
      poza: poza && pozas.includes(poza) ? poza : porDefecto,
      banda: banda && BANDAS.includes(banda) ? banda : null,
      antiguedad: antiguedad && RANGOS.includes(antiguedad) ? antiguedad : null,
      bandeja: bandeja && BANDEJAS.includes(bandeja) ? bandeja : "pendientes",
      lead: params.get("lead"),
      pagina: leerPagina(params.get("pagina")),
    };
  }, [params, pozas, porDefecto]);

  const actualizar = useCallback(
    (cambios: Partial<FiltrosFugas>) => {
      const base = new URLSearchParams(window.location.search);
      const poner = (clave: string, valor: string | null | undefined) => (valor ? base.set(clave, valor) : base.delete(clave));
      if ("poza" in cambios) poner("poza", cambios.poza);
      if ("banda" in cambios) poner("banda", cambios.banda);
      if ("antiguedad" in cambios) poner("antiguedad", cambios.antiguedad);
      if ("bandeja" in cambios) poner("bandeja", cambios.bandeja === "pendientes" ? null : cambios.bandeja);
      if ("lead" in cambios) poner("lead", cambios.lead);
      const reinicia = "poza" in cambios || "bandeja" in cambios || "banda" in cambios || "antiguedad" in cambios;
      if ("pagina" in cambios) poner("pagina", cambios.pagina && cambios.pagina > 1 ? String(cambios.pagina) : null);
      else if (reinicia) base.delete("pagina");
      reemplazarUrl(pathname, base);
    },
    [pathname],
  );

  return { filtros, actualizar };
}
