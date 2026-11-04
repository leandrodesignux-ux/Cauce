"use client";

import { scaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { FileSignature, MessageCircle, MousePointerClick, UserX, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { IconoCirculo } from "@/components/ui/icono-circulo";
import { useAncho } from "@/hooks/useAncho";
import { type EventoDemo, type TipoEvento } from "@/lib/demoVivo";
import { formatearEntero } from "@/lib/formato";
import { useDemoVivo } from "@/lib/stores";

const ICONO: Record<TipoEvento, { Icono: LucideIcon; tono: "azul" | "coral" }> = {
  sesion: { Icono: MousePointerClick, tono: "azul" },
  contacto: { Icono: MessageCircle, tono: "azul" },
  "sin-atender": { Icono: UserX, tono: "coral" },
  cierre: { Icono: FileSignature, tono: "azul" },
};
const RANURAS = 60;
const ALTO = 112;
const CURVA_ENTRADA = [0.22, 1, 0.36, 1] as const;

/** "hace 3 s", "hace 2 min". */
function haceCuanto(en: number, ahora: number): string {
  const s = Math.max(0, Math.round((ahora - en) / 1000));
  return s < 60 ? `hace ${s} s` : `hace ${Math.floor(s / 60)} min`;
}

/**
 * Actividad del modo demo en vivo (solo con la demo activa): sesiones por hora simuladas en un área que se
 * desplaza con cada tick y el feed de los últimos 5 eventos. Todo va rotulado como simulado.
 */
export function ActividadEnVivo() {
  const activo = useDemoVivo((s) => s.activo);
  const reducir = useReducedMotion() ?? false;
  return (
    <AnimatePresence>
      {activo && (
        <motion.section
          key="actividad"
          aria-labelledby="t-actividad"
          className="vidrio mt-6 grid gap-6 rounded-tarjeta p-3 shadow-tarjeta md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:rounded-panel md:p-7"
          initial={reducir ? { opacity: 0 } : { opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: reducir ? 0.15 : 0.7, ease: CURVA_ENTRADA }}
        >
          <h2 id="t-actividad" className="sr-only">
            Actividad en vivo (simulada)
          </h2>
          <SesionesPorHora />
          <FeedEventos />
        </motion.section>
      )}
    </AnimatePresence>
  );
}

function SesionesPorHora() {
  const serie = useDemoVivo((s) => s.estado.serieSesiones);
  const tick = useDemoVivo((s) => s.estado.tick);
  const reducir = useReducedMotion() ?? false;
  const contenedor = useRef<HTMLDivElement>(null);
  const ancho = useAncho(contenedor);
  const ultimo = serie.at(-1) ?? 0;

  const paso = ancho > 0 ? ancho / (RANURAS - 1) : 0;
  const x = (i: number) => (RANURAS - serie.length + i) * paso;
  const y = scaleLinear()
    .domain([0, Math.max(1, ...serie) * 1.15])
    .range([ALTO, 4]);
  const puntos = serie.map((v, i) => [x(i), y(v)] as [number, number]);
  const dArea = area<[number, number]>()
    .x((p) => p[0])
    .y0(ALTO)
    .y1((p) => p[1])
    .curve(curveMonotoneX)(puntos);
  const dLinea = line<[number, number]>()
    .x((p) => p[0])
    .y((p) => p[1])
    .curve(curveMonotoneX)(puntos);

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-tile border border-tarjeta-borde bg-tarjeta p-5 shadow-tarjeta">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-sm text-tinta-2">Sesiones por hora (simulado)</p>
          <p className="cifra cifra-principal text-2xl font-semibold">{formatearEntero(ultimo)}</p>
        </div>
        <span className="cifra text-xs text-tinta-2">últimas {serie.length} h</span>
      </div>
      <div ref={contenedor} className="relative overflow-hidden" style={{ height: ALTO }}>
        {ancho > 0 && serie.length > 1 && (
          <svg width={ancho} height={ALTO} role="img" aria-label={`Sesiones por hora simuladas: la última, ${formatearEntero(ultimo)}`}>
            {/* Cada tick, la serie entra desde la derecha un paso (300 ms). */}
            <motion.g key={tick} initial={reducir ? false : { x: paso }} animate={{ x: 0 }} transition={{ duration: 0.3, ease: "linear" }}>
              <path d={dArea ?? ""} className="fill-azul-suave" />
              <path d={dLinea ?? ""} className="stroke-azul-relleno" strokeWidth={2} fill="none" />
            </motion.g>
          </svg>
        )}
      </div>
    </div>
  );
}

function FeedEventos() {
  const eventos = useDemoVivo((s) => s.estado.eventos);
  const reducir = useReducedMotion() ?? false;
  const [ahora, setAhora] = useState(() => Date.now());
  const [anuncio, setAnuncio] = useState("");
  const ultimo = useRef<EventoDemo | undefined>(undefined);

  useEffect(() => {
    ultimo.current = eventos[0];
  }, [eventos]);

  // Reloj de "hace N s" y anuncio acotado: como máximo un evento cada 5 s para lectores de pantalla.
  useEffect(() => {
    const reloj = window.setInterval(() => setAhora(Date.now()), 1000);
    let anunciado: string | undefined;
    const lector = window.setInterval(() => {
      const e = ultimo.current;
      if (e && e.id !== anunciado) {
        anunciado = e.id;
        setAnuncio(e.texto);
      }
    }, 5000);
    return () => {
      window.clearInterval(reloj);
      window.clearInterval(lector);
    };
  }, []);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-sm font-medium">Lo último (simulado)</p>
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {eventos.slice(0, 5).map((e) => {
            const { Icono, tono } = ICONO[e.tipo];
            return (
              <motion.li
                key={e.id}
                layout={!reducir}
                initial={reducir ? { opacity: 0 } : { opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reducir ? 0.15 : 0.25, ease: CURVA_ENTRADA }}
                className="flex items-center gap-3 rounded-tile border border-tarjeta-borde bg-tarjeta px-3 py-2.5 shadow-tarjeta"
              >
                <IconoCirculo Icono={Icono} tono={tono} className="size-8 [&_svg]:size-4" />
                <span className="min-w-0 flex-1 truncate text-sm">{e.texto}</span>
                <span className="cifra shrink-0 text-xs text-tinta-2">{haceCuanto(e.en, ahora)}</span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
