"use client";

import { scaleLinear, scaleSqrt } from "d3-scale";
import { curveBasis, curveNatural, line } from "d3-shape";
import { animate, cancelFrame, frame, motion, useMotionValue, useTransform, type Transition } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { formatearEntero, formatearMxnCorto, formatearPuntos } from "@/lib/formato";
import { CURVA_ENTRADA, CURVA_ESTADO, DURACION_CONTEO, DURACION_CROSSFADE, DURACION_ENTRADA, DURACION_ESTADO, ESCALONADO_NODOS } from "./actos";
import type { Modo } from "./useActos";

export type EtapaEscena = { id: string; nombre: string; volumen: number; tasa: number | null };
export type PozaEscena = { id: string; nombre: string; desde: number; volumen: number; valor: number };
export type DatosEscena = {
  etapas: EtapaEscena[];
  pozas: PozaEscena[];
  valorEnRiesgo: number;
  /** Poza del modelo de pérdida (hilo de retorno del acto 3). */
  modelo: PozaEscena | null;
  experimento: { nombre: string; prediccionPp: number; desde: number } | null;
};

type Punto = { x: number; y: number };
type PozaGeo = PozaEscena & { cx: number; cy: number; w: number; h: number; nivel: number; desvio: string; inicioDesvio: number };

const PUNTOS = { escritorio: 36, movil: 20 };
const VELOCIDAD = { escritorio: 70, movil: 46 }; // unidades del viewBox por segundo
const PASO_MUESTRA = 2;
const ANCHO_BARRA = { escritorio: 64, movil: 48 };
const easeOutCubic = [0.33, 1, 0.68, 1] as const;

/** Toda la geometría sale de los datos y de la orientación: horizontal (16:9) o vertical (móvil). */
function geometria(datos: DatosEscena, movil: boolean) {
  const W = movil ? 360 : 960;
  const H = movil ? 660 : 480;
  const n = datos.etapas.length;
  const nodos: Punto[] = datos.etapas.map((_, i) =>
    movil ? { x: 150, y: 96 + (i * (570 - 96)) / (n - 1) } : { x: 70 + (i * (890 - 70)) / (n - 1), y: 186 },
  );
  const inicio = nodos[0];
  const largo = movil ? nodos[n - 1].y - inicio.y : nodos[n - 1].x - inicio.x;
  const enEspina = (s: number): Punto => (movil ? { x: inicio.x, y: inicio.y + s } : { x: inicio.x + s, y: inicio.y });
  const perpendicular = (p: Punto, d: number): Punto => (movil ? { x: p.x + d, y: p.y } : { x: p.x, y: p.y + d });
  const medioDe = (i: number) => (largo * (i + 0.5)) / (n - 1);

  const maxValor = Math.max(1, ...datos.pozas.map((p) => p.valor));
  const radio = scaleSqrt()
    .domain([0, maxValor])
    .range(movil ? [9, 28] : [12, 40]);
  const curva = line<Punto>()
    .x((p) => p.x)
    .y((p) => p.y)
    .curve(curveBasis);

  const vistas = new Map<number, number>();
  const pozas: PozaGeo[] = datos.pozas.map((p) => {
    const k = vistas.get(p.desde) ?? 0;
    vistas.set(p.desde, k + 1);
    const r = radio(p.valor);
    const w = 2 * r;
    const h = 1.4 * r;
    const medio = enEspina(medioDe(p.desde));
    const cx = movil ? 244 + k * 70 : medio.x;
    const cy = movil ? medio.y : 298 + k * 92;
    const inicioDesvio = medioDe(p.desde) - 16;
    const destino = movil ? { x: cx - w / 2 + 5, y: cy } : { x: cx, y: cy - h / 2 + 5 };
    const desvio = curva([enEspina(inicioDesvio), perpendicular(enEspina(inicioDesvio + 12), 14), destino]) ?? "";
    const etapa = datos.etapas[p.desde];
    const nivel = 0.3 + 0.55 * Math.min(1, etapa.volumen > 0 ? p.volumen / etapa.volumen / 0.5 : 0);
    return { ...p, cx, cy, w, h, nivel, desvio, inicioDesvio };
  });

  const modelo = datos.modelo ? (pozas.find((p) => p.id === datos.modelo!.id) ?? null) : null;
  const hacia = modelo ? nodos[modelo.desde + 1] : null;
  const retorno =
    modelo && hacia
      ? (line<Punto>()
          .x((p) => p.x)
          .y((p) => p.y)
          .curve(curveNatural)(
          movil
            ? [
                { x: modelo.cx, y: modelo.cy + modelo.h / 2 },
                { x: modelo.cx - 26, y: hacia.y + 4 },
                { x: hacia.x + 9, y: hacia.y + 1 },
              ]
            : [
                { x: modelo.cx + modelo.w / 2, y: modelo.cy },
                { x: hacia.x + 30, y: (modelo.cy + hacia.y) / 2 + 8 },
                { x: hacia.x + 2, y: hacia.y + 9 },
              ],
        ) ?? "")
      : "";

  const exp = datos.experimento;
  const anclaExp = exp ? enEspina(medioDe(exp.desde)) : null;
  const chip = exp ? (movil ? { x: 256, y: nodos[0].y + (nodos[1].y - nodos[0].y) * 0.45 } : { x: anclaExp!.x, y: 118 }) : null;

  const maxTasa = Math.max(0.01, ...datos.etapas.slice(0, -1).map((e) => e.tasa ?? 0));
  const ancho = movil ? ANCHO_BARRA.movil : ANCHO_BARRA.escritorio;
  const barra = scaleLinear().domain([0, maxTasa]).range([0, ancho]).clamp(true);

  return {
    W,
    H,
    nodos,
    largo,
    espina: `M${nodos[0].x},${nodos[0].y}L${nodos[n - 1].x},${nodos[n - 1].y}`,
    pozas,
    modelo,
    retorno,
    anclaExp,
    chip,
    barra,
    anchoBarra: ancho,
    contadores: movil
      ? { sesiones: { x: 80, y: 34 }, cierres: { x: 150, y: 620 }, riesgo: { x: 272, y: 34 } }
      : { sesiones: { x: 40, y: 50 }, cierres: { x: 920, y: 50 }, riesgo: { x: 480, y: 452 } },
  };
}

type Muestra = { largo: number; xy: Float32Array };

function muestrear(path: SVGPathElement | null): Muestra | null {
  if (!path) return null;
  let largo = 0;
  try {
    largo = path.getTotalLength();
  } catch {
    return null;
  }
  if (!(largo > 0)) return null;
  const n = Math.ceil(largo / PASO_MUESTRA) + 1;
  const xy = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const p = path.getPointAtLength(Math.min(largo, i * PASO_MUESTRA));
    xy[i * 2] = p.x;
    xy[i * 2 + 1] = p.y;
  }
  return { largo, xy };
}

const en = (m: Muestra, s: number): [number, number] => {
  const i = Math.max(0, Math.min(m.xy.length / 2 - 1, Math.round(s / PASO_MUESTRA)));
  return [m.xy[i * 2], m.xy[i * 2 + 1]];
};

/** Hash determinista 0–1 para decidir qué puntos se desvían en qué transición. */
const azar = (i: number, k: number) => (((i * 37 + k * 101 + 13) % 97) + 0.5) / 97;

/**
 * Escenario único de los 3 actos: un SVG persistente cuyo estado cambia con `acto`.
 * Los puntos se mueven en un solo loop del frameloop de motion (posiciones precalculadas con getPointAtLength).
 * Las etiquetas y cifras son HTML encima del SVG (ahí va el blur); el SVG no lleva filtros.
 */
export function EscenaCauce({
  datos,
  acto,
  modo,
  reducir,
  pausado,
  movil,
  etiqueta,
}: {
  datos: DatosEscena;
  acto: number;
  modo: Modo;
  reducir: boolean;
  pausado: boolean;
  movil: boolean;
  etiqueta: string;
}) {
  const geo = useMemo(() => geometria(datos, movil), [datos, movil]);
  const total = movil ? PUNTOS.movil : PUNTOS.escritorio;

  // Transiciones: coreografía (entrada con escalonado), salto (estado final en 0.4 s) o crossfade (reduced motion).
  const tr = (retraso: number, duracion = DURACION_ENTRADA): Transition =>
    reducir
      ? { duration: DURACION_CROSSFADE }
      : modo === "rapido"
        ? { duration: DURACION_ESTADO, ease: CURVA_ESTADO }
        : { duration: duracion, delay: retraso, ease: CURVA_ENTRADA };
  const visibleHtml = { opacity: 1, y: 0, filter: "blur(0px)" };
  const ocultoHtml = reducir ? { opacity: 0, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 20, filter: "blur(10px)" };
  const ocultoSvg = reducir ? { opacity: 0, y: 0 } : { opacity: 0, y: 12 };
  const visibleSvg = { opacity: 1, y: 0 };
  const pct = (p: Punto) => ({ left: `${(p.x / geo.W) * 100}%`, top: `${(p.y / geo.H) * 100}%` });
  const mayor = geo.pozas.reduce<PozaGeo | null>((m, p) => (!m || p.valor > m.valor ? p : m), null);

  // ——— Puntos ———
  const capa = useRef<SVGGElement>(null);
  const espina = useRef<SVGPathElement>(null);
  const desvios = useRef<(SVGPathElement | null)[]>([]);
  const retorno = useRef<SVGPathElement>(null);
  const actoRef = useRef(acto);
  const estado = useRef<{
    s: Float32Array;
    via: Int8Array;
    tiempoRetorno: number;
    muestras: { espina: Muestra | null; desvios: (Muestra | null)[]; retorno: Muestra | null };
  } | null>(null);

  useEffect(() => {
    actoRef.current = acto;
    if (estado.current && acto === 2) estado.current.tiempoRetorno = modo === "rapido" ? 900 : 0;
  }, [acto, modo]);

  // Qué poza recibe a cada punto en cada transición (−1: sigue por la espina).
  const destinos = useMemo(() => {
    const t = new Int8Array(total * (datos.etapas.length - 1)).fill(-1);
    for (let k = 0; k < datos.etapas.length - 1; k++) {
      const indices = geo.pozas.map((p, j) => (p.desde === k ? j : -1)).filter((j) => j >= 0);
      if (indices.length === 0) continue;
      const vol = indices.reduce((s, j) => s + geo.pozas[j].volumen, 0);
      const base = datos.etapas[k].volumen;
      const parte = Math.min(0.45, Math.max(0.15, base > 0 ? vol / base : 0));
      for (let i = 0; i < total; i++) {
        if (azar(i, k) >= parte) continue;
        const r = azar(i + 7, k + 3);
        let elegida = indices[indices.length - 1];
        for (let q = 0, acumulado = 0; q < indices.length; q++) {
          acumulado += geo.pozas[indices[q]].volumen / (vol || 1);
          if (acumulado >= r) {
            elegida = indices[q];
            break;
          }
        }
        t[i * (datos.etapas.length - 1) + k] = elegida;
      }
    }
    return t;
  }, [total, datos.etapas, geo.pozas]);

  // Muestreo de paths al montar o cambiar la geometría.
  useEffect(() => {
    const muestras = {
      espina: muestrear(espina.current),
      desvios: geo.pozas.map((_, j) => muestrear(desvios.current[j] ?? null)),
      retorno: muestrear(retorno.current),
    };
    const s = new Float32Array(total);
    const largo = muestras.espina?.largo ?? geo.largo;
    for (let i = 0; i < total; i++) s[i] = (largo * i) / total;
    estado.current = { s, via: new Int8Array(total).fill(-1), tiempoRetorno: 0, muestras };
  }, [geo, total]);

  useEffect(() => {
    const e = estado.current;
    const g = capa.current;
    if (!e || !g || !e.muestras.espina) return;
    const circulos = Array.from(g.querySelectorAll<SVGCircleElement>("[data-punto]"));
    const vuelta = Array.from(g.querySelectorAll<SVGCircleElement>("[data-retorno]"));
    const esp = e.muestras.espina;
    const trans = datos.etapas.length - 1;
    const tramo = esp.largo / trans;
    const velocidad = movil ? VELOCIDAD.movil : VELOCIDAD.escritorio;

    const pintar = () => {
      for (let i = 0; i < circulos.length; i++) {
        const via = e.via[i];
        const m = via >= 0 ? e.muestras.desvios[via] : esp;
        if (!m) continue;
        const [x, y] = en(m, e.s[i]);
        circulos[i].setAttribute("cx", x.toFixed(1));
        circulos[i].setAttribute("cy", y.toFixed(1));
        circulos[i].setAttribute("class", via >= 0 ? "fill-coral" : "fill-azul");
      }
      const r = e.muestras.retorno;
      vuelta.forEach((c, i) => {
        if (!r || actoRef.current < 2) return c.setAttribute("opacity", "0");
        const t = reducir ? 0.3 + i * 0.3 : (e.tiempoRetorno - 1200) / 1700 - i * 0.22;
        if (t < 0) return c.setAttribute("opacity", "0");
        const [x, y] = en(r, (t % 1) * r.largo);
        c.setAttribute("cx", x.toFixed(1));
        c.setAttribute("cy", y.toFixed(1));
        c.setAttribute("opacity", "1");
      });
    };

    if (reducir || pausado) {
      pintar();
      return;
    }

    const paso = ({ delta }: { delta: number }) => {
      const dt = Math.min(delta, 50) / 1000;
      const conFugas = actoRef.current >= 1;
      e.tiempoRetorno += dt * 1000;
      for (let i = 0; i < circulos.length; i++) {
        const antes = e.s[i];
        e.s[i] += velocidad * dt;
        const via = e.via[i];
        if (via >= 0) {
          if (e.s[i] >= (e.muestras.desvios[via]?.largo ?? 0)) {
            e.via[i] = -1;
            e.s[i] = 0;
          }
          continue;
        }
        if (conFugas) {
          const k = Math.floor((antes + 16) / tramo);
          const destino = k < trans ? destinos[i * trans + k] : -1;
          if (destino >= 0 && e.muestras.desvios[destino] && antes < geo.pozas[destino].inicioDesvio && e.s[i] >= geo.pozas[destino].inicioDesvio) {
            e.via[i] = destino;
            e.s[i] = 0;
            continue;
          }
        }
        if (e.s[i] >= esp.largo) e.s[i] -= esp.largo;
      }
      pintar();
    };
    frame.update(paso, true);
    return () => cancelFrame(paso);
  }, [geo, reducir, pausado, movil, datos.etapas.length, destinos, acto]);

  // ——— Realce único de la poza mayor (acto 2, una vez) ———
  const realce = useRef<SVGGElement>(null);
  useEffect(() => {
    if (acto !== 1 || modo !== "coreografia" || reducir || !realce.current) return;
    const control = animate(realce.current, { scale: [1, 1.12, 1] }, { duration: 0.9, delay: 2.4, ease: CURVA_ESTADO });
    return () => control.stop();
  }, [acto, modo, reducir]);

  const exp = datos.experimento;
  const expNodo = exp ? datos.etapas[exp.desde] : null;
  const extension = exp && expNodo ? Math.max(1, geo.barra((expNodo.tasa ?? 0) + exp.prediccionPp / 100) - geo.barra(expNodo.tasa ?? 0)) : 0;

  return (
    <div className="relative mx-auto" style={{ width: `min(100cqw, calc(100cqh * ${geo.W} / ${geo.H}))`, aspectRatio: `${geo.W} / ${geo.H}` }}>
      <svg viewBox={`0 0 ${geo.W} ${geo.H}`} className="absolute inset-0 size-full overflow-visible" role="img" aria-label={etiqueta}>
        {/* Espina */}
        <path d={geo.espina} className="stroke-linea" strokeWidth={2} fill="none" />
        <motion.path
          ref={espina}
          d={geo.espina}
          className="stroke-azul"
          strokeWidth={2.5}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: reducir ? 1 : 0 }}
          animate={{ pathLength: 1 }}
          transition={reducir ? { duration: 0 } : { duration: 1.1, ease: CURVA_ENTRADA }}
        />

        {/* Desvíos y pozas (acto 2) */}
        {geo.pozas.map((p, j) => {
          const visible = acto >= 1;
          const atenuada = acto >= 2 && p.id !== geo.modelo?.id;
          const retraso = 0.15 + j * 0.12;
          return (
            <motion.g
              key={p.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: visible ? (atenuada ? 0.4 : 1) : 0 }}
              transition={atenuada ? tr(0, DURACION_ESTADO) : tr(retraso)}
            >
              <path
                ref={(el) => {
                  desvios.current[j] = el;
                }}
                d={p.desvio}
                className="stroke-coral"
                strokeWidth={1.25}
                strokeOpacity={0.45}
                fill="none"
              />
              <g ref={p.id === mayor?.id ? realce : undefined} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
                <clipPath id={`poza-${p.id}`}>
                  <rect x={p.cx - p.w / 2} y={p.cy - p.h / 2} width={p.w} height={p.h} rx={p.h / 2} />
                </clipPath>
                <rect x={p.cx - p.w / 2} y={p.cy - p.h / 2} width={p.w} height={p.h} rx={p.h / 2} className="fill-tarjeta" />
                <g clipPath={`url(#poza-${p.id})`}>
                  <motion.rect
                    x={p.cx - p.w / 2}
                    width={p.w}
                    height={p.h}
                    className="fill-coral-suave"
                    initial={{ y: p.cy + p.h / 2 }}
                    animate={{ y: visible ? p.cy + p.h / 2 - p.h * p.nivel : p.cy + p.h / 2 }}
                    transition={
                      reducir
                        ? { duration: 0 }
                        : modo === "rapido"
                          ? { duration: DURACION_ESTADO, ease: CURVA_ESTADO }
                          : { duration: 1.8, delay: retraso + 0.5, ease: CURVA_ENTRADA }
                    }
                  />
                </g>
                <rect
                  x={p.cx - p.w / 2}
                  y={p.cy - p.h / 2}
                  width={p.w}
                  height={p.h}
                  rx={p.h / 2}
                  className="stroke-coral"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  fill="none"
                />
              </g>
            </motion.g>
          );
        })}

        {/* Hilo de retorno (acto 3) */}
        {geo.retorno && (
          <motion.path
            ref={retorno}
            d={geo.retorno}
            className="stroke-azul"
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={acto >= 2 ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            transition={
              reducir
                ? { duration: DURACION_CROSSFADE }
                : modo === "rapido"
                  ? { duration: DURACION_ESTADO, ease: CURVA_ESTADO }
                  : { duration: 1, delay: 0.3, ease: CURVA_ENTRADA }
            }
          />
        )}

        {/* Línea del chip del experimento a su transición (acto 3) */}
        {geo.chip && geo.anclaExp && (
          <motion.path
            d={`M${geo.chip.x},${geo.chip.y}L${geo.anclaExp.x},${geo.anclaExp.y}`}
            className="stroke-azul-texto"
            strokeWidth={1}
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={acto >= 2 ? { pathLength: 1, opacity: 0.7 } : { pathLength: 0, opacity: 0 }}
            transition={tr(1.9, 0.5)}
          />
        )}

        {/* Puntos: una sola capa, movida por el loop */}
        <motion.g
          ref={capa}
          style={{ willChange: "transform" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reducir ? { duration: DURACION_CROSSFADE } : { duration: 0.5, delay: 0.9 }}
        >
          {Array.from({ length: total }, (_, i) => (
            <circle key={i} data-punto r={movil ? 2.5 : 3} cx={-10} cy={-10} className="fill-azul" />
          ))}
          {[0, 1, 2].map((i) => (
            <circle key={`r${i}`} data-retorno r={movil ? 3 : 3.5} cx={-10} cy={-10} opacity={0} className="fill-azul-relleno" />
          ))}
        </motion.g>

        {/* Nodos y barras de avance */}
        {geo.nodos.map((p, i) => {
          const e = datos.etapas[i];
          const conBarra = i < datos.etapas.length - 1;
          const bx = movil ? p.x - 16 - geo.anchoBarra : p.x - geo.anchoBarra / 2;
          const by = movil ? p.y + 6 : p.y + 16;
          const esExp = exp?.desde === i;
          return (
            <motion.g key={e.id} initial={ocultoSvg} animate={visibleSvg} transition={tr(0.15 + i * ESCALONADO_NODOS)}>
              <circle cx={p.x} cy={p.y} r={7} className="fill-tarjeta stroke-azul" strokeWidth={2} />
              {conBarra && (
                <>
                  <rect x={bx} y={by} width={geo.anchoBarra} height={4} rx={2} className="fill-linea" />
                  <rect x={bx} y={by} width={geo.barra(e.tasa ?? 0)} height={4} rx={2} className="fill-azul" />
                  {esExp && (
                    <motion.rect
                      x={bx + geo.barra(e.tasa ?? 0)}
                      y={by - 1}
                      height={6}
                      rx={1}
                      className="fill-azul-relleno"
                      initial={{ width: 0 }}
                      animate={{ width: acto >= 2 ? extension : 0 }}
                      transition={tr(2.2, 0.6)}
                    />
                  )}
                </>
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Capa HTML: nombres, contadores y chip (decorativa; el SVG resume las cifras en su aria-label) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
        {geo.nodos.map((p, i) => (
          <motion.span
            key={datos.etapas[i].id}
            className={`absolute text-xs whitespace-nowrap text-tinta-2 ${movil ? "-translate-x-full -translate-y-full pr-4" : "-translate-x-1/2 -translate-y-full pb-3"}`}
            style={pct(p)}
            initial={ocultoHtml}
            animate={visibleHtml}
            transition={tr(0.15 + i * ESCALONADO_NODOS)}
          >
            {datos.etapas[i].nombre}
          </motion.span>
        ))}

        <Contador
          valor={datos.etapas[0].volumen}
          etiqueta="sesiones"
          formato={(v) => formatearEntero(Math.round(v))}
          pos={pct(geo.contadores.sesiones)}
          alinear={movil ? "centro" : "inicio"}
          activo
          retraso={0.4}
          modo={modo}
          reducir={reducir}
          movil={movil}
          tono="tinta"
          tr={tr(0.3)}
          ocultoHtml={ocultoHtml}
        />
        <Contador
          valor={datos.etapas[datos.etapas.length - 1].volumen}
          etiqueta="cierres"
          formato={(v) => formatearEntero(Math.round(v))}
          pos={pct(geo.contadores.cierres)}
          alinear={movil ? "centro" : "fin"}
          activo
          retraso={0.6}
          modo={modo}
          reducir={reducir}
          movil={movil}
          tono="tinta"
          tr={tr(0.5)}
          ocultoHtml={ocultoHtml}
        />
        <Contador
          valor={datos.valorEnRiesgo}
          etiqueta="en riesgo"
          formato={formatearMxnCorto}
          pos={pct(geo.contadores.riesgo)}
          alinear="centro"
          activo={acto >= 1}
          retraso={0.4}
          modo={modo}
          reducir={reducir}
          movil={movil}
          tono="coral"
          tr={tr(0.2)}
          ocultoHtml={ocultoHtml}
        />

        {exp && geo.chip && (
          <motion.span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-badge border border-azul-suave bg-tarjeta px-2 py-1 text-xs whitespace-nowrap shadow-tarjeta"
            style={pct(geo.chip)}
            initial={ocultoHtml}
            animate={acto >= 2 ? visibleHtml : ocultoHtml}
            transition={tr(1.6)}
          >
            <span className="cifra font-semibold text-azul-texto">{formatearPuntos(exp.prediccionPp)}</span>
            <span className="text-tinta-2"> · {exp.nombre}</span>
          </motion.span>
        )}
      </div>
    </div>
  );
}

/** Count-up (receta 13): ease-out cúbico en 1.2 s; al saltar, 0.4 s; con reduced motion, el valor final directo. */
function Contador({
  valor,
  etiqueta,
  formato,
  pos,
  alinear,
  activo,
  retraso,
  modo,
  reducir,
  movil,
  tono,
  tr,
  ocultoHtml,
}: {
  valor: number;
  etiqueta: string;
  formato: (v: number) => string;
  pos: { left: string; top: string };
  alinear: "inicio" | "centro" | "fin";
  activo: boolean;
  retraso: number;
  modo: Modo;
  reducir: boolean;
  movil: boolean;
  tono: "tinta" | "coral";
  tr: Transition;
  ocultoHtml: Record<string, number | string>;
}) {
  const mv = useMotionValue(reducir && activo ? valor : 0);
  const texto = useTransform(mv, formato);

  useEffect(() => {
    if (!activo) {
      mv.set(0);
      return;
    }
    if (reducir) {
      mv.set(valor);
      return;
    }
    const control =
      modo === "rapido"
        ? animate(mv, valor, { duration: DURACION_ESTADO, ease: CURVA_ESTADO })
        : animate(mv, valor, { duration: DURACION_CONTEO, delay: retraso, ease: easeOutCubic });
    return () => control.stop();
  }, [activo, valor, reducir, modo, retraso, mv]);

  const x = alinear === "inicio" ? "" : alinear === "fin" ? "-translate-x-full text-right" : "-translate-x-1/2 text-center";
  return (
    <motion.span
      className={`absolute flex -translate-y-1/2 flex-col ${x} ${alinear === "centro" ? "items-center" : alinear === "fin" ? "items-end" : "items-start"}`}
      style={pos}
      initial={ocultoHtml}
      animate={activo ? { opacity: 1, y: 0, filter: "blur(0px)" } : ocultoHtml}
      transition={tr}
    >
      <motion.span
        className={`font-cifra cifra leading-none font-semibold whitespace-nowrap ${movil ? "text-lg" : "text-2xl"} ${tono === "coral" ? "text-coral-texto" : "text-tinta"}`}
      >
        {texto}
      </motion.span>
      <span className="mt-1 text-xs text-tinta-2">{etiqueta}</span>
    </motion.span>
  );
}
