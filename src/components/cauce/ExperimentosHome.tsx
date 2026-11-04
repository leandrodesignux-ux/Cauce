"use client";

import Link from "next/link";
import { ChipEstado } from "@/components/experimentos/comunes";
import { nombreEtapa } from "@/config/etapas";
import { formatearPuntos } from "@/lib/formato";
import type { Experimento } from "@/lib/tipos";
import { type OnResaltar, propsResaltar } from "./resaltado";

/**
 * Hasta tres experimentos (el destacado primero). Hover o foco resaltan la etapa que atacan en el recorrido;
 * el clic abre su detalle en /experimentos.
 */
export function ExperimentosHome({
  experimentos,
  onResaltar,
}: {
  experimentos: readonly Experimento[];
  onResaltar: OnResaltar;
}) {
  return (
    <ul className="grid gap-3 md:grid-cols-3">
      {experimentos.map((e) => (
        <li key={e.id} className="flex">
          <Link
            href={`/experimentos?exp=${e.id}`}
            {...propsResaltar(onResaltar, { etapas: [e.transicion.desde], origen: "experimento" })}
            className="tarjeta-clicable flex w-full flex-col gap-3 rounded-tile border border-tarjeta-borde bg-tarjeta p-4 shadow-tarjeta"
          >
            <span className="flex items-start justify-between gap-3">
              <span className="font-medium text-balance">{e.nombre}</span>
              <ChipEstado estado={e.estado} />
            </span>
            <span className="mt-auto text-sm text-tinta-2">
              Busca <b className="cifra font-semibold text-tinta">{formatearPuntos(e.prediccionPp)}</b> de {nombreEtapa(e.transicion.desde)} a{" "}
              {nombreEtapa(e.transicion.hacia)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
