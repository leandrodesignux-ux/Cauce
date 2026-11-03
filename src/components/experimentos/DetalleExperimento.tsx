"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { TendenciaSemanal } from "@/components/panel/TendenciaSemanal";
import { useDatos } from "@/components/Proveedores";
import { nombreEtapa } from "@/config/etapas";
import { finLectura, inicioLectura, situacion } from "@/lib/experimentos";
import { formatearPp, formatearSemana } from "@/lib/formato";
import { serieSemanal } from "@/lib/selectors";
import type { Experimento } from "@/lib/tipos";
import { ChipEstado, PredichoObservado, tonoObservado } from "./comunes";

// El relleno de la barra usa el tono base (no la variante de texto).
const RELLENO_OBSERVADO: Record<string, string> = {
  "text-cauce-texto": "bg-cauce",
  "text-laton-texto": "bg-laton",
  "text-oxido-texto": "bg-oxido",
  "text-niebla": "bg-niebla",
};

/** Detalle de un experimento: hipótesis, métrica, resultado y la transición en el cauce. */
export function DetalleExperimento({ e }: { e: Experimento }) {
  const { flujo, semanas, ultimaSemana } = useDatos();
  const s = situacion(e);

  // Toda la historia disponible de la transición, con el despliegue y la ventana de lectura marcados.
  const serie = useMemo(
    () =>
      serieSemanal(flujo, { periodo: { desde: ultimaSemana, hasta: ultimaSemana } }, e.transicion, semanas.length).map((p) => ({
        semana: p.semana,
        valor: p.tasa === null ? null : p.tasa * 100,
      })),
    [flujo, e.transicion, semanas.length, ultimaSemana],
  );

  const escala = Math.max(Math.abs(e.prediccionPp), Math.abs(e.observadoPp ?? 0), 0.1);

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center gap-2">
        <ChipEstado estado={e.estado} />
        <span className="text-sm text-niebla">{s.texto}</span>
      </div>

      <Bloque titulo="Hipótesis">
        <p className="text-base">{e.hipotesis}</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-niebla">Palanca</dt>
          <dd>{e.palanca}</dd>
          <dt className="text-niebla">Métrica</dt>
          <dd>{e.metrica}</dd>
          <dt className="text-niebla">Despliegue</dt>
          <dd className="cifra">{formatearSemana(e.despliegue)}</dd>
          <dt className="text-niebla">Lectura</dt>
          <dd className="cifra">
            {formatearSemana(inicioLectura(e))} – {formatearSemana(finLectura(e))}{" "}
            <span className="font-sans text-niebla">
              (semanas {e.ventanaSemanas[0]}–{e.ventanaSemanas[1]})
            </span>
          </dd>
        </dl>
      </Bloque>

      <Bloque titulo="Predicho vs. observado">
        <div className="flex flex-col gap-3">
          <Barra etiqueta="Predicho" valor={e.prediccionPp} escala={escala} clase="bg-linea-fuerte" texto={formatearPp(e.prediccionPp)} />
          <Barra
            etiqueta="Observado"
            valor={e.observadoPp ?? 0}
            escala={escala}
            clase={e.observadoPp === undefined ? "bg-transparent" : RELLENO_OBSERVADO[tonoObservado(e)]}
            texto={e.observadoPp === undefined ? "Sin lectura todavía" : formatearPp(e.observadoPp)}
          />
          <PredichoObservado e={e} compacto />
          <p className="text-xs text-niebla">
            Observado = conversión en la ventana de lectura menos la de las 6 semanas previas al despliegue, sobre todo el tráfico.
          </p>
        </div>
      </Bloque>

      <Bloque titulo={`${nombreEtapa(e.transicion.desde)} → ${nombreEtapa(e.transicion.hacia)}`} nota="Conversión semanal, 26 semanas">
        <TendenciaSemanal
          puntos={serie}
          formato={(v) => `${v.toFixed(1)} %`}
          marcadores={serie.some((p) => p.semana === e.despliegue) ? [{ semana: e.despliegue, etiqueta: "Despliegue" }] : []}
          franja={{ desde: inicioLectura(e), hasta: finLectura(e), etiqueta: "Lectura" }}
          descripcion={`Conversión semanal de ${nombreEtapa(e.transicion.desde)} a ${nombreEtapa(e.transicion.hacia)} en 26 semanas, con el despliegue y la ventana de lectura marcados`}
        />
        <Link
          href={`/?transicion=${e.transicion.desde}-${e.transicion.hacia}`}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-cauce-texto hover:underline"
        >
          Ver la transición en el cauce
          <ArrowUpRight className="size-4" aria-hidden />
        </Link>
      </Bloque>
    </div>
  );
}

function Bloque({ titulo, nota, children }: { titulo: string; nota?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">{titulo}</h3>
        {nota && <span className="text-xs text-niebla">{nota}</span>}
      </div>
      {children}
    </section>
  );
}

function Barra({ etiqueta, valor, escala, clase, texto }: { etiqueta: string; valor: number; escala: number; clase: string; texto: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm">
      <span className="text-niebla">{etiqueta}</span>
      <span className="relative h-2.5 rounded-full bg-concreto" aria-hidden>
        <span className={`absolute inset-y-0 left-0 rounded-full ${clase}`} style={{ width: `${(Math.max(0, valor) / escala) * 100}%` }} />
      </span>
      <span className="cifra font-medium">{texto}</span>
    </div>
  );
}
