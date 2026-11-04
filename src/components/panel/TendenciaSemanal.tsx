"use client";

import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { motion, useReducedMotion } from "motion/react";
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

const CURVA_ENTRADA = [0.22, 1, 0.36, 1] as const;

/**
 * Tendencia semanal con marcadores de despliegue de experimentos. Con `animarEntrada`, la línea se dibuja de
 * izquierda a derecha (1.2 s) y el área entra con fade. Desde `simuladosDesde` (índice), los puntos son
 * simulados (demo en vivo): línea punteada al 60 %, cada tramo nuevo se extiende con animación, su marcador
 * pulsa una vez y el último lleva el rótulo "Simulado".
 */
export function TendenciaSemanal({
  puntos,
  formato,
  marcadores,
  franja,
  descripcion,
  animarEntrada = false,
  simuladosDesde,
}: {
  puntos: PuntoSerie[];
  formato: (v: number) => string;
  marcadores: Marcador[];
  franja?: Franja;
  descripcion: string;
  animarEntrada?: boolean;
  simuladosDesde?: number;
}) {
  const reducir = useReducedMotion() ?? false;
  const animar = animarEntrada && !reducir;
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
  const esSimulado = (i: number) => simuladosDesde !== undefined && i >= simuladosDesde;
  const reales = validos.filter((p) => !esSimulado(p.i));
  const simulados = validos.filter((p) => esSimulado(p.i));
  const ultimoSimulado = simulados[simulados.length - 1];

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
              <text x={ancho} y={sy(v) + 4} textAnchor="end" className="cifra fill-tinta-2 text-xs">
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
                  <rect x={x0} y={M.arriba - 4} width={x1 - x0} height={ALTO - M.abajo - M.arriba + 4} fill="var(--coral)" fillOpacity={0.1} />
                  <text
                    x={Math.min(Math.max((x0 + x1) / 2, franja.etiqueta.length * 3.4), ancho - M.derecha - franja.etiqueta.length * 3.4)}
                    y={ALTO - M.abajo - 6}
                    textAnchor="middle"
                    className="fill-tinta text-xs"
                  >
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
                <line x1={x} x2={x} y1={M.arriba - 8} y2={ALTO - M.abajo} className="stroke-coral" strokeDasharray="3 3" />
                <text x={haciaIzquierda ? x - 4 : x + 4} y={M.arriba - 12} textAnchor={haciaIzquierda ? "end" : "start"} className="fill-tinta text-xs">
                  {texto}
                </text>
              </g>
            );
          })}
          <motion.path
            d={relleno(reales) ?? ""}
            fill="var(--azul-suave)"
            initial={animar ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: CURVA_ENTRADA }}
          />
          <motion.path
            d={trazo(reales) ?? ""}
            fill="none"
            stroke="var(--azul-relleno)"
            strokeWidth={2}
            initial={animar ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: CURVA_ENTRADA }}
          />
          {/* Semanas simuladas: cada tramo nuevo se extiende de izquierda a derecha (clip que crece). */}
          {simulados.map((p, k) => {
            const previo = k === 0 ? reales[reales.length - 1] : simulados[k - 1];
            if (!previo) return null;
            const x0 = sx(previo.i);
            const x1 = sx(p.i);
            return (
              <g key={`sim-${p.i}`}>
                <clipPath id={`tramo-${p.i}`}>
                  <motion.rect x={x0 - 2} y={0} height={ALTO} initial={reducir ? false : { width: 0 }} animate={{ width: x1 - x0 + 4 }} transition={{ duration: 0.45, ease: CURVA_ENTRADA }} />
                </clipPath>
                <path
                  d={trazo([previo, p]) ?? ""}
                  clipPath={`url(#tramo-${p.i})`}
                  fill="none"
                  stroke="var(--azul-relleno)"
                  strokeOpacity={0.6}
                  strokeWidth={2}
                  strokeDasharray="4 3"
                />
              </g>
            );
          })}
          {validos.map((p) => (
            <circle
              key={p.i}
              cx={sx(p.i)}
              cy={sy(p.valor)}
              r={p.i === indice ? 4 : 2}
              fill="var(--azul-relleno)"
              fillOpacity={esSimulado(p.i) ? 0.6 : 1}
              stroke="var(--tarjeta)"
              strokeWidth={p.i === indice ? 2 : 0}
            />
          ))}
          {ultimoSimulado && !reducir && (
            <motion.circle
              key={`pulso-${ultimoSimulado.i}`}
              cx={sx(ultimoSimulado.i)}
              cy={sy(ultimoSimulado.valor)}
              fill="none"
              stroke="var(--azul-relleno)"
              strokeWidth={1.5}
              initial={{ r: 3, opacity: 0.8 }}
              animate={{ r: 11, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          )}
          {ultimoSimulado && (
            <text x={Math.min(sx(ultimoSimulado.i), ancho - M.derecha)} y={sy(ultimoSimulado.valor) + 18} textAnchor="end" className="fill-tinta-2 text-xs">
              Simulado
            </text>
          )}
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
          <text x={sx(0)} y={ALTO - 4} className="fill-tinta-2 text-xs">
            {formatearSemanaCorta(puntos[0].semana)}
          </text>
          {puntoActivo && puntoActivo.i !== 0 && puntoActivo.i !== puntos.length - 1 && (
            <text x={sx(puntoActivo.i)} y={ALTO - 4} textAnchor="middle" className="fill-tinta text-xs">
              {formatearSemanaCorta(puntoActivo.semana)}
            </text>
          )}
          <text x={sx(puntos.length - 1)} y={ALTO - 4} textAnchor="end" className="fill-tinta-2 text-xs">
            {formatearSemanaCorta(puntos[puntos.length - 1].semana)}
          </text>
        </svg>
      )}
    </div>
  );
}
