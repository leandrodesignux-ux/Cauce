"use client";

import { ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { TendenciaSemanal } from "@/components/panel/TendenciaSemanal";
import { useDatos } from "@/components/Proveedores";
import { nombreEtapa } from "@/config/etapas";
import { finLectura, inicioLectura, situacion } from "@/lib/experimentos";
import { formatearPuntos, formatearSemana } from "@/lib/formato";
import { serieSemanal } from "@/lib/selectors";
import type { Experimento } from "@/lib/tipos";
import { tonoObservado } from "./comunes";

// El relleno de la barra usa el tono base (no la variante de texto).
const RELLENO_OBSERVADO: Record<string, string> = {
  "text-azul-texto": "bg-azul-relleno",
  "text-tinta": "bg-coral-relleno",
  "text-coral-texto": "bg-coral-relleno",
  "text-tinta-2": "bg-tenue",
};

/** "+0.5" (sin la unidad, para "contra +0.5 esperados"). */
const sinUnidad = (pp: number) => formatearPuntos(pp).replace(" puntos", "");

/** La frase que resume el experimento, según su estado y su lectura. */
function veredicto(e: Experimento): string {
  if (e.observadoPp === undefined) return `Se podrá medir a partir del ${formatearSemana(inicioLectura(e))}`;
  const comparacion = `${formatearPuntos(e.observadoPp)} contra ${sinUnidad(e.prediccionPp)} esperados`;
  if (e.estado === "validado") return `Funcionó: ${comparacion}`;
  if (e.estado === "refutado") return `No cumplió: ${comparacion}`;
  return `Por ahora: ${comparacion}`;
}

/**
 * Detalle de un experimento en una sola columna, de lo más importante a lo más técnico: veredicto, esperado vs.
 * observado, la conversión semanal de la transición y, plegado, cómo se planteó. El encabezado (nombre, estado y
 * transición) lo pone PanelCentrado.
 */
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
  const tono = tonoObservado(e);
  const ventana = s.fase === "cerrada" ? "Ventana de lectura cerrada" : `Se lee del ${formatearSemana(inicioLectura(e))} al ${formatearSemana(finLectura(e))}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Veredicto */}
      <div className="flex flex-col gap-1.5 rounded-tile bg-muted p-5">
        <p className={`text-lg leading-snug font-semibold text-balance ${tono}`}>{veredicto(e)}</p>
        <p className="text-sm text-tinta-2">{ventana}</p>
      </div>

      {/* Esperado y observado */}
      <div className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-4">
          <Stat etiqueta="Esperado" valor={e.prediccionPp} />
          <Stat etiqueta="Observado" valor={e.observadoPp} tono={tono} />
        </dl>
        <div aria-hidden className="flex flex-col gap-2.5">
          <Barra etiqueta="Esperado" valor={e.prediccionPp} escala={escala} clase="bg-linea-fuerte" />
          <Barra etiqueta="Observado" valor={e.observadoPp ?? 0} escala={escala} clase={e.observadoPp === undefined ? "bg-transparent" : RELLENO_OBSERVADO[tono]} />
        </div>
        <p className="text-xs text-tinta-2">
          Observado = conversión en la ventana de lectura menos la de las 6 semanas previas al despliegue, sobre todo el tráfico.
        </p>
      </div>

      {/* Conversión semanal de la transición */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-medium">{`${nombreEtapa(e.transicion.desde)} → ${nombreEtapa(e.transicion.hacia)}`}</h3>
          <span className="text-xs text-tinta-2">Conversión semanal, 26 semanas</span>
        </div>
        <TendenciaSemanal
          puntos={serie}
          formato={(v) => `${v.toFixed(1)} %`}
          marcadores={serie.some((p) => p.semana === e.despliegue) ? [{ semana: e.despliegue, etiqueta: "Despliegue" }] : []}
          franja={{
            desde: inicioLectura(e),
            hasta: finLectura(e),
            etiqueta: "Lectura",
          }}
          descripcion={`Conversión semanal de ${nombreEtapa(e.transicion.desde)} a ${nombreEtapa(e.transicion.hacia)} en 26 semanas, con el despliegue y la ventana de lectura marcados`}
        />
        <p className="text-xs text-tinta-2">Línea punteada: despliegue · Zona sombreada: ventana de lectura</p>
      </section>

      {/* Cómo se planteó: plegado por defecto */}
      <details className="group rounded-tile border border-tarjeta-borde">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-tile px-4 py-3 text-sm font-medium outline-none select-none hover:bg-neutro-suave focus-visible:ring-2 focus-visible:ring-activo [&::-webkit-details-marker]:hidden">
          Cómo se planteó
          <ChevronDown
            aria-hidden
            className="size-4 text-tinta-2 motion-safe:transition-transform motion-safe:duration-(--duracion-presion) motion-safe:ease-salida group-open:rotate-180"
          />
        </summary>
        <div className="flex flex-col gap-3 px-4 pt-1 pb-4">
          <p className="text-sm text-tinta-cuerpo">{e.hipotesis}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-tinta-2">Palanca</dt>
            <dd>{e.palanca}</dd>
            <dt className="text-tinta-2">Métrica</dt>
            <dd>{e.metrica}</dd>
            <dt className="text-tinta-2">Despliegue</dt>
            <dd className="cifra">{formatearSemana(e.despliegue)}</dd>
            <dt className="text-tinta-2">Lectura</dt>
            <dd className="cifra">
              {formatearSemana(inicioLectura(e))} – {formatearSemana(finLectura(e))}{" "}
              <span className="font-sans text-tinta-2">
                (semanas {e.ventanaSemanas[0]}–{e.ventanaSemanas[1]})
              </span>
            </dd>
          </dl>
        </div>
      </details>

      <Link
        href={`/?transicion=${e.transicion.desde}-${e.transicion.hacia}`}
        className="inline-flex items-center gap-1 self-start text-sm font-medium text-azul-texto hover:underline"
      >
        Ver la transición en el recorrido
        <ArrowUpRight className="size-4" aria-hidden />
      </Link>
    </div>
  );
}

function Stat({ etiqueta, valor, tono }: { etiqueta: string; valor: number | undefined; tono?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-tinta-2">{etiqueta}</dt>
      <dd className={`cifra text-2xl font-semibold ${valor === undefined ? "text-tinta-2" : (tono ?? "text-tinta")}`}>
        {valor === undefined ? "—" : sinUnidad(valor)}
        {valor !== undefined && <span className="ml-1 font-sans text-sm font-normal text-tinta-2">puntos</span>}
      </dd>
    </div>
  );
}

function Barra({ etiqueta, valor, escala, clase }: { etiqueta: ReactNode; valor: number; escala: number; clase: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-center gap-3 text-sm">
      <span className="text-tinta-2">{etiqueta}</span>
      <span className="relative h-2.5 rounded-full bg-neutro-suave">
        <span className={`absolute inset-y-0 left-0 rounded-full ${clase}`} style={{ width: `${(Math.max(0, valor) / escala) * 100}%` }} />
      </span>
    </div>
  );
}
