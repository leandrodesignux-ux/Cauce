"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { CifraAnimada } from "@/components/CifraAnimada";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { TRANSICIONES, nombreEtapa } from "@/config/etapas";
import { formatearEntero, formatearPct, formatearUsd } from "@/lib/formato";
import { type Journey, volumenDeJourney } from "@/lib/journey";
import { parametrosPerdidaIniciales, rendimientoPorPunto, simularMejora } from "@/lib/selectors";

const PUNTOS_INICIALES = 2;
const PUNTOS_MAX = 10;
const PASO = 0.5;
const ATAJOS = [1, 2, 5] as const;
const decimales = (v: number, d: number) => v.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
/** Pocas unidades: con decimales (así personas × probabilidad cuadra con los cierres). */
const cantidad = (v: number) => (Math.abs(v) < 1 ? decimales(v, 2) : Math.abs(v) < 100 ? decimales(v, 1) : formatearEntero(Math.round(v)));

/** Id del grupo de pasos: las tarjetas de etapa lo usan para enfocar la fila preseleccionada. */
export const ID_SIMULADOR = "simulador-transicion";

/** Índice de la transición donde más rinde mejorar un punto (cierres por punto). */
export function transicionDeMayorRendimiento(journey: Journey): number {
  const ranking = rendimientoPorPunto(volumenDeJourney(journey));
  return ranking.reduce((mejor, r, i) => (r.cierresPorPunto > ranking[mejor].cierresPorPunto ? i : mejor), 0);
}

/**
 * "¿Qué pasa si mejora un paso?": a la izquierda, dónde rinde más mejorar (ranking de las 7 transiciones por
 * cierres por punto, como radiogroup); a la derecha, el efecto de la mejora elegida: la tasa nueva, la
 * comparación hoy / con la mejora y la cadena personas → cierres → dólares. Todo sale de rendimientoPorPunto y
 * simularMejora; la transición la comparte con las tarjetas de etapa (vía VistaCauce).
 */
export function SimuladorMejora({ journey, transicion, onTransicion }: { journey: Journey; transicion: number; onTransicion: (i: number) => void }) {
  const id = useId();
  const [puntos, setPuntos] = useState(PUNTOS_INICIALES);
  const volumen = useMemo(() => volumenDeJourney(journey), [journey]);
  const ranking = useMemo(() => rendimientoPorPunto(volumen), [volumen]);
  const maxCierres = Math.max(...ranking.map((r) => r.cierresPorPunto), Number.EPSILON);
  const comision = parametrosPerdidaIniciales().comisionUsd;

  const t = TRANSICIONES[transicion];
  const tasa = ranking[transicion].tasaActual ?? 0;
  // Tope: la tasa no pasa de 100 %. El slider llega hasta min(10, 100 − tasa) puntos, en pasos de 0.5.
  const tope = Math.max(PASO, Math.min(PUNTOS_MAX, Math.floor(((1 - tasa) * 100) / PASO) * PASO));
  const efectivos = Math.min(Math.max(puntos, PASO), tope);
  const r = simularMejora(volumen, t, efectivos, comision);
  const tasaNueva = Math.min(1, tasa + efectivos / 100);
  const escala = Math.max(tasaNueva, Number.EPSILON);
  const etiquetaPuntos = `+${decimales(efectivos, 1)} puntos`;

  const elegir = (i: number) => {
    const n = (i + TRANSICIONES.length) % TRANSICIONES.length;
    onTransicion(n);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`#${ID_SIMULADOR} [data-paso="${n}"]`)?.focus());
  };
  const alPresionar = (e: KeyboardEvent, i: number) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      elegir(i + 1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      elegir(i - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTransicion(i);
    }
  };

  return (
    <div className="grid gap-6 rounded-tarjeta border border-tarjeta-borde bg-tarjeta p-5 shadow-tarjeta lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-10">
      {/* Izquierda: ranking */}
      <div className="flex min-w-0 flex-col gap-3">
        <h3 id={`${id}-ranking`} className="text-sm font-medium">
          ¿Dónde rinde más mejorar?
        </h3>
        <div id={ID_SIMULADOR} role="radiogroup" aria-labelledby={`${id}-ranking`} className="flex flex-col gap-1">
          {ranking.map((fila, i) => {
            const elegida = i === transicion;
            return (
              <div
                key={fila.transicion.desde}
                role="radio"
                aria-checked={elegida}
                tabIndex={elegida ? 0 : -1}
                data-paso={i}
                onClick={() => onTransicion(i)}
                onKeyDown={(e) => alPresionar(e, i)}
                className={`flex cursor-pointer flex-col gap-1.5 rounded-tile border px-3 py-2.5 outline-none select-none focus-visible:ring-2 focus-visible:ring-activo motion-safe:transition-colors motion-safe:duration-(--duracion-rapida) ${
                  elegida ? "border-activo bg-azul-suave" : "border-transparent hover:bg-neutro-suave"
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-tinta-cuerpo">
                    {nombreEtapa(fila.transicion.desde)} → {nombreEtapa(fila.transicion.hacia)}
                  </span>
                  <span className="cifra shrink-0 text-sm font-medium">
                    +<CifraAnimada valor={fila.cierresPorPunto} formato={cantidad} /> cierres por punto
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span aria-hidden className={`relative h-1.5 flex-1 overflow-hidden rounded-full ${elegida ? "bg-tarjeta" : "bg-azul-suave"}`}>
                    <span
                      className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-azul-relleno motion-safe:transition-transform motion-safe:duration-(--duracion-media) motion-safe:ease-salida"
                      style={{ transform: `scaleX(${fila.cierresPorPunto / maxCierres})` }}
                    />
                  </span>
                  <span className="cifra shrink-0 text-xs text-tinta-2">hoy {formatearPct(fila.tasaActual)}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Derecha: el efecto de la mejora */}
      <div className="flex min-w-0 flex-col gap-5">
        <p className="text-lg leading-snug font-semibold text-balance" aria-live="polite">
          Si {nombreEtapa(t.desde)} → {nombreEtapa(t.hacia)} pasa de <span className="cifra">{formatearPct(tasa)}</span> a{" "}
          <span className="cifra text-azul-texto">{formatearPct(tasaNueva)}</span>
        </p>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span id={`${id}-puntos`} className="text-sm text-tinta-2">
              Mejora
            </span>
            <span className="cifra text-sm font-semibold">{etiquetaPuntos}</span>
          </div>
          <Slider
            min={PASO}
            max={tope}
            step={PASO}
            value={[efectivos]}
            onValueChange={([v]) => setPuntos(v)}
            thumbProps={{ "aria-labelledby": `${id}-puntos`, "aria-valuetext": etiquetaPuntos }}
            className="py-1.5"
          />
          <div className="flex flex-wrap items-center gap-2">
            {ATAJOS.map((a) => (
              <Button key={a} variant="outline" size="xs" disabled={a > tope} aria-pressed={efectivos === a} onClick={() => setPuntos(a)}>
                +{a}
              </Button>
            ))}
            <span className="cifra ml-auto text-xs text-tinta-2">tope {decimales(tope, tope % 1 ? 1 : 0)} puntos</span>
          </div>
        </div>

        {/* Hoy vs. con la mejora, con escala común */}
        <div aria-hidden className="flex flex-col gap-2 text-sm">
          <Comparacion etiqueta={`Hoy ${formatearPct(tasa)}`} valor={tasa / escala} clase="bg-linea-fuerte" />
          <Comparacion etiqueta={`Con la mejora ${formatearPct(tasaNueva)}`} valor={tasaNueva / escala} clase="bg-azul-relleno" />
        </div>

        {/* Cadena: personas → cierres → dólares */}
        <ol aria-live="polite" className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch">
          <Eslabon cifra={<CifraAnimada valor={r.extra} formato={(v) => `+${cantidad(v)}`} />} unidad="personas" detalle={`más llegan a ${nombreEtapa(t.hacia)}`} />
          <Flecha />
          <Eslabon
            cifra={<CifraAnimada valor={r.cierres} formato={(v) => `+${cantidad(v)}`} />}
            unidad="cierres"
            detalle={`${decimales(r.probabilidad * 100, r.probabilidad < 0.01 ? 2 : 1)} % de quienes llegan a ${nombreEtapa(t.hacia)} termina cerrando`}
          />
          <Flecha />
          <Eslabon
            destacado
            cifra={<CifraAnimada valor={r.usd} formato={(v) => `+${formatearUsd(v)}`} />}
            detalle={`en comisión (${formatearUsd(comision)} por cierre)`}
          />
        </ol>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="link" size="xs" className="self-start px-0">
              Cómo se calcula
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 text-xs text-pretty">
            <p className="cifra">
              {formatearEntero(volumen[t.desde])} en {nombreEtapa(t.desde)} × {decimales(efectivos, 1)} / 100 × {decimales(r.probabilidad * 100, 2)} % de cierre desde{" "}
              {nombreEtapa(t.hacia)} = {decimales(r.cierres, 1)} cierres × {formatearUsd(comision)} de comisión = {formatearUsd(r.usd)}
            </p>
            <p className="mt-2 text-tinta-2">Las tasas son las del período; la comisión, la del modelo de pérdida.</p>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function Comparacion({ etiqueta, valor, clase }: { etiqueta: string; valor: number; clase: string }) {
  return (
    <div className="grid grid-cols-[9.5rem_minmax(0,1fr)] items-center gap-3">
      <span className="cifra text-xs text-tinta-2">{etiqueta}</span>
      <span className="relative h-2.5 overflow-hidden rounded-full bg-neutro-suave">
        <span
          className={`absolute inset-y-0 left-0 w-full origin-left rounded-full ${clase} motion-safe:transition-transform motion-safe:duration-(--duracion-media) motion-safe:ease-salida`}
          style={{ transform: `scaleX(${Math.min(1, Math.max(0, valor))})` }}
        />
      </span>
    </div>
  );
}

function Eslabon({ cifra, unidad, detalle, destacado = false }: { cifra: ReactNode; unidad?: string; detalle: string; destacado?: boolean }) {
  return (
    <li className={`flex flex-col gap-1 rounded-tile border p-4 ${destacado ? "border-transparent bg-azul-suave" : "border-tarjeta-borde bg-tarjeta shadow-tarjeta"}`}>
      <span className={`cifra font-semibold ${destacado ? "text-2xl text-azul-texto" : "text-xl"}`}>
        {cifra}
        {unidad && <span className="ml-1 font-sans text-sm font-normal text-tinta-cuerpo">{unidad}</span>}
      </span>
      <span className="text-xs text-pretty text-tinta-2">{detalle}</span>
    </li>
  );
}

function Flecha() {
  return (
    <li aria-hidden className="grid place-items-center text-tinta-2">
      <ArrowDown className="size-4 md:hidden" />
      <ArrowRight className="hidden size-4 md:block" />
    </li>
  );
}
