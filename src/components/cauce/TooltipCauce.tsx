"use client";

import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { motion } from "motion/react";

export type FilaTooltip = { etiqueta: string; valor: string; tono?: "cauce" | "oxido" | "laton" | "niebla" };

export type ContenidoTooltip = {
  titulo: string;
  subtitulo?: string;
  filas: FilaTooltip[];
  serie?: { valores: (number | null)[]; etiqueta: string };
  pie?: string;
};

const ANCHO = 248;
const TONO: Record<NonNullable<FilaTooltip["tono"]>, string> = {
  cauce: "text-cauce-texto",
  oxido: "text-oxido-texto",
  laton: "text-laton-texto",
  niebla: "text-niebla",
};

export function TooltipCauce({
  contenido,
  x,
  y,
  arriba,
  anchoContenedor,
}: {
  contenido: ContenidoTooltip;
  x: number;
  y: number;
  arriba: boolean;
  anchoContenedor: number;
}) {
  const izquierda = Math.max(0, Math.min(anchoContenedor - ANCHO, x - ANCHO / 2));
  return (
    <motion.div
      role="tooltip"
      initial={{ opacity: 0, y: arriba ? 4 : -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      style={{ left: izquierda, top: y, width: ANCHO, translate: arriba ? "0 -100%" : undefined }}
      className="pointer-events-none absolute z-20 rounded-panel border border-linea bg-papel p-3 shadow-flotante"
    >
      <p className="text-sm font-medium leading-snug">{contenido.titulo}</p>
      {contenido.subtitulo && <p className="mt-0.5 text-xs text-niebla">{contenido.subtitulo}</p>}
      <dl className="mt-2 flex flex-col gap-1">
        {contenido.filas.map((f) => (
          <div key={f.etiqueta} className="flex items-baseline justify-between gap-3 text-xs">
            <dt className="text-niebla">{f.etiqueta}</dt>
            <dd className={`cifra text-sm font-medium ${f.tono ? TONO[f.tono] : ""}`}>{f.valor}</dd>
          </div>
        ))}
      </dl>
      {contenido.serie && <Sparkline {...contenido.serie} />}
      {contenido.pie && <p className="mt-2 border-t border-linea pt-2 text-xs text-niebla">{contenido.pie}</p>}
    </motion.div>
  );
}

function Sparkline({ valores, etiqueta }: { valores: (number | null)[]; etiqueta: string }) {
  const w = ANCHO - 24;
  const h = 36;
  const puntos = valores.map((v, i) => [i, v] as const).filter((p): p is readonly [number, number] => p[1] !== null);
  if (puntos.length < 2) return null;
  const ys = puntos.map((p) => p[1]);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const holgura = (max - min) * 0.15 || Math.abs(max) * 0.05 || 1;
  const sx = scaleLinear().domain([0, valores.length - 1]).range([2, w - 2]);
  const sy = scaleLinear().domain([min - holgura, max + holgura]).range([h - 2, 2]);
  const trazo = line<readonly [number, number]>().x((p) => sx(p[0])).y((p) => sy(p[1])).curve(curveMonotoneX);
  const relleno = area<readonly [number, number]>().x((p) => sx(p[0])).y0(h).y1((p) => sy(p[1])).curve(curveMonotoneX);
  const ultimo = puntos[puntos.length - 1];

  return (
    <figure className="mt-3">
      <svg width={w} height={h} aria-hidden className="block overflow-visible">
        <path d={relleno(puntos) ?? ""} fill="var(--cauce-suave)" />
        <path d={trazo(puntos) ?? ""} fill="none" stroke="var(--cauce)" strokeWidth={1.5} />
        <circle cx={sx(ultimo[0])} cy={sy(ultimo[1])} r={2.5} fill="var(--cauce)" />
      </svg>
      <figcaption className="mt-1 text-xs text-niebla">{etiqueta}</figcaption>
    </figure>
  );
}
