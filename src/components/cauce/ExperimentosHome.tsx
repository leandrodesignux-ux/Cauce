"use client";

import Link from "next/link";
import { ChipEstado } from "@/components/experimentos/comunes";
import { nombreEtapa } from "@/config/etapas";
import { formatearPuntos } from "@/lib/formato";
import type { EtapaId, Experimento } from "@/lib/tipos";

/**
 * Hasta tres experimentos (el destacado primero). Hover o foco resaltan la etapa que atacan en el recorrido;
 * el clic abre su detalle en /experimentos.
 */
export function ExperimentosHome({
  experimentos,
  onResaltar,
}: {
  experimentos: readonly Experimento[];
  onResaltar: (etapa: EtapaId | null) => void;
}) {
  return (
    <ul className="grid gap-3 md:grid-cols-3">
      {experimentos.map((e) => (
        <li key={e.id} className="flex">
          <Link
            href={`/experimentos?exp=${e.id}`}
            onMouseEnter={() => onResaltar(e.transicion.desde)}
            onMouseLeave={() => onResaltar(null)}
            onFocus={() => onResaltar(e.transicion.desde)}
            onBlur={() => onResaltar(null)}
            className="flex w-full flex-col gap-3 rounded-tile border border-tarjeta-borde bg-tarjeta p-4 shadow-tarjeta outline-2 outline-offset-0 outline-transparent motion-safe:transition-[outline-color,transform] motion-safe:duration-(--duracion-presion) motion-safe:ease-salida motion-safe:active:scale-[0.98] hover:outline-azul"
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
