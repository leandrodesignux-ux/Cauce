"use client";

import { Droplet } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { ChipEstado } from "@/components/experimentos/comunes";
import { useDatos } from "@/components/Proveedores";
import { Button } from "@/components/ui/button";
import { nombreEtapa } from "@/config/etapas";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import { formatearEntero, formatearMxnCorto } from "@/lib/formato";
import type { Journey } from "@/lib/journey";
import { type OnResaltar, type Resaltado, propsResaltar } from "./resaltado";

/**
 * Dónde se pierde: una tarjeta por fuga con valor, de la más cara a la más barata. La fuga del modelo de
 * pérdida (leads sin atender) se valúa como siempre: con el modelo, no con la caída de la transición.
 * Hover o foco en una fuga resaltan sus etapas en el recorrido; con una etapa resaltada, las fugas de su
 * transición se marcan y el resto baja de opacidad.
 */
export function DondeSePierde({
  journey,
  resaltado,
  onResaltar,
}: {
  journey: Journey;
  resaltado: Resaltado;
  onResaltar: OnResaltar;
}) {
  const { fugas, experimentos } = useDatos();
  const tarjetas = useMemo(
    () =>
      journey.pozas
        .filter((p) => p.valor > 0)
        .sort((a, b) => b.valor - a.valor)
        .map((p) => {
          const fuga = fugas.find((f) => f.id === p.id)!;
          return {
            ...p,
            fuga,
            experimento:
              experimentos.find((e) => e.id === fuga.experimentoId) ?? null,
          };
        }),
    [journey.pozas, fugas, experimentos],
  );

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tarjetas.map((t) => {
        const deEtapa =
          resaltado?.origen === "etapa" ? resaltado.etapas[0] : null;
        const marcada = deEtapa !== null && t.fuga.desde === deEtapa;
        return (
          <li
            key={t.id}
            data-fuga={t.id}
            data-marcada={marcada}
            data-atenua={deEtapa !== null && !marcada}
            {...propsResaltar(onResaltar, {
              etapas: [t.fuga.desde, t.fuga.hacia],
              origen: "fuga",
            })}
            className="tarjeta-clicable tarjeta-coral flex flex-col gap-3 rounded-tile border border-tarjeta-borde bg-tarjeta p-4 shadow-tarjeta data-[atenua=true]:opacity-50 data-[marcada=true]:border-coral data-[marcada=true]:shadow-flotante"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="grid size-9 shrink-0 place-items-center rounded-full border-[1.5px] border-dashed border-coral text-coral-texto"
              >
                <Droplet className="size-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{t.nombre}</p>
                <p className="text-xs text-tinta-2">
                  Entre {nombreEtapa(t.fuga.desde)} y{" "}
                  {nombreEtapa(t.fuga.hacia)}
                </p>
              </div>
              {t.experimento && <ChipEstado estado={t.experimento.estado} />}
            </div>
            <div className="flex items-end justify-between gap-3">
              <p>
                <span className="cifra block text-xl font-semibold">
                  {formatearMxnCorto(t.valor)}
                </span>
                <span className="cifra block text-xs text-tinta-2">
                  {formatearEntero(t.volumen)}{" "}
                  {t.id === FUGA_MODELO_PERDIDA ? "sin atender" : "perdidos"}
                </span>
              </p>
              <Button
                asChild
                variant={t.id === FUGA_MODELO_PERDIDA ? "coral" : "outline"}
              >
                <Link
                  href={`/fugas?poza=${t.id}`}
                  aria-label={`Ver leads de ${t.nombre}`}
                >
                  Ver leads
                </Link>
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
