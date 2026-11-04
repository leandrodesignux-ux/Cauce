"use client";

import { Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { create } from "zustand";
import { useDatos } from "@/components/Proveedores";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ETAPAS } from "@/config/etapas";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import { useMedia } from "@/hooks/useMedia";
import { leerFiltros } from "@/lib/filtros-url";
import { formatearEntero, formatearMxnCorto, formatearPuntos } from "@/lib/formato";
import { calcularJourney, experimentoDestacado } from "@/lib/journey";
import { useSesion, useSesionHidratada } from "@/lib/stores";
import {
  ACTOS,
  CURVA_ENTRADA,
  CURVA_ESTADO,
  DURACION_CROSSFADE,
  DURACION_ENTRADA,
  DURACION_ESTADO,
  ESCALONADO_PALABRAS,
  NOMBRE_CORTO_EXPERIMENTO,
} from "./actos";
import { type DatosEscena, EscenaCauce } from "./EscenaCauce";
import { useActos } from "./useActos";

type EstadoOnboarding = { abierto: boolean; abrir: () => void; fijar: (abierto: boolean) => void };

/** Abierto o cerrado. Lo abren la primera visita, el Rail, la barra móvil y ⌘K ("Ver cómo funciona"). */
export const useOnboarding = create<EstadoOnboarding>()((set) => ({
  abierto: false,
  abrir: () => set({ abierto: true }),
  fijar: (abierto) => set({ abierto }),
}));

/** Cifras del escenario: las de la home con los filtros por defecto (sin importar los de la URL actual). */
function useDatosEscena(): DatosEscena {
  const { flujo, fugas, experimentos, semanas } = useDatos();
  return useMemo(() => {
    const e = leerFiltros(new URLSearchParams(), semanas);
    const journey = calcularJourney(flujo, fugas, { periodo: e.periodo, canales: e.canales, sectores: e.sectores, estados: e.estados });
    const pozas = journey.pozas.map((p) => ({ id: p.id, nombre: p.nombre, desde: p.desde, volumen: p.volumen, valor: p.valor }));
    const idExp = experimentoDestacado(experimentos);
    const exp = experimentos.find((x) => x.id === idExp);
    return {
      etapas: journey.etapas.map((et, i) => ({ id: et.id, nombre: ETAPAS[i].nombre, volumen: et.volumen, tasa: et.tasa })),
      pozas,
      valorEnRiesgo: journey.valorEnRiesgo,
      modelo: pozas.find((p) => p.id === FUGA_MODELO_PERDIDA) ?? null,
      experimento: exp
        ? {
            nombre: NOMBRE_CORTO_EXPERIMENTO[exp.id] ?? exp.nombre,
            prediccionPp: exp.prediccionPp,
            desde: ETAPAS.findIndex((x) => x.id === exp.transicion.desde),
          }
        : null,
    };
  }, [flujo, fugas, experimentos, semanas]);
}

/** Resumen de las cifras reales de cada acto para el aria-label del escenario. */
function resumen(acto: number, d: DatosEscena): string {
  const inicio = d.etapas[0];
  const fin = d.etapas[d.etapas.length - 1];
  if (acto === 0)
    return `Recorrido de ${d.etapas.length} etapas: ${formatearEntero(inicio.volumen)} sesiones en ${inicio.nombre} y ${formatearEntero(fin.volumen)} cierres.`;
  if (acto === 1) {
    const mayor = d.pozas.reduce((m, p) => (p.valor > m.valor ? p : m), d.pozas[0]);
    return `${d.pozas.length} fugas con ${formatearMxnCorto(d.valorEnRiesgo)} en riesgo. La mayor: ${mayor?.nombre}, ${formatearMxnCorto(mayor?.valor ?? 0)}.`;
  }
  const partes: string[] = [];
  if (d.modelo) partes.push(`${d.modelo.nombre} (${formatearMxnCorto(d.modelo.valor)}) vuelve a ${d.etapas[d.modelo.desde + 1].nombre}.`);
  if (d.experimento)
    partes.push(
      `${d.experimento.nombre}: ${formatearPuntos(d.experimento.prediccionPp)} esperados de ${d.etapas[d.experimento.desde].nombre} a ${d.etapas[d.experimento.desde + 1].nombre}.`,
    );
  return partes.join(" ");
}

/** Cierre "Ver mi recorrido": el contenido de la página se asienta (CSS en globals.css, `#contenido[data-entrada]`). */
function asentarContenido() {
  const main = document.getElementById("contenido");
  if (!main) return;
  const quitar = () => main.removeAttribute("data-entrada");
  main.removeAttribute("data-entrada");
  void main.offsetWidth; // reinicia la animación si se repite
  main.setAttribute("data-entrada", "");
  main.addEventListener("animationend", quitar, { once: true });
  window.setTimeout(quitar, 1200);
}

/**
 * Onboarding animado: un escenario único de 3 actos (EscenaCauce) con autoplay tipo historias.
 * Se abre solo la primera vez (cuando el store de sesión ya se rehidrató). Cerrarlo por cualquier vía
 * (Saltar, Esc, clic afuera, Ver mi recorrido) lo marca como visto. ← → cambian de acto; Espacio pausa.
 */
export function Onboarding() {
  const abierto = useOnboarding((s) => s.abierto);
  const fijar = useOnboarding((s) => s.fijar);
  const hidratada = useSesionHidratada();
  const visto = useSesion((s) => s.onboardingVisto);
  const marcar = useSesion((s) => s.marcarOnboarding);
  const previo = useRef<HTMLElement | null>(null);

  // Primera visita: se abre una sola vez, cuando ya se sabe si se vio.
  useEffect(() => {
    if (hidratada && !visto) useOnboarding.getState().abrir();
  }, [hidratada, visto]);

  const alCambiar = (abrir: boolean) => {
    if (!abrir) marcar();
    fijar(abrir);
  };

  return (
    <Dialog open={abierto} onOpenChange={alCambiar}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="h-dvh w-full max-w-full gap-0 rounded-none bg-transparent p-0 shadow-none ring-0 sm:max-w-5xl md:h-[min(680px,88dvh)] md:w-[calc(100%-2rem)] md:rounded-panel"
        onOpenAutoFocus={(e) => {
          // El foco va al contenedor (no a un control): así el autoplay no arranca en pausa.
          e.preventDefault();
          previo.current = document.activeElement as HTMLElement | null;
          (e.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>("[data-onboarding]")?.focus({ preventScroll: true });
        }}
        onCloseAutoFocus={(e) => {
          // Sin trigger: el foco vuelve a quien lo tenía (el botón que lo reabrió), si sigue en la página.
          if (!previo.current?.isConnected || previo.current === document.body) return;
          e.preventDefault();
          previo.current.focus();
        }}
      >
        <ContenidoOnboarding onCerrar={() => alCambiar(false)} />
      </DialogContent>
    </Dialog>
  );
}

/** Se monta en cada apertura: arranca en el acto 1, sin pausas, y desmonta el loop de puntos al cerrar. */
function ContenidoOnboarding({ onCerrar }: { onCerrar: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const marcar = useSesion((s) => s.marcarOnboarding);
  const fijar = useOnboarding((s) => s.fijar);
  const reducir = useReducedMotion() ?? false;
  const tablet = useMedia("(min-width: 768px)", true);
  const datos = useDatosEscena();
  const { acto, modo, ultimo, autoplay, pausado, pausaManual, ir, completar, pausar, alternarPausa } = useActos(reducir);
  const [saliendo, setSaliendo] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  const verRecorrido = () => {
    marcar();
    if (pathname !== "/") router.push("/");
    if (reducir) {
      fijar(false);
      return;
    }
    setSaliendo(true);
    asentarContenido();
  };

  const alPresionar = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      ir(acto + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      ir(acto - 1);
    } else if (e.key === " " && autoplay && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault();
      alternarPausa();
    }
  };

  // Pausa al enfocar un control con teclado (no con el clic, para que "Siguiente" no detenga el autoplay).
  const alEnfocar = (e: FocusEvent) => {
    const el = e.target as HTMLElement;
    if (el instanceof HTMLButtonElement && el.matches(":focus-visible")) pausar("foco", true);
  };
  const alDesenfocar = (e: FocusEvent) => {
    if (!raiz.current?.contains(e.relatedTarget as Node | null) || !(e.relatedTarget instanceof HTMLButtonElement)) pausar("foco", false);
  };

  const a = ACTOS[acto];
  const palabras = a.titulo.split(" ");
  const trTexto: Transition = reducir
    ? { duration: DURACION_CROSSFADE }
    : modo === "rapido"
      ? { duration: DURACION_ESTADO, ease: CURVA_ESTADO }
      : { duration: DURACION_ENTRADA, delay: 0.2 + (palabras.length - 1) * ESCALONADO_PALABRAS, ease: CURVA_ENTRADA };

  return (
    <motion.div
      ref={raiz}
      data-onboarding
      tabIndex={-1}
      onKeyDown={alPresionar}
      onFocus={alEnfocar}
      onBlur={alDesenfocar}
      className="flex h-full min-h-0 flex-col overflow-hidden border border-tarjeta-borde bg-tarjeta outline-none md:rounded-panel"
      initial={false}
      animate={
        saliendo ? (reducir ? { opacity: 0 } : { opacity: 0, scale: 0.96, filter: "blur(8px)" }) : { opacity: 1, scale: 1, filter: "blur(0px)" }
      }
      transition={{ duration: reducir ? DURACION_CROSSFADE : 0.35, ease: CURVA_ESTADO }}
      onAnimationComplete={() => {
        if (saliendo) fijar(false);
      }}
    >
      <DialogTitle className="sr-only">Cómo funciona Cauce</DialogTitle>
      <p className="sr-only" aria-live="polite">
        Paso {acto + 1} de {ACTOS.length}: {a.titulo}
      </p>

      {/* Progreso tipo historias + Saltar */}
      <div className="flex items-center gap-3 px-4 pt-3 md:px-6 md:pt-4">
        <ol aria-label="Pasos" className="flex flex-1 items-center gap-1.5">
          {ACTOS.map((x, i) => (
            <li key={x.titulo} className="flex-1">
              <button
                type="button"
                onClick={() => ir(i)}
                aria-label={`Paso ${i + 1}: ${x.titulo}`}
                aria-current={i === acto ? "step" : undefined}
                className="group block w-full rounded-badge py-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="block h-1 overflow-hidden rounded-full bg-linea-fuerte">
                  {i < acto || (i === acto && !autoplay) ? (
                    <span className="block h-full w-full bg-activo" />
                  ) : i === acto ? (
                    <span
                      key={`${acto}-${modo}`}
                      className="block h-full w-full origin-left bg-activo"
                      style={{ animation: `llenar-segmento ${x.duracion}ms linear forwards`, animationPlayState: pausado ? "paused" : "running" }}
                      onAnimationEnd={completar}
                    />
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <Button variant="sutil" size="sm" onClick={onCerrar}>
          Saltar
        </Button>
      </div>

      {/* Escenario */}
      <div
        className="min-h-0 flex-1 px-4 py-3 md:px-8 md:py-4"
        style={{ containerType: "size" }}
        onPointerEnter={(e) => e.pointerType === "mouse" && pausar("hover", true)}
        onPointerLeave={() => pausar("hover", false)}
      >
        <EscenaCauce datos={datos} acto={acto} modo={modo} reducir={reducir} pausado={pausado} movil={!tablet} etiqueta={resumen(acto, datos)} />
      </div>

      {/* Texto del acto + controles */}
      <div className="flex flex-col gap-4 border-t border-linea px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:flex-row md:items-end md:justify-between md:gap-8 md:px-6 md:pb-5">
        <div className="min-h-[6.5rem] max-w-xl md:min-h-[5.5rem]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={acto} exit={{ opacity: 0 }} transition={{ duration: DURACION_CROSSFADE }}>
              <h2 className="font-heading text-xl leading-tight font-semibold text-balance md:text-2xl">
                {palabras.map((p, i) => (
                  <Fragment key={i}>
                    <motion.span
                      className="inline-block"
                      initial={reducir ? { opacity: 0 } : { opacity: 0, y: 20, filter: "blur(10px)" }}
                      animate={
                        reducir || modo === "rapido"
                          ? { opacity: 1, y: 0, filter: "blur(0px)" }
                          : { opacity: [0, 0.5, 1], y: [20, -3, 0], filter: ["blur(10px)", "blur(5px)", "blur(0px)"] }
                      }
                      transition={
                        reducir
                          ? { duration: DURACION_CROSSFADE }
                          : modo === "rapido"
                            ? { duration: DURACION_ESTADO, ease: CURVA_ESTADO }
                            : { duration: DURACION_ENTRADA, times: [0, 0.5, 1], ease: CURVA_ENTRADA, delay: i * ESCALONADO_PALABRAS }
                      }
                    >
                      {p}
                    </motion.span>
                    {i < palabras.length - 1 && " "}
                  </Fragment>
                ))}
              </h2>
              <motion.p
                className="mt-2 text-sm text-pretty text-tinta-2 md:text-base"
                initial={reducir ? { opacity: 0 } : { opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={trTexto}
              >
                {a.texto}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="lg" onClick={() => ir(acto - 1)} disabled={acto === 0}>
            Anterior
          </Button>
          {autoplay && (
            <Button variant="outline" size="icon-lg" onClick={alternarPausa} aria-label={pausaManual ? "Reanudar" : "Pausar"}>
              {pausaManual ? <Play /> : <Pause />}
            </Button>
          )}
          {ultimo ? (
            <Button size="lg" className="flex-1 md:flex-none" onClick={verRecorrido}>
              Ver mi recorrido
            </Button>
          ) : (
            <Button size="lg" className="flex-1 md:flex-none" onClick={() => ir(acto + 1)}>
              Siguiente
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
