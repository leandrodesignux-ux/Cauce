"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDatos } from "@/components/Proveedores";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import { formatearEntero } from "@/lib/formato";
import { iniciales, pendientesDePoza } from "@/lib/journey";
import { DIAS_VENTANA_CRITICA, diasSinActividad } from "@/lib/leads";
import { useSesion } from "@/lib/stores";

const VISIBLES = 7;

/** Fantasmas pendientes con mayor score, del store de sesión. */
export function useFantasmasPendientes() {
  const { leads } = useDatos();
  const rescatados = useSesion((s) => s.rescatados);
  const descartados = useSesion((s) => s.descartados);
  return useMemo(
    () => pendientesDePoza(leads, FUGA_MODELO_PERDIDA, (id) => !!rescatados[id] || !!descartados[id]),
    [leads, rescatados, descartados],
  );
}

/** "Por rescatar": avatares de los 7 fantasmas pendientes con mayor score; el badge son los días sin atención. */
export function TiraFantasmas() {
  const pendientes = useFantasmasPendientes();
  if (pendientes.length === 0) return null;
  const resto = pendientes.length - VISIBLES;

  return (
    <div
      role="group"
      aria-label="Fantasmas por rescatar"
      className="flex max-w-full items-center gap-3.5 overflow-x-auto rounded-full border border-tarjeta-borde bg-tarjeta py-2 pr-4.5 pl-2.5 max-md:w-full"
    >
      <span className="text-xs whitespace-nowrap text-tinta-2">Por rescatar</span>
      <ul className="flex pb-1.5">
        {pendientes.slice(0, VISIBLES).map((l) => {
          const dias = diasSinActividad(l);
          const urge = dias > DIAS_VENTANA_CRITICA;
          const descripcion = `${l.nombre} · score ${l.score} · ${dias} ${dias === 1 ? "día" : "días"} sin atención`;
          return (
            <li key={l.id} className="-ml-1.5 first:ml-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={`/fugas?poza=${FUGA_MODELO_PERDIDA}&lead=${l.id}`}
                    aria-label={`${descripcion}. Abrir el lead.`}
                    className="relative grid size-10 place-items-center rounded-full border-2 border-tarjeta bg-azul-suave text-xs font-semibold text-azul-texto"
                  >
                    {iniciales(l.nombre)}
                    <span
                      aria-hidden
                      className={`cifra absolute -bottom-1.5 left-1/2 grid h-5 min-w-5 -translate-x-1/2 place-items-center rounded-full border-2 border-tarjeta px-1 text-xs text-sobre-relleno ${
                        urge ? "bg-coral-relleno" : "bg-azul-relleno"
                      }`}
                    >
                      {dias}
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={10}>
                  {descripcion}
                </TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>
      {resto > 0 && <span className="cifra text-xs whitespace-nowrap text-tinta-2">+{formatearEntero(resto)}</span>}
    </div>
  );
}
