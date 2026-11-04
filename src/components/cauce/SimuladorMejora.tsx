"use client";

import { useId, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { TRANSICIONES, nombreEtapa } from "@/config/etapas";
import { formatearEntero, formatearUsd } from "@/lib/formato";
import { type Journey, volumenDeJourney } from "@/lib/journey";
import { parametrosPerdidaIniciales, simularMejora } from "@/lib/selectors";

const PUNTOS_INICIALES = 2;
const decimales = (v: number, d: number) => v.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Id del disparador del Select: las tarjetas de etapa lo enfocan después de preseleccionar su transición. */
export const ID_SIMULADOR = "simulador-transicion";

/**
 * "¿Qué pasa si mejora un paso?": elige una transición y cuántos puntos mejora, y calcula los cierres y la
 * comisión extra del período con simularMejora. Estado local: la transición la comparte con las tarjetas
 * de etapa (vía VistaCauce), los puntos viven acá. Nada va a la URL.
 */
export function SimuladorMejora({
  journey,
  transicion,
  onTransicion,
}: {
  journey: Journey;
  transicion: number;
  onTransicion: (i: number) => void;
}) {
  const id = useId();
  const [puntos, setPuntos] = useState(PUNTOS_INICIALES);
  const volumen = useMemo(() => volumenDeJourney(journey), [journey]);
  const comision = parametrosPerdidaIniciales().comisionUsd;
  const t = TRANSICIONES[transicion];
  const r = simularMejora(volumen, t, puntos, comision);
  const etiquetaPuntos = `${decimales(puntos, 1)} puntos`;

  return (
    <div className="grid gap-6 rounded-tarjeta border border-tarjeta-borde bg-tarjeta p-5 shadow-tarjeta md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-10">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={ID_SIMULADOR} className="text-sm text-tinta-2">
            Paso del recorrido
          </label>
          <Select value={String(transicion)} onValueChange={(v) => onTransicion(Number(v))}>
            <SelectTrigger id={ID_SIMULADOR} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRANSICIONES.map((x, i) => (
                <SelectItem key={x.desde} value={String(i)}>
                  {nombreEtapa(x.desde)} → {nombreEtapa(x.hacia)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span id={`${id}-puntos`} className="text-sm text-tinta-2">
              Mejora de la conversión
            </span>
            <span className="cifra text-sm font-semibold">+{etiquetaPuntos}</span>
          </div>
          <Slider
            min={0}
            max={10}
            step={0.5}
            value={[puntos]}
            onValueChange={([v]) => setPuntos(v)}
            thumbProps={{ "aria-labelledby": `${id}-puntos`, "aria-valuetext": etiquetaPuntos }}
            className="py-1.5"
          />
          <div aria-hidden className="cifra flex justify-between text-xs text-tinta-2">
            <span>0</span>
            <span>10 puntos</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-5">
        <dl aria-live="polite" className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-sm text-tinta-2">cierres en el período</dt>
            <dd className="cifra text-2xl font-semibold text-azul-texto">+{decimales(r.cierres, 1)}</dd>
          </div>
          <div className="flex flex-col-reverse gap-1">
            <dt className="text-sm text-tinta-2">en comisión</dt>
            <dd className="cifra text-2xl font-semibold text-azul-texto">+{formatearUsd(r.usd)}</dd>
          </div>
        </dl>
        <p className="text-xs text-pretty text-tinta-2">
          <span className="cifra">
            {formatearEntero(volumen[t.desde])} en {nombreEtapa(t.desde)} × {decimales(puntos, 1)} / 100 ×{" "}
            {decimales(r.probabilidad * 100, 2)} % de cierre desde {nombreEtapa(t.hacia)} = {decimales(r.cierres, 1)} cierres ×{" "}
            {formatearUsd(comision)} de comisión
          </span>
          . Las tasas son las del período; la comisión, la del modelo de pérdida.
        </p>
      </div>
    </div>
  );
}
