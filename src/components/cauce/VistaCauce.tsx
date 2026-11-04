"use client";

import { ArrowRightLeft, Table2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useDatos } from "@/components/Proveedores";
import { ContenidoPanel, encabezadoPanel } from "@/components/panel/ContenidoPanel";
import { StagePanel } from "@/components/panel/StagePanel";
import { useAccionesCauce } from "@/components/shell/acciones";
import { BotonRedondo } from "@/components/shell/BotonRedondo";
import { Button } from "@/components/ui/button";
import { useJourney } from "@/hooks/useJourney";
import { useSeleccion } from "@/hooks/useSeleccion";
import { formatearMxnCorto, formatearRangoSemanas } from "@/lib/formato";
import { experimentoDestacado, experimentosDelBoard } from "@/lib/journey";
import type { EtapaId } from "@/lib/tipos";
import { DataTableCauce } from "./DataTableCauce";
import { FilaInferior } from "./FilaInferior";
import { JourneyBoard } from "./JourneyBoard";
import { TiraFantasmas } from "./TiraFantasmas";

export function VistaCauce() {
  const { experimentos } = useDatos();
  const { journey, estado, filtros, restablecer } = useJourney();
  const { seleccion, seleccionar } = useSeleccion();
  const { comparar, tabla, alternarComparar, alternarTabla } = useAccionesCauce();

  const tiles = useMemo(() => experimentosDelBoard(experimentos), [experimentos]);
  const destacado = useMemo(() => experimentoDestacado(experimentos), [experimentos]);
  const pozasConValor = journey.pozas.filter((p) => p.valor > 0).length;

  const abrirEtapa = useCallback((etapa: EtapaId) => seleccionar({ tipo: "etapa", etapa }), [seleccionar]);

  /** Cierra el panel y devuelve el foco a la fila de la etapa (en la tabla no hay fila: el panel lo devuelve solo). */
  const cerrarPanel = useCallback(() => {
    if (!seleccion) return;
    const etapa = seleccion.tipo === "etapa" ? seleccion.etapa : seleccion.desde;
    seleccionar(null);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-etapa="${etapa}"]`)?.focus());
  }, [seleccion, seleccionar]);

  const encabezado = seleccion ? encabezadoPanel(seleccion) : null;
  const seco = journey.etapas[0].volumen === 0;

  return (
    <div className="flex flex-col">
      <h1 className="mt-2 mb-1.5 font-cifra text-xl leading-tight font-bold tracking-tight text-balance md:text-2xl">Journey de adquisición</h1>
      <p className="mb-6 max-w-5xl text-pretty text-tinta-2">
        {formatearRangoSemanas(estado.periodo.desde, estado.periodo.hasta)}. De la primera visita al contrato: cuánto avanza en cada paso, dónde se
        pierde y qué se está haciendo para recuperarlo.
      </p>

      <section aria-labelledby="t-journey" className="vidrio rounded-tarjeta p-3 shadow-tarjeta md:rounded-panel md:p-7">
        <div className="mb-6 flex flex-wrap items-center gap-5 px-1 pt-1 md:p-0">
          <div>
            <h2 id="t-journey" className="font-cifra text-lg font-semibold">
              Recorrido del lead
            </h2>
            <p className="text-xs text-tinta-2">
              <b className="cifra text-sm font-semibold text-tinta">{formatearMxnCorto(journey.valorEnRiesgo)}</b> en riesgo en {pozasConValor}{" "}
              {pozasConValor === 1 ? "poza" : "pozas"}
            </p>
          </div>
          <TiraFantasmas />
          <div className="flex gap-2.5 md:ml-auto">
            <BotonRedondo etiqueta="Comparar con período anterior" lado="bottom" presionado={comparar} onClick={alternarComparar}>
              <ArrowRightLeft aria-hidden />
            </BotonRedondo>
            <BotonRedondo etiqueta="Ver como tabla" lado="bottom" presionado={tabla} onClick={alternarTabla}>
              <Table2 aria-hidden />
            </BotonRedondo>
          </div>
        </div>

        {seco ? (
          <div className="flex flex-col items-center gap-3 rounded-tarjeta border border-dashed border-linea-fuerte bg-tarjeta px-6 py-16 text-center">
            <p className="font-cifra text-lg font-semibold">No hay sesiones con estos filtros</p>
            <p className="max-w-md text-sm text-tinta-2">
              No hay volumen para esta combinación de canal, sector y estado en el período. Pruebe ampliar a 90 días o quitar un filtro.
            </p>
            <Button size="lg" onClick={restablecer} className="mt-2">
              Restablecer filtros
            </Button>
          </div>
        ) : estado.tabla ? (
          <DataTableCauce
            volumen={journey.etapas.map((e) => e.volumen)}
            anterior={estado.comparar ? journey.etapas.map((e) => e.anterior) : null}
            tasas={journey.tasas}
            deltas={journey.deltas}
            pozas={journey.pozas}
          />
        ) : (
          <>
            <JourneyBoard journey={journey} comparar={estado.comparar} experimentos={tiles} destacado={destacado} onAbrirEtapa={abrirEtapa} />
            <ul aria-label="Leyenda" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 px-1 text-xs text-tinta-2 md:px-0">
              <li className="inline-flex items-center gap-2">
                <span aria-hidden className="w-6 border-t-2 border-azul" />
                Avanza al paso siguiente (porcentaje que pasa)
              </li>
              <li className="inline-flex items-center gap-2">
                <span aria-hidden className="w-6 border-t-2 border-dashed border-coral" />
                Fuga hacia una poza, con su valor estimado
              </li>
            </ul>
          </>
        )}
      </section>

      <FilaInferior journey={journey} />

      <StagePanel
        abierto={seleccion !== null}
        clave={seleccion ? `${seleccion.tipo}:${seleccion.tipo === "etapa" ? seleccion.etapa : seleccion.desde}` : null}
        titulo={encabezado?.titulo ?? ""}
        subtitulo={encabezado?.subtitulo}
        onCerrar={cerrarPanel}
      >
        {seleccion && <ContenidoPanel seleccion={seleccion} filtros={filtros} tabla={estado.tabla} />}
      </StagePanel>
    </div>
  );
}
