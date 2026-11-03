"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ETAPAS } from "@/config/etapas";
import { useAncho } from "@/hooks/useAncho";
import { useTween } from "@/hooks/useTween";
import { formatearEntero, formatearMxn, formatearMxnCorto, formatearPct, formatearPp } from "@/lib/formato";
import { calcularGeometria, partirTexto, type Geometria, type Orientacion } from "./geometria";
import { TooltipCauce, type ContenidoTooltip } from "./TooltipCauce";

export type PozaRio = { id: string; desde: number; volumen: number; valor: number; nombre: string; causa: string };

export type Activo = { tipo: "etapa" | "transicion"; indice: number } | { tipo: "poza"; id: string };

type Props = {
  volumen: readonly number[];
  anterior: readonly number[] | null;
  referencia: number;
  tasas: readonly (number | null)[];
  deltas: readonly (number | null)[];
  pozas: readonly PozaRio[];
  seleccion: { tipo: "etapa" | "transicion"; indice: number } | null;
  onSeleccionar: (s: { tipo: "etapa" | "transicion"; indice: number } | null) => void;
  onAbrirPoza: (id: string) => void;
  describir: (a: Activo) => ContenidoTooltip;
};

const LLENADO = 1.2;
const CAIDA = 0.4;
const ESCALON = 0.08;
const EASE_SALIDA = [0.33, 1, 0.68, 1] as const;
const ANCHO_VERTICAL = 700;

// El llenado se orquesta una sola vez por carga de página, no en cada navegación.
let llenadoHecho = false;

/** El cauce: SVG propio con d3-scale y d3-shape. Horizontal en escritorio, vertical en móvil. */
export function RiverChart(props: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const ancho = useAncho(contenedor);
  const orientacion: Orientacion = ancho > 0 && ancho < ANCHO_VERTICAL ? "vertical" : "horizontal";

  return (
    <div ref={contenedor} className="relative w-full">
      {ancho > 0 && <Rio key={orientacion} {...props} ancho={ancho} orientacion={orientacion} />}
    </div>
  );
}

function Rio({
  ancho,
  orientacion,
  volumen,
  anterior,
  referencia,
  tasas,
  deltas,
  pozas,
  seleccion,
  onSeleccionar,
  onAbrirPoza,
  describir,
}: Props & { ancho: number; orientacion: Orientacion }) {
  const reducir = useReducedMotion() ?? false;
  const [entrada] = useState(() => !llenadoHecho && !reducir);
  useEffect(() => {
    llenadoHecho = true;
  }, []);

  // Todo lo que cambia de forma con los filtros se interpola junto en 300 ms.
  const n = volumen.length;
  const objetivo = useMemo(
    () => [...volumen, ...(anterior ?? volumen), referencia, ...pozas.map((p) => p.volumen), ...pozas.map((p) => p.valor)],
    [volumen, anterior, referencia, pozas],
  );
  const v = useTween(objetivo, 300, reducir);

  const geo = useMemo<Geometria>(
    () =>
      calcularGeometria({
        orientacion,
        ancho,
        volumen: v.slice(0, n),
        anterior: anterior ? v.slice(n, 2 * n) : null,
        referencia: v[2 * n],
        pozas: pozas.map((p, i) => ({
          id: p.id,
          desde: p.desde,
          volumen: v[2 * n + 1 + i],
          valor: v[2 * n + 1 + pozas.length + i],
        })),
      }),
    [orientacion, ancho, v, n, anterior, pozas],
  );

  const [activo, setActivo] = useState<Activo | null>(null);
  const [focoVisible, setFocoVisible] = useState<string | null>(null);
  const horizontal = orientacion === "horizontal";

  const claveActivo = (a: Activo | null) => (!a ? null : a.tipo === "poza" ? `poza:${a.id}` : `${a.tipo}:${a.indice}`);
  const esActivo = (a: Activo) => claveActivo(activo) === claveActivo(a);
  const esSeleccion = (tipo: "etapa" | "transicion", indice: number) => seleccion?.tipo === tipo && seleccion.indice === indice;

  // Retrasos de la entrada: cada rótulo aparece cuando el agua llega a su posición.
  const llegada = (s: number) => (entrada ? LLENADO * Math.pow(s / geo.fin, 1.6) : 0);
  const caida = (i: number) => (entrada ? LLENADO + 0.1 + i * ESCALON : 0);

  const interactivo = (a: Activo, etiqueta: string, accion: () => void, hijos: ReactNode) => {
    const clave = claveActivo(a)!;
    return (
      <g
        key={clave}
        role="button"
        tabIndex={0}
        data-clave={clave}
        aria-label={etiqueta}
        aria-pressed={a.tipo !== "poza" ? esSeleccion(a.tipo, a.indice) : undefined}
        className="cursor-pointer outline-none"
        onPointerEnter={() => setActivo(a)}
        onPointerLeave={() => setActivo((x) => (claveActivo(x) === clave ? null : x))}
        onFocus={(e) => {
          setActivo(a);
          setFocoVisible(e.currentTarget.matches(":focus-visible") ? clave : null);
        }}
        onBlur={() => {
          setActivo((x) => (claveActivo(x) === clave ? null : x));
          setFocoVisible(null);
        }}
        onClick={accion}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            accion();
          }
        }}
      >
        {hijos}
      </g>
    );
  };

  const alternarSeleccion = (tipo: "etapa" | "transicion", indice: number) =>
    onSeleccionar(esSeleccion(tipo, indice) ? null : { tipo, indice });

  const tooltip = activo ? describir(activo) : null;
  const ancla = activo ? anclaTooltip(geo, activo) : null;

  return (
    <>
      <svg
        width={ancho}
        height={geo.alto}
        viewBox={`0 0 ${ancho} ${geo.alto}`}
        role="group"
        aria-label="Cauce del journey: volumen por etapa, conversión entre etapas y pozas de fuga"
        className="block overflow-visible"
        onKeyDown={(e) => {
          if (e.key === "Escape") onSeleccionar(null);
        }}
      >
        <defs>
          <linearGradient id="agua" x1="0" y1="0" x2={horizontal ? 1 : 0} y2={horizontal ? 0 : 1}>
            <stop offset={0} stopColor="var(--cauce)" stopOpacity={0.15} />
            <stop offset={geo.etapas[0].s / geo.fin} stopColor="var(--cauce)" stopOpacity={1} />
            <stop offset={geo.etapas[n - 1].s / geo.fin} stopColor="var(--cauce)" stopOpacity={0.8} />
            <stop offset={1} stopColor="var(--cauce)" stopOpacity={0.2} />
          </linearGradient>
          <linearGradient
            id="corriente"
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={horizontal ? geo.finCorrientes : 0}
            y2={horizontal ? 0 : geo.finCorrientes}
          >
            <stop offset={0} stopColor="var(--papel)" stopOpacity={0} />
            <stop offset={0.2} stopColor="var(--papel)" stopOpacity={0.2} />
            <stop offset={0.7} stopColor="var(--papel)" stopOpacity={0.16} />
            <stop offset={1} stopColor="var(--papel)" stopOpacity={0} />
          </linearGradient>
          <clipPath id="forma-rio">
            <path d={geo.rio} />
          </clipPath>
          <clipPath id="llenado">
            <motion.rect
              x={0}
              y={0}
              initial={entrada ? (horizontal ? { width: 0 } : { height: 0 }) : false}
              animate={horizontal ? { width: ancho } : { height: geo.alto }}
              width={horizontal ? undefined : ancho}
              height={horizontal ? geo.alto : undefined}
              transition={{ duration: LLENADO, ease: EASE_SALIDA }}
            />
          </clipPath>
        </defs>

        {/* Guías de etapa */}
        <g aria-hidden>
          {geo.etapas.map((e, i) => {
            const marcada = esSeleccion("etapa", i) || esActivo({ tipo: "etapa", indice: i });
            const borde = geo.centro - e.grosor / 2 - 8;
            return horizontal ? (
              <line key={i} x1={e.x} x2={e.x} y1={56} y2={borde} className={guia(marcada)} />
            ) : (
              <line key={i} y1={e.y} y2={e.y} x1={MARGEN_ETIQUETA_V} x2={borde} className={guia(marcada)} />
            );
          })}
        </g>


        {/* Hilos de fuga: bajan del río a cada poza */}
        <g aria-hidden>
          {geo.pozas.map((p, i) => (
            <motion.path
              key={p.id}
              d={p.hilo}
              fill="none"
              stroke="var(--oxido)"
              strokeOpacity={esActivo({ tipo: "poza", id: p.id }) ? 1 : 0.78}
              strokeWidth={p.grosorHilo}
              strokeLinecap="round"
              initial={entrada ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ duration: CAIDA, delay: caida(i), ease: "easeIn" }}
            />
          ))}
        </g>

        {/* El agua */}
        <g clipPath="url(#llenado)">
          {/* Fondo opaco: los hilos nacen debajo del agua y no se transparentan */}
          <path d={geo.rio} fill="var(--concreto)" />
          <path d={geo.rio} fill="url(#agua)" />
          {geo.corrientes.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="url(#corriente)" strokeWidth={1} aria-hidden />
          ))}
        </g>

        {/* Período anterior: orillas punteadas. Afuera del agua en niebla; adentro, claras y recortadas al río. */}
        {geo.rioAnterior && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} aria-hidden>
            <path d={geo.rioAnterior} fill="none" stroke="var(--niebla)" strokeWidth={1.25} strokeDasharray="4 4" />
            <path
              d={geo.rioAnterior}
              fill="none"
              stroke="var(--papel)"
              strokeOpacity={0.75}
              strokeWidth={1.25}
              strokeDasharray="4 4"
              clipPath="url(#forma-rio)"
            />
          </motion.g>
        )}

        {/* Etapas y transiciones, en orden de lectura para el teclado */}
        {geo.etapas.map((e, i) => {
          const etapa = ETAPAS[i];
          const t = geo.transiciones[i];
          const seleccionada = esSeleccion("etapa", i);
          const etiquetaEtapa = `${etapa.nombre}: ${formatearEntero(volumen[i])}`;
          return [
            interactivo(
              { tipo: "etapa", indice: i },
              etiquetaEtapa,
              () => alternarSeleccion("etapa", i),
              <motion.g
                initial={entrada ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: llegada(e.s) }}
              >
                {horizontal ? (
                  <>
                    <rect x={e.x - geo.paso * 0.22} y={0} width={geo.paso * 0.44} height={geo.centro + geo.grosorMax / 2} fill="transparent" />
                    <rect
                      x={e.x - Math.min(62, geo.paso * 0.48)}
                      y={-2}
                      width={Math.min(124, geo.paso * 0.96)}
                      height={54}
                      rx={8}
                      fill={seleccionada ? "var(--cauce-suave)" : "transparent"}
                      className={focoVisible === `etapa:${i}` ? "stroke-cauce" : ""}
                      strokeWidth={2}
                    />
                    <text x={e.x} y={18} textAnchor="middle" className={`${geo.compacto ? "text-xs" : "text-sm"} ${seleccionada ? "fill-cauce font-medium" : "fill-niebla"}`}>
                      {etapa.nombre}
                    </text>
                    <text x={e.x} y={42} textAnchor="middle" className={`cifra fill-tinta font-semibold ${geo.compacto ? "text-base" : "text-lg"}`}>
                      {formatearEntero(volumen[i])}
                    </text>
                  </>
                ) : (
                  <>
                    <rect x={-6} y={e.y - geo.paso / 4} width={geo.centro + geo.grosorMax / 2 + 6} height={geo.paso / 2} fill="transparent" />
                    <rect
                      x={-6}
                      y={e.y - 24}
                      width={MARGEN_ETIQUETA_V - 2}
                      height={46}
                      rx={8}
                      fill={seleccionada ? "var(--cauce-suave)" : "transparent"}
                      className={focoVisible === `etapa:${i}` ? "stroke-cauce" : ""}
                      strokeWidth={2}
                    />
                    <text x={0} y={e.y - 6} className={`text-xs ${seleccionada ? "fill-cauce font-medium" : "fill-niebla"}`}>
                      {etapa.nombre}
                    </text>
                    <text x={0} y={e.y + 14} className="cifra fill-tinta text-base font-semibold">
                      {formatearEntero(volumen[i])}
                    </text>
                  </>
                )}
              </motion.g>,
            ),
            t &&
              interactivo(
                { tipo: "transicion", indice: i },
                `${etapa.nombre} → ${ETAPAS[i + 1].nombre}: conversión ${formatearPct(tasas[i])}, ${formatearPp(deltas[i])} vs. período anterior`,
                () => alternarSeleccion("transicion", i),
                <motion.g
                  initial={entrada ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, delay: llegada(t.s) }}
                >
                  <Tasa
                    geo={geo}
                    indice={i}
                    tasa={tasas[i]}
                    delta={deltas[i]}
                    seleccionada={esSeleccion("transicion", i)}
                    resaltada={esActivo({ tipo: "transicion", indice: i })}
                    foco={focoVisible === `transicion:${i}`}
                  />
                </motion.g>,
              ),
          ];
        })}
        {/* Pozas */}
        {geo.pozas.map((p, i) => {
          const poza = pozas[i];
          const a: Activo = { tipo: "poza", id: p.id };
          const marcada = esActivo(a);
          const lineas = partirTexto(poza.nombre, horizontal ? (geo.compacto ? 14 : 24) : 20);
          const textoX = horizontal ? p.x : geo.columnaPozas;
          const anclaje = horizontal ? "middle" : "start";
          const y0 = p.y + p.ry + 16;
          return interactivo(
            a,
            `${poza.causa}: ${formatearEntero(pozas[i].volumen)} perdidos, ${formatearMxn(pozas[i].valor)}. Abrir en Fugas`,
            () => onAbrirPoza(p.id),
            <motion.g
              initial={entrada ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: caida(i) + CAIDA * 0.8 }}
            >
              <rect
                x={horizontal ? p.x - (geo.compacto ? 58 : 80) : geo.columnaPozas - 6}
                y={p.y - p.ry - 8}
                width={horizontal ? (geo.compacto ? 116 : 160) : ancho - geo.columnaPozas + 6}
                height={p.ry * 2 + 30 + lineas.length * 16 + 22}
                rx={10}
                fill="transparent"
                className={focoVisible === `poza:${p.id}` ? "stroke-cauce" : ""}
                strokeWidth={2}
              />
              <ellipse
                cx={p.x}
                cy={p.y}
                rx={p.rx}
                ry={p.ry}
                fill="var(--oxido-suave)"
                stroke="var(--oxido)"
                strokeWidth={marcada ? 1.5 : 1}
                className="motion-safe:transition-[stroke-width]"
              />
              {lineas.map((l, k) => (
                <text key={k} x={textoX} y={y0 + k * 15} textAnchor={anclaje} className="fill-tinta text-xs font-medium">
                  {l}
                </text>
              ))}
              <text x={textoX} y={y0 + lineas.length * 15 + 4} textAnchor={anclaje} className="cifra fill-laton text-sm font-semibold">
                {formatearMxnCorto(pozas[i].valor)}
              </text>
              <text x={textoX} y={y0 + lineas.length * 15 + 20} textAnchor={anclaje} className="cifra fill-niebla text-xs">
                {formatearEntero(pozas[i].volumen)} perdidos
              </text>
            </motion.g>,
          );
        })}

      </svg>

      {tooltip && ancla && <TooltipCauce contenido={tooltip} x={ancla.x} y={ancla.y} arriba={ancla.arriba} anchoContenedor={ancho} />}
    </>
  );
}

const MARGEN_ETIQUETA_V = 96;

function guia(marcada: boolean): string {
  return `${marcada ? "stroke-cauce" : "stroke-linea-fuerte"} motion-safe:transition-colors`;
}

function Tasa({
  geo,
  indice,
  tasa,
  delta,
  seleccionada,
  resaltada,
  foco,
}: {
  geo: Geometria;
  indice: number;
  tasa: number | null;
  delta: number | null;
  seleccionada: boolean;
  resaltada: boolean;
  foco: boolean;
}) {
  const t = geo.transiciones[indice];
  const tono = delta === null || Math.abs(delta) < 0.05 ? "fill-niebla" : delta > 0 ? "fill-cauce" : "fill-oxido";
  const flecha = delta === null || Math.abs(delta) < 0.05 ? "" : delta > 0 ? "↑ " : "↓ ";
  const fondo = seleccionada ? "var(--cauce-suave)" : resaltada ? "var(--papel)" : "transparent";

  if (geo.orientacion === "horizontal") {
    const izquierda = geo.etapas[indice].x + geo.paso * 0.22;
    const ancho = geo.paso * 0.56;
    return (
      <>
        <rect x={izquierda} y={56} width={ancho} height={geo.centro + geo.grosorMax / 2 - 56} fill="transparent" />
        <rect
          x={t.x - Math.min(46, geo.paso * 0.45)}
          y={64}
          width={Math.min(92, geo.paso * 0.9)}
          height={44}
          rx={8}
          fill={fondo}
          className={`motion-safe:transition-colors ${foco ? "stroke-cauce" : ""}`}
          strokeWidth={2}
        />
        <text x={t.x} y={84} textAnchor="middle" className="cifra fill-tinta text-sm font-medium">
          {formatearPct(tasa)}
        </text>
        <text x={t.x} y={100} textAnchor="middle" className={`cifra text-xs ${tono}`}>
          {flecha}
          {formatearPp(delta)}
        </text>
      </>
    );
  }
  return (
    <>
      {/* Zona de toque contigua a la de las etapas vecinas */}
      <rect x={-6} y={t.y - geo.paso / 4} width={geo.centro + geo.grosorMax / 2 + 6} height={geo.paso / 2} fill="transparent" />
      <rect x={-6} y={t.y - 22} width={MARGEN_ETIQUETA_V - 2} height={42} rx={8} fill={fondo} className={foco ? "stroke-cauce" : ""} strokeWidth={2} />
      <text x={0} y={t.y - 4} className="cifra fill-tinta text-xs font-medium">
        {formatearPct(tasa)}
      </text>
      <text x={0} y={t.y + 12} className={`cifra text-xs ${tono}`}>
        {flecha}
        {formatearPp(delta)}
      </text>
    </>
  );
}

function anclaTooltip(geo: Geometria, a: Activo): { x: number; y: number; arriba: boolean } {
  const horizontal = geo.orientacion === "horizontal";
  if (a.tipo === "poza") {
    const p = geo.pozas.find((q) => q.id === a.id)!;
    return horizontal ? { x: p.x, y: p.y - p.ry - 12, arriba: true } : { x: geo.columnaPozas, y: p.y - p.ry - 10, arriba: true };
  }
  const punto = a.tipo === "etapa" ? geo.etapas[a.indice] : geo.transiciones[a.indice];
  const grosor = a.tipo === "etapa" ? geo.etapas[a.indice].grosor : (geo.etapas[a.indice].grosor + geo.etapas[a.indice + 1].grosor) / 2;
  return horizontal
    ? { x: punto.x, y: geo.centro + grosor / 2 + 14, arriba: false }
    : { x: geo.centro + grosor / 2 + 12, y: punto.y + 18, arriba: false };
}
