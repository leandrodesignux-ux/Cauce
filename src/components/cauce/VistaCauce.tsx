"use client";

import { useMemo } from "react";
import { FilterBar } from "@/components/filtros/FilterBar";
import { useDatos } from "@/components/Proveedores";
import { ETAPAS, TRANSICIONES } from "@/config/etapas";
import { useFiltros } from "@/hooks/useFiltros";
import { formatearEntero, formatearMxnCorto, formatearPct, formatearRangoSemanas } from "@/lib/formato";
import { semanasEntre, tasaTransicion, valorEnRiesgoPorPoza, valorEnRiesgoTotal, volumenPorEtapa } from "@/lib/selectors";
import { useRescatadosHoy } from "@/lib/stores";

export function VistaCauce() {
  const { flujo, fugas } = useDatos();
  const { estado, filtros } = useFiltros();
  const rescatadosHoy = useRescatadosHoy();

  const volumen = useMemo(() => volumenPorEtapa(flujo, filtros), [flujo, filtros]);
  const valorEnRiesgo = useMemo(() => valorEnRiesgoTotal(valorEnRiesgoPorPoza(flujo, fugas, filtros)), [flujo, fugas, filtros]);
  const semanas = semanasEntre(estado.periodo.desde, estado.periodo.hasta);

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="sr-only">El cauce: journey de adquisición</h1>
      <div className="border-b border-linea px-4 py-3 md:px-6 xl:px-8">
        <FilterBar />
      </div>

      <section aria-label="Contexto del período" className="flex flex-wrap items-end gap-x-10 gap-y-4 px-4 pt-6 md:px-6 xl:px-8">
        <Cifra etiqueta="Valor en riesgo" valor={formatearMxnCorto(valorEnRiesgo)} tono="text-laton" />
        <Cifra etiqueta="Rescatados hoy" valor={formatearEntero(rescatadosHoy)} tono="text-cauce" />
        <p className="hidden text-sm text-niebla md:ml-auto md:block">
          {formatearRangoSemanas(estado.periodo.desde, estado.periodo.hasta)} · {semanas} {semanas === 1 ? "semana" : "semanas"}
        </p>
      </section>

      {/* Vista previa de volúmenes por etapa. El río (RiverChart) la reemplaza en la Fase 3. */}
      <section aria-label="Volumen por etapa" className="px-4 py-8 md:px-6 xl:px-8">
        <ol className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-linea bg-linea sm:grid-cols-4 xl:grid-cols-8">
          {ETAPAS.map((e, i) => {
            const t = TRANSICIONES[i - 1];
            return (
              <li key={e.id} className="flex flex-col gap-1 bg-concreto p-4">
                <span className="text-sm text-niebla">{e.nombre}</span>
                <span className="cifra text-xl font-medium">{formatearEntero(volumen[e.id])}</span>
                <span className="cifra text-sm text-niebla">{t ? formatearPct(tasaTransicion(volumen, t)) : "Entrada"}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function Cifra({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-niebla">{etiqueta}</span>
      <span className={`cifra text-2xl font-semibold ${tono}`}>{valor}</span>
    </div>
  );
}
