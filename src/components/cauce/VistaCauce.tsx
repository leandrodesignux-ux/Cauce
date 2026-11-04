"use client";

import { EncabezadoVista } from "@/components/shell/EncabezadoVista";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { ORDEN_ETAPAS } from "@/config/etapas";
import { useDatos } from "@/components/Proveedores";
import { ContenidoPanel, encabezadoPanel } from "@/components/panel/ContenidoPanel";
import { StagePanel } from "@/components/panel/StagePanel";
import { SiguientePaso } from "@/components/shell/SiguientePaso";
import { Button } from "@/components/ui/button";
import { useJourney } from "@/hooks/useJourney";
import { useSeleccion } from "@/hooks/useSeleccion";
import { formatearRangoSemanas } from "@/lib/formato";
import { experimentosDelBoard } from "@/lib/journey";
import type { EtapaId } from "@/lib/tipos";
import { ActividadEnVivo } from "./ActividadEnVivo";
import { DataTableCauce } from "./DataTableCauce";
import { DondeSePierde } from "./DondeSePierde";
import { ExperimentosHome } from "./ExperimentosHome";
import { JourneyBoard } from "./JourneyBoard";
import { LeadsSinAtender } from "./LeadsSinAtender";
import type { Resaltado } from "./resaltado";
import { ResumenCauce } from "./ResumenCauce";
import { SeccionHome } from "./SeccionHome";
import { ID_SIMULADOR, SimuladorMejora, transicionDeMayorRendimiento } from "./SimuladorMejora";

/** Experimentos que se muestran en el home (el destacado primero). */
const EXPERIMENTOS_HOME = 3;

/**
 * Recorrido (home), en el orden de lectura: título, resumen, recorrido por fases, simulador, dónde se pierde,
 * experimentos, leads sin atender y siguiente paso. El resaltado (hover o foco en etapa, fuga, fase o
 * experimento) y la transición del simulador son estado local: no van a la URL.
 */
export function VistaCauce() {
  const { experimentos } = useDatos();
  const { journey, estado, filtros, restablecer } = useJourney();
  const { seleccion, seleccionar } = useSeleccion();
  const [resaltado, setResaltado] = useState<Resaltado>(null);
  const [transicionElegida, setTransicion] = useState<number | null>(null);
  const reducir = useReducedMotion() ?? false;
  const transicion = transicionElegida ?? transicionDeMayorRendimiento(journey);

  const tiles = useMemo(() => experimentosDelBoard(experimentos, EXPERIMENTOS_HOME), [experimentos]);

  const abrirEtapa = useCallback((etapa: EtapaId) => seleccionar({ tipo: "etapa", etapa }), [seleccionar]);

  /** Preselecciona la transición que sale de la etapa, lleva el simulador a la vista y enfoca su selector. */
  const simular = useCallback(
    (desde: EtapaId) => {
      setTransicion(ORDEN_ETAPAS.indexOf(desde));
      document.getElementById("t-simulador")?.scrollIntoView({ behavior: reducir ? "auto" : "smooth", block: "start" });
      // Enfoca la fila preseleccionada del ranking cuando ya está pintada.
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`#${ID_SIMULADOR} [aria-checked=true]`)?.focus({ preventScroll: true }));
    },
    [reducir],
  );

  /** Cierra el panel y devuelve el foco a la tarjeta de la etapa (en la tabla no hay tarjeta: el panel lo devuelve solo). */
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
      <EncabezadoVista
        className="mb-6"
        titulo="Recorrido de adquisición"
        subtitulo={`${formatearRangoSemanas(estado.periodo.desde, estado.periodo.hasta)}. De la primera visita al contrato: cuánto avanza en cada paso y dónde se pierde.`}
      />

      <ResumenCauce journey={journey} />
      <ActividadEnVivo />

      <SeccionHome
        id="t-recorrido"
        titulo="Recorrido"
        descripcion={
          estado.tabla
            ? "Volumen y conversión de cada etapa, en tablas."
            : "Cuántos llegan a cada etapa y qué porcentaje avanza a la siguiente. Abra una etapa para ver el detalle."
        }
      >
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
          <JourneyBoard
            journey={journey}
            comparar={estado.comparar}
            resaltado={resaltado}
            onResaltar={setResaltado}
            onAbrirEtapa={abrirEtapa}
            onSimular={simular}
          />
        )}
      </SeccionHome>

      {!seco && !estado.tabla && (
        <SeccionHome
          id="t-simulador"
          titulo="¿Qué pasa si mejora un paso?"
          descripcion="Elija un paso y cuántos puntos mejora su conversión: los cierres y la comisión extra salen de las tasas del período."
        >
          <SimuladorMejora journey={journey} transicion={transicion} onTransicion={setTransicion} />
        </SeccionHome>
      )}

      {!seco && !estado.tabla && (
        <SeccionHome id="t-pierde" titulo="Dónde se pierde" descripcion="Cada fuga con su valor estimado en el período, de la más cara a la más barata.">
          <DondeSePierde journey={journey} resaltado={resaltado} onResaltar={setResaltado} />
        </SeccionHome>
      )}

      <SeccionHome
        id="t-experimentos"
        titulo="Experimentos"
        descripcion={
          <>
            <span className="hidden [@media(hover:hover)]:inline">Pase el cursor o enfoque uno para ver qué etapa ataca.</span>
            <span className="[@media(hover:hover)]:hidden">Qué se está probando para recuperar la demanda.</span>
          </>
        }
        accion={
          <Button asChild variant="outline" size="lg">
            <Link href="/experimentos">Ver todos los experimentos</Link>
          </Button>
        }
      >
        <ExperimentosHome experimentos={tiles} onResaltar={setResaltado} />
      </SeccionHome>

      <LeadsSinAtender />

      <SiguientePaso desde="/" className="mt-6" />

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
