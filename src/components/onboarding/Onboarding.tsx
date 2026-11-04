"use client";

import { ChevronLeft, Pause, Play } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { create } from "zustand";
import { useDatos } from "@/components/Proveedores";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import { useMedia } from "@/hooks/useMedia";
import { leerFiltros } from "@/lib/filtros-url";
import { formatearEntero, formatearMxnCorto, formatearPuntos } from "@/lib/formato";
import { calcularJourney, experimentoDestacado } from "@/lib/journey";
import { modeloPerdida, parametrosPerdidaIniciales } from "@/lib/selectors";
import { useSesion, useSesionHidratada } from "@/lib/stores";
import {
  ACTOS,
  CURVA_ENTRADA,
  CURVA_ESTADO,
  DURACION_CIERRE,
  DURACION_CROSSFADE,
  DURACION_PALABRA,
  DURACION_SALIDA,
  ESCALONADO_PALABRAS,
  ETIQUETA_CIFRA,
  NOMBRE_CORTO_EXPERIMENTO,
  RETRASO_TEXTO,
  type CifrasActos,
} from "./actos";
import { type Caja, type DatosParticulas, type Evento, type Motor, type PozaPos, cantidadParticulas, crearMotor } from "./particulas";
import { useActos } from "./useActos";

type EstadoOnboarding = { abierto: boolean; abrir: () => void; fijar: (abierto: boolean) => void };

/** Abierto o cerrado. Lo abren la primera visita, el Rail, la barra móvil y ⌘K ("Ver cómo funciona"). */
export const useOnboarding = create<EstadoOnboarding>()((set) => ({
  abierto: false,
  abrir: () => set({ abierto: true }),
  fijar: (abierto) => set({ abierto }),
}));

type PozaEtiqueta = { id: string; nombre: string; monto: string; valor: number };

/** Cifras del onboarding: las de la home con los filtros por defecto (sin importar los de la URL actual). */
function useDatosOnboarding() {
  const { flujo, fugas, experimentos, semanas } = useDatos();
  return useMemo(() => {
    const e = leerFiltros(new URLSearchParams(), semanas);
    const journey = calcularJourney(flujo, fugas, { periodo: e.periodo, canales: e.canales, sectores: e.sectores, estados: e.estados });
    const parametros = parametrosPerdidaIniciales();
    const contratos = Math.round(modeloPerdida(parametros).contratos);
    const pozas: PozaEtiqueta[] = journey.pozas
      .filter((p) => p.valor > 0)
      .map((p) => ({ id: p.id, nombre: p.nombre, monto: formatearMxnCorto(p.valor), valor: p.valor }));
    const modelo = journey.pozas.find((p) => p.id === FUGA_MODELO_PERDIDA);
    const proporcion = journey.valorEnRiesgo > 0 && modelo ? modelo.valor / journey.valorEnRiesgo : 0;
    const idExp = experimentoDestacado(experimentos);
    const exp = experimentos.find((x) => x.id === idExp);
    const cifras: CifrasActos = {
      llegaron: formatearEntero(journey.etapas[0].volumen),
      firmaron: formatearEntero(journey.etapas[journey.etapas.length - 1].volumen),
      fantasmas: formatearEntero(parametros.fantasmas),
      contratos: formatearEntero(contratos),
    };
    const particulas: DatosParticulas = {
      llegaron: cifras.llegaron,
      firmaron: cifras.firmaron,
      riesgo: formatearMxnCorto(journey.valorEnRiesgo),
      contratos: `+${cifras.contratos}`,
      pozas: pozas.map((p) => p.valor),
      fraccionRetorno: Math.min(0.45, Math.max(0.2, proporcion)),
    };
    const chip = exp ? `${formatearPuntos(exp.prediccionPp)} · ${NOMBRE_CORTO_EXPERIMENTO[exp.id] ?? exp.nombre}` : null;
    return { cifras, pozas, particulas, chip };
  }, [flujo, fugas, experimentos, semanas]);
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
 * Onboarding animado: un escenario de partículas en 3 actos, a pantalla completa y en oscuro (`.dark` local),
 * con autoplay tipo historias. Se abre solo la primera vez (cuando el store de sesión ya se rehidrató).
 * Cerrarlo por cualquier vía (Saltar, Esc, Ver mi recorrido) lo marca como visto. ← → cambian de acto; Espacio pausa.
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
        className="dark top-0 left-0 h-dvh w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-none bg-transparent p-0 text-tinta shadow-none ring-0 sm:max-w-none"
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

type Etiquetas = {
  cifra: { clave: keyof typeof ETIQUETA_CIFRA; caja: Caja } | null;
  pozas: PozaPos[] | null;
  chip: Caja | null;
};

/** Se monta en cada apertura: arranca en el acto 1, sin pausas, y destruye el motor al cerrar. */
function ContenidoOnboarding({ onCerrar }: { onCerrar: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const marcar = useSesion((s) => s.marcarOnboarding);
  const fijar = useOnboarding((s) => s.fijar);
  const reducir = useReducedMotion() ?? false;
  const tablet = useMedia("(min-width: 768px)", true);
  const { cifras, pozas, particulas, chip } = useDatosOnboarding();
  const { acto, modo, ultimo, autoplay, pausado, pausaManual, ir, completar, pausar, alternarPausa } = useActos(reducir);
  const [saliendo, setSaliendo] = useState(false);
  const [etiquetas, setEtiquetas] = useState<Etiquetas>({ cifra: null, pozas: null, chip: null });
  const raiz = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const motor = useRef<Motor | null>(null);
  const actual = useRef({ acto, pausado });

  useEffect(() => {
    actual.current = { acto, pausado };
  }, [acto, pausado]);

  // Motor de partículas: se crea cuando las fuentes están listas (muestrea Geist) y se destruye al cerrar.
  useEffect(() => {
    let vivo = true;
    const alEvento = (e: Evento) => {
      if (!vivo) return;
      setEtiquetas((et) => {
        switch (e.tipo) {
          case "cifra":
            return { ...et, cifra: { clave: e.clave, caja: e.caja } };
          case "ocultarCifra":
            return { ...et, cifra: null, chip: null };
          case "pozas":
            return { ...et, pozas: e.pozas };
          case "ocultarPozas":
            return { ...et, pozas: null };
          case "chip":
            return { ...et, chip: e.caja };
        }
      });
    };
    document.fonts.ready.then(() => {
      const canvas = lienzo.current;
      const contenedor = raiz.current;
      if (!vivo || !canvas || !contenedor) return;
      try {
        const estilo = getComputedStyle(contenedor);
        const leer = (v: string) => estilo.getPropertyValue(v).trim();
        const m = crearMotor(canvas, {
          n: cantidadParticulas(window.innerWidth),
          colores: [leer("--azul"), leer("--coral"), leer("--tinta-2")],
          reducir,
          datos: particulas,
          alEvento,
        });
        motor.current = m;
        m.irA(actual.current.acto, { instantaneo: actual.current.acto !== 0 });
        m.pausar(actual.current.pausado);
      } catch {
        // Sin canvas: el título (con las cifras), el texto y los controles se ven igual.
      }
    });
    return () => {
      vivo = false;
      motor.current?.destruir();
      motor.current = null;
    };
  }, [reducir, particulas]);

  useEffect(() => {
    motor.current?.irA(acto, { instantaneo: modo === "rapido" });
  }, [acto, modo]);

  useEffect(() => {
    motor.current?.pausar(pausado);
  }, [pausado]);

  const verRecorrido = () => {
    marcar();
    if (pathname !== "/") router.push("/");
    if (reducir) {
      fijar(false);
      return;
    }
    motor.current?.explosion();
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
  const titulo = a.titulo(cifras);
  const palabras = titulo.split(" ");
  const entrada = reducir ? { opacity: 0 } : { opacity: 0, y: 24, filter: "blur(10px)" };
  const reposo = { opacity: 1, y: 0, filter: "blur(0px)" };
  const trPalabra = (i: number): Transition =>
    reducir
      ? { duration: DURACION_CROSSFADE }
      : modo === "rapido"
        ? { duration: 0.4, ease: CURVA_ESTADO }
        : { duration: DURACION_PALABRA, delay: i * ESCALONADO_PALABRAS, ease: CURVA_ENTRADA };
  const trTexto: Transition = reducir
    ? { duration: DURACION_CROSSFADE }
    : { duration: DURACION_PALABRA, delay: modo === "rapido" ? 0.1 : RETRASO_TEXTO, ease: CURVA_ENTRADA };
  const trEtiqueta = (i = 0): Transition => (reducir ? { duration: DURACION_CROSSFADE } : { duration: 0.6, delay: i * 0.08, ease: CURVA_ENTRADA });
  const salidaEtiqueta = reducir
    ? { opacity: 0, transition: { duration: DURACION_CROSSFADE } }
    : { opacity: 0, filter: "blur(6px)", transition: { duration: DURACION_SALIDA } };

  // En móvil, solo las 3 fugas de mayor valor llevan etiqueta.
  const visibles = useMemo(() => {
    if (tablet) return new Set(pozas.map((p) => p.id));
    return new Set(
      [...pozas]
        .sort((p, q) => q.valor - p.valor)
        .slice(0, 3)
        .map((p) => p.id),
    );
  }, [pozas, tablet]);

  const cifra = etiquetas.cifra;

  return (
    <motion.div
      ref={raiz}
      data-onboarding
      tabIndex={-1}
      onKeyDown={alPresionar}
      onFocus={alEnfocar}
      onBlur={alDesenfocar}
      className="fondo-onboarding relative h-full w-full overflow-hidden outline-none"
      initial={false}
      animate={{ opacity: saliendo ? 0 : 1 }}
      transition={{ duration: reducir ? DURACION_CROSSFADE : DURACION_CIERRE, ease: CURVA_ESTADO }}
      onAnimationComplete={() => {
        if (saliendo) fijar(false);
      }}
    >
      <DialogTitle className="sr-only">Cómo funciona Cauce</DialogTitle>

      {/* 1. Partículas */}
      <canvas ref={lienzo} aria-hidden className="absolute inset-0 size-full font-cifra" />

      {/* Zona de formación: hover pausa */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[55%] md:h-[60%]"
        onPointerEnter={(e) => e.pointerType === "mouse" && pausar("hover", true)}
        onPointerLeave={() => pausar("hover", false)}
      />

      {/* 5. Etiquetas sobre el lienzo (decorativas: las cifras van en el título y en la lista sr-only) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
        <AnimatePresence>
          {cifra && (
            <motion.p
              key={`${cifra.clave}`}
              className="absolute -translate-x-1/2 text-sm whitespace-nowrap text-tinta-2 md:text-base"
              style={{ left: cifra.caja.x + cifra.caja.w / 2, top: cifra.caja.y + cifra.caja.h + 16 }}
              initial={entrada}
              animate={reposo}
              exit={salidaEtiqueta}
              transition={trEtiqueta()}
            >
              {ETIQUETA_CIFRA[cifra.clave]}
            </motion.p>
          )}
          {etiquetas.chip && chip && (
            <motion.p
              key="chip"
              className="absolute -translate-x-1/2 rounded-badge border border-linea-fuerte bg-tarjeta px-2.5 py-1 text-xs whitespace-nowrap text-tinta-2 md:text-sm"
              style={{ left: etiquetas.chip.x + etiquetas.chip.w / 2, top: etiquetas.chip.y + etiquetas.chip.h + 52 }}
              initial={entrada}
              animate={reposo}
              exit={salidaEtiqueta}
              transition={trEtiqueta()}
            >
              {chip}
            </motion.p>
          )}
          {etiquetas.pozas?.map((p, i) =>
            visibles.has(pozas[i]?.id) ? (
              <motion.div
                key={pozas[i].id}
                className="absolute flex -translate-x-1/2 flex-col items-center text-center"
                style={{ left: p.cx, top: p.base + 10, maxWidth: Math.max(96, p.ancho + 24) }}
                initial={entrada}
                animate={reposo}
                exit={salidaEtiqueta}
                transition={trEtiqueta(i)}
              >
                <span className="text-xs leading-tight text-tinta-2">{pozas[i].nombre}</span>
                <span className="cifra text-sm font-semibold whitespace-nowrap text-coral-texto">{pozas[i].monto}</span>
              </motion.div>
            ) : null,
          )}
        </AnimatePresence>
      </div>
      <ul className="sr-only" aria-label="Fugas">
        {pozas.map((p) => (
          <li key={p.id}>
            {p.nombre}: {p.monto}
          </li>
        ))}
      </ul>

      {/* 2. Progreso + Saltar */}
      <div className="absolute inset-x-0 top-0 flex items-center gap-4 px-6 pt-5">
        <ol aria-label="Pasos" className="flex flex-1 items-center gap-1.5">
          {ACTOS.map((x, i) => (
            <li key={i} className="flex-1">
              <button
                type="button"
                onClick={() => ir(i)}
                aria-label={`Paso ${i + 1} de ${ACTOS.length}`}
                aria-current={i === acto ? "step" : undefined}
                className="block w-full rounded-badge py-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
              >
                <span className="block h-0.5 overflow-hidden rounded-full bg-linea-fuerte">
                  {i < acto || (i === acto && !autoplay) ? (
                    <span className="block h-full w-full bg-tinta" />
                  ) : i === acto ? (
                    <span
                      key={`${acto}-${modo}`}
                      className="block h-full w-full origin-left bg-tinta"
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

      {/* 3 y 4. Título y texto del acto + controles */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-6 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:flex-row md:items-end md:justify-between md:gap-10 md:px-10 md:pb-10">
        <div className="min-w-0 md:max-w-[min(68rem,70%)]">
          <div aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h2
                key={acto}
                className="font-heading leading-none font-semibold tracking-[-0.03em] text-balance text-tinta"
                style={{ fontSize: "clamp(36px, 5.5vw, 84px)" }}
                exit={
                  reducir
                    ? { opacity: 0, transition: { duration: DURACION_CROSSFADE } }
                    : { opacity: 0, filter: "blur(6px)", transition: { duration: DURACION_SALIDA } }
                }
              >
                {palabras.map((p, i) => (
                  <Fragment key={i}>
                    <motion.span className="inline-block" initial={entrada} animate={reposo} transition={trPalabra(i)}>
                      {p}
                    </motion.span>
                    {i < palabras.length - 1 && " "}
                  </Fragment>
                ))}
              </motion.h2>
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={acto}
              className="mt-4 max-w-[52ch] text-base text-pretty text-tinta-2 md:text-lg"
              initial={entrada}
              animate={reposo}
              exit={
                reducir
                  ? { opacity: 0, transition: { duration: DURACION_CROSSFADE } }
                  : { opacity: 0, filter: "blur(6px)", transition: { duration: DURACION_SALIDA } }
              }
              transition={trTexto}
            >
              {a.texto(cifras)}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="icon-lg" onClick={() => ir(acto - 1)} disabled={acto === 0} aria-label="Anterior">
            <ChevronLeft />
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
