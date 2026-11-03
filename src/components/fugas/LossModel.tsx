"use client";

import { RotateCcw } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useId, useMemo, useState } from "react";
import { PARAMETROS_PERDIDA_INICIALES as P } from "@/config/modelo";
import { useTween } from "@/hooks/useTween";
import { formatearEntero, formatearMxn } from "@/lib/formato";
import { type ParametrosPerdida, modeloPerdida, parametrosPerdidaIniciales } from "@/lib/selectors";

type Clave = keyof ParametrosPerdida;

const CONTROLES: { clave: Clave; nombre: string; origen: string; min: number; max: number; paso: number; formato: (v: number) => string }[] = [
  { clave: "fantasmas", nombre: "Fantasmas", origen: P.fantasmas.origen, min: 0, max: 2000, paso: 1, formato: (v) => formatearEntero(v) },
  { clave: "leadACita", nombre: "Lead → cita", origen: P.leadACita.origen, min: 0, max: 1, paso: 0.01, formato: (v) => `${Math.round(v * 100)} %` },
  { clave: "citaAContrato", nombre: "Cita → contrato", origen: P.citaAContrato.origen, min: 0, max: 0.5, paso: 0.005, formato: (v) => `${(v * 100).toFixed(1).replace(".0", "")} %` },
  { clave: "comisionMxn", nombre: "Comisión promedio", origen: P.comisionMxn.origen, min: 5000, max: 60000, paso: 500, formato: (v) => `$${formatearEntero(v)}` },
];

const decimales = (v: number, d: number) => v.toLocaleString("es-MX", { maximumFractionDigits: d });

/** Modelo de pérdida de fantasmas: sliders y fórmula paso a paso. El monto se recalcula en vivo. */
export function LossModel() {
  const iniciales = useMemo(() => parametrosPerdidaIniciales(), []);
  const [p, setP] = useState<ParametrosPerdida>(iniciales);
  const reducir = useReducedMotion() ?? false;
  const id = useId();
  const r = modeloPerdida(p);
  const objetivo = useMemo(() => [r.montoMxn], [r.montoMxn]);
  const [montoAnimado] = useTween(objetivo, 300, reducir);
  const cambiado = CONTROLES.some((c) => p[c.clave] !== iniciales[c.clave]);

  return (
    <section aria-labelledby={`${id}-titulo`} className="grid gap-8 rounded-panel border border-linea bg-papel p-5 md:p-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id={`${id}-titulo`} className="font-cifra text-lg font-semibold">
              Modelo de pérdida
            </h2>
            <p className="mt-1 text-sm text-niebla">Cuánto vale lo que se queda en la poza de fantasmas. Mueva los parámetros.</p>
          </div>
          {cambiado && (
            <button
              type="button"
              onClick={() => setP(iniciales)}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-control px-2 text-sm text-niebla hover:bg-concreto hover:text-tinta"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Valores iniciales
            </button>
          )}
        </div>

        {CONTROLES.map((c) => (
          <div key={c.clave} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor={`${id}-${c.clave}`} className="text-sm font-medium">
                {c.nombre}
              </label>
              <output htmlFor={`${id}-${c.clave}`} className="cifra text-base font-semibold">
                {c.formato(p[c.clave])}
              </output>
            </div>
            <input
              id={`${id}-${c.clave}`}
              type="range"
              min={c.min}
              max={c.max}
              step={c.paso}
              value={p[c.clave]}
              aria-valuetext={c.formato(p[c.clave])}
              onChange={(e) => setP((x) => ({ ...x, [c.clave]: Number(e.target.value) }))}
              className="h-2 w-full cursor-pointer accent-cauce"
            />
            <p className="text-xs text-niebla">
              {p[c.clave] === iniciales[c.clave] ? `Origen: ${c.origen}` : `Ajustado · inicial ${c.formato(iniciales[c.clave])} (${c.origen})`}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-col justify-between gap-6 rounded-panel bg-concreto p-5">
        <ol className="flex flex-col gap-3 text-sm" aria-label="Fórmula paso a paso">
          <Paso operador="" valor={formatearEntero(p.fantasmas)} detalle="fantasmas" />
          <Paso operador="×" valor={CONTROLES[1].formato(p.leadACita)} detalle="lead → cita" resultado={`${decimales(r.citas, 1)} citas`} />
          <Paso operador="×" valor={CONTROLES[2].formato(p.citaAContrato)} detalle="cita → contrato" resultado={`${decimales(r.contratos, 2)} contratos`} />
          <Paso operador="×" valor={`$${formatearEntero(p.comisionMxn)}`} detalle="comisión promedio" />
        </ol>
        <div className="border-t border-linea-fuerte pt-4">
          <p className="text-sm text-niebla">Valor en riesgo en la poza de fantasmas</p>
          <p className="cifra mt-1 text-3xl font-semibold text-laton" aria-live="polite">
            {formatearMxn(Math.round(montoAnimado))}
          </p>
          <p className="mt-2 text-xs text-niebla">Mismo monto que muestra la poza de fantasmas en el cauce con los valores iniciales.</p>
        </div>
      </div>
    </section>
  );
}

function Paso({ operador, valor, detalle, resultado }: { operador: string; valor: string; detalle: string; resultado?: string }) {
  return (
    <li className="grid grid-cols-[1.25rem_auto_1fr_auto] items-baseline gap-2">
      <span className="cifra text-niebla" aria-hidden>
        {operador}
      </span>
      <span className="cifra font-semibold">{valor}</span>
      <span className="text-niebla">{detalle}</span>
      <span className="cifra text-right">{resultado ? `= ${resultado}` : ""}</span>
    </li>
  );
}
