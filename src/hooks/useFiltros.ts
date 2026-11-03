"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useDatos } from "@/components/Proveedores";
import { type EstadoFiltros, escribirFiltros, leerFiltros } from "@/lib/filtros-url";
import type { Filtros } from "@/lib/selectors";
import { reemplazarUrl } from "@/lib/url";

type Cambios = Partial<EstadoFiltros> | ((actual: EstadoFiltros) => Partial<EstadoFiltros>);

/** Filtros leídos de la URL. Los cambios reemplazan la entrada del historial (sin recargar). */
export function useFiltros() {
  const params = useSearchParams();
  const pathname = usePathname();
  const { semanas } = useDatos();

  const estado = useMemo(() => leerFiltros(new URLSearchParams(params.toString()), semanas), [params, semanas]);

  const filtros = useMemo<Filtros>(
    () => ({ periodo: estado.periodo, canales: estado.canales, sectores: estado.sectores, estados: estado.estados }),
    [estado],
  );

  // Se parte de la URL actual y no del último render: dos cambios seguidos no se pisan.
  const actualizar = useCallback(
    (cambios: Cambios) => {
      const base = new URLSearchParams(window.location.search);
      const actual = leerFiltros(base, semanas);
      const parcial = typeof cambios === "function" ? cambios(actual) : cambios;
      reemplazarUrl(pathname, escribirFiltros({ ...actual, ...parcial }, base));
    },
    [pathname, semanas],
  );

  const restablecer = useCallback(() => {
    const base = new URLSearchParams(window.location.search);
    for (const clave of ["periodo", "canal", "sector", "estado"]) base.delete(clave);
    reemplazarUrl(pathname, base);
  }, [pathname]);

  return { estado, filtros, actualizar, restablecer };
}

/** Agrega o quita un valor de una dimensión. */
export function alternarValor<K extends "canales" | "sectores" | "estados">(clave: K, valor: EstadoFiltros[K][number]) {
  return (actual: EstadoFiltros): Partial<EstadoFiltros> => {
    const lista = actual[clave] as string[];
    return { [clave]: lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor] } as Partial<EstadoFiltros>;
  };
}
