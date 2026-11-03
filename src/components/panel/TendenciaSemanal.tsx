"use client";

import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { useRef, useState } from "react";
import { useAncho } from "@/hooks/useAncho";
import { formatearSemanaCorta } from "@/lib/formato";

export type PuntoSerie = { semana: string; valor: number | null };
export type Marcador = { semana: string; etiqueta: string };
/** Tramo sombreado (por ejemplo, la ventana de lectura de un experimento). Semanas en ISO de lunes. */
export type Franja = { desde: string; hasta: string; etiqueta: string };

const ALTO = 168;
// A la derecha queda una columna para los rótulos de mínimo y máximo.
const M = { arriba: 24, abajo: 22, izquierda: 4, derecha: 52 };
const ANCHO_CARACTER = 6.4;

/** Tendencia de 12 semanas con marcadores de despliegue de experimentos. */
export function TendenciaSemanal({
  puntos,
  formato,
  marcadores,
  franja,
  descripcion,
}: {
  puntos: PuntoSerie[];
  formato: (v: number) => string;
  marcadores: Marcador[];
  franja?: Franja;
  descripcion: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ancho = useAncho(ref);
  const [activo, setActivo] = useState<number | null>(null);

  const validos = puntos.map((p, i) => ({ ...p, i })).filter((p): p is { semana: string; valor: number; i: number } => p.valor !== null);
  const valores = validos.map((p) => p.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const holgura = (max - min) * 0.2 || Math.abs(max) * 0.05 || 1;
  const sx = scaleLinear().domain([0, puntos.length - 1]).range([M.izquierda + 6, Math.max(M.izquierda + 7, ancho - M.derecha - 6)]);
  const sy = scaleLinear().domain([min - holgura, max + holgura]).range([ALTO - M.abajo, M.arriba]);
  const trazo = line<{ i: number; valor: number }>().x((p) => sx(p.i)).y((p) => sy(p.valor)).curve(curveMonotoneX);
  const relleno = area<{ i: number; valor: number }>().x((p) => sx(p.i)).y0(ALTO - M.abajo).y1((p) => sy(p.valor)).curve(curveMonotoneX);
  const indice = activo ?? validos[validos.length - 1]?.i ?? null;
  const puntoActivo = validos.find((p) => p.i === indice);

  return (
    <div ref={ref} className="relative">
      {ancho > 0 && validos.length > 1 && (
        <svg
          width={ancho}
          height={ALTO}
          role="img"
          aria-label={descripcion}
          className="block overflow-visible"
          onPointerLeave={() => setActivo(null)}
          onPointerMove={(e) => {
            const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
            setActivo(Math.max(0, Math.min(puntos.length - 1, Math.round(sx.invert(x)))));
          }}
        >
          {[min, max].map((v, k) => (
            <g key={k}>
              <line x1={0} x2={ancho - M.derecha + 8} y1={sy(v)} y2={sy(v)} className="stroke-linea" strokeDasharray="2 4" />
              <text x={ancho} y={sy(v) + 4} textAnchor="end" className="cifra fill-niebla text-xs">
                {formato(v)}
              </text>
            </g>
          ))}
          {franja &&
            (() => {
              const a = puntos.findIndex((p) => p.semana >= franja.desde);
              const ultimo = puntos.map((p) => p.semana <= franja.hasta).lastIndexOf(true);
              if (a === -1 || ultimo < a) return null;
              const x0 = sx(a) - 4;
              const x1 = sx(ultimo) + 4;
              return (
                <g>
                  <rect x={x0} y={M.arriba - 4} width={x1 - x0} height={ALTO - M.abajo - M.arriba + 4} fill="var(--laton)" fillOpacity={0.1} />
                  <text x={(x0 + x1) / 2} y={ALTO - M.abajo - 6} textAnchor="middle" className="fill-laton text-xs">
                    {franja.etiqueta}
                  </text>
                </g>
              );
            })()}
          {marcadores.map((m) => {
            const i = puntos.findIndex((p) => p.semana === m.semana);
            if (i === -1) return null;
            const x = sx(i);
            // El rótulo se abre hacia el lado con más lugar y se recorta para no salir del gráfico.
            const haciaIzquierda = x > ancho / 2;
            const lugar = Math.floor((haciaIzquierda ? x - 4 : ancho - x - 4) / ANCHO_CARACTER);
            const texto = m.etiqueta.length > lugar ? `${m.etiqueta.slice(0, Math.max(0, lugar - 1))}…` : m.etiqueta;
            return (
              <g key={m.semana + m.etiqueta}>
                <title>{m.etiqueta}</title>
                <line x1={x} x2={x} y1={M.arriba - 8} y2={ALTO - M.abajo} className="stroke-laton" strokeDasharray="3 3" />
                <text x={haciaIzquierda ? x - 4 : x + 4} y={M.arriba - 12} textAnchor={haciaIzquierda ? "end" : "start"} className="fill-laton text-xs">
                  {texto}
                </text>
              </g>
            );
          })}
          <path d={relleno(validos) ?? ""} fill="var(--cauce-suave)" />
          <path d={trazo(validos) ?? ""} fill="none" stroke="var(--cauce)" strokeWidth={2} />
          {validos.map((p) => (
            <circle key={p.i} cx={sx(p.i)} cy={sy(p.valor)} r={p.i === indice ? 4 : 2} fill="var(--cauce)" stroke="var(--papel)" strokeWidth={p.i === indice ? 2 : 0} />
          ))}
          {puntoActivo && (
            <text
              x={Math.min(Math.max(sx(puntoActivo.i), 30), ancho - 30)}
              y={sy(puntoActivo.valor) - 10}
              textAnchor="middle"
              className="cifra fill-tinta text-sm font-semibold"
            >
              {formato(puntoActivo.valor)}
            </text>
          )}
          <text x={sx(0)} y={ALTO - 4} className="fill-niebla text-xs">
            {formatearSemanaCorta(puntos[0].semana)}
          </text>
          {puntoActivo && puntoActivo.i !== 0 && puntoActivo.i !== puntos.length - 1 && (
            <text x={sx(puntoActivo.i)} y={ALTO - 4} textAnchor="middle" className="fill-tinta text-xs">
              {formatearSemanaCorta(puntoActivo.semana)}
            </text>
          )}
          <text x={sx(puntos.length - 1)} y={ALTO - 4} textAnchor="end" className="fill-niebla text-xs">
            {formatearSemanaCorta(puntos[puntos.length - 1].semana)}
          </text>
        </svg>
      )}
    </div>
  );
}
