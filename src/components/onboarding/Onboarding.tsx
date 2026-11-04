"use client";

import { Droplets, FlaskConical, Route, UserCheck, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { create } from "zustand";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useSesion, useSesionHidratada } from "@/lib/stores";

type Slide = { titulo: string; texto: string; iconos: { Icono: LucideIcon; tono: "azul" | "coral" }[] };

const SLIDES: readonly Slide[] = [
  {
    titulo: "Vea dónde se pierde la demanda",
    texto: "Cauce sigue a cada interesado desde que llega al sitio hasta que firma. En cada paso se ve cuántos avanzan y cuántos se quedan.",
    iconos: [{ Icono: Route, tono: "azul" }],
  },
  {
    titulo: "Cada fuga tiene un valor en pesos",
    texto: "Los leads que se quedan en el camino se agrupan en fugas. Puede ver cuánto valen y rescatar primero a los de mayor intención.",
    iconos: [
      { Icono: Droplets, tono: "coral" },
      { Icono: UserCheck, tono: "azul" },
    ],
  },
  {
    titulo: "Los experimentos atacan las fugas",
    texto: "Cada experimento declara qué paso espera mejorar y cuándo se podrá medir. Así se sabe si funcionó.",
    iconos: [{ Icono: FlaskConical, tono: "azul" }],
  },
];

type EstadoOnboarding = { abierto: boolean; abrir: () => void; fijar: (abierto: boolean) => void };

/** Abierto o cerrado. Lo abren la primera visita, el Rail, la barra móvil y ⌘K ("Ver cómo funciona"). */
export const useOnboarding = create<EstadoOnboarding>()((set) => ({
  abierto: false,
  abrir: () => set({ abierto: true }),
  fijar: (abierto) => set({ abierto }),
}));

const SALIDA = [0.23, 1, 0.32, 1] as const;

/**
 * Onboarding de 3 slides. Se abre solo la primera vez (cuando el store de sesión ya se rehidrató, para no
 * parpadear en SSR). Cerrarlo por cualquier vía (Saltar, Esc, Empezar, clic afuera) lo marca como visto.
 * ← y → cambian de slide; con reduced motion, el cambio es inmediato.
 */
export function Onboarding() {
  const router = useRouter();
  const pathname = usePathname();
  const abierto = useOnboarding((s) => s.abierto);
  const fijar = useOnboarding((s) => s.fijar);
  const hidratada = useSesionHidratada();
  const visto = useSesion((s) => s.onboardingVisto);
  const marcar = useSesion((s) => s.marcarOnboarding);
  const reducir = useReducedMotion() ?? false;
  const [paso, setPaso] = useState(0);
  const [direccion, setDireccion] = useState(1);
  const previo = useRef<HTMLElement | null>(null);

  // Primera visita: se abre una sola vez, cuando ya se sabe si se vio.
  useEffect(() => {
    if (hidratada && !visto) useOnboarding.getState().abrir();
  }, [hidratada, visto]);

  const ir = (destino: number) => {
    if (destino < 0 || destino >= SLIDES.length) return;
    setDireccion(destino > paso ? 1 : -1);
    setPaso(destino);
  };

  const alCambiar = (abrir: boolean) => {
    if (abrir) {
      setPaso(0);
      setDireccion(1);
    } else {
      marcar();
    }
    fijar(abrir);
  };

  const empezar = () => {
    alCambiar(false);
    if (pathname !== "/") router.push("/");
  };

  const alPresionar = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      ir(paso + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      ir(paso - 1);
    }
  };

  const slide = SLIDES[paso];
  const ultimo = paso === SLIDES.length - 1;
  const desplazamiento = reducir ? 0 : 16;

  return (
    <Dialog open={abierto} onOpenChange={alCambiar}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 p-0 sm:max-w-md"
        onKeyDown={alPresionar}
        onOpenAutoFocus={() => {
          previo.current = document.activeElement as HTMLElement | null;
        }}
        onCloseAutoFocus={(e) => {
          // Sin trigger: el foco vuelve a quien lo tenía (el botón que lo reabrió), si sigue en la página.
          if (!previo.current?.isConnected || previo.current === document.body) return;
          e.preventDefault();
          previo.current.focus();
        }}
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <p className="cifra text-xs text-tinta-2" aria-live="polite">
            {paso + 1} de {SLIDES.length}
          </p>
          <Button variant="sutil" size="sm" onClick={() => alCambiar(false)}>
            Saltar
          </Button>
        </div>

        <AnimatePresence mode="wait" initial={false} custom={direccion}>
          <motion.div
            key={paso}
            custom={direccion}
            initial={{ opacity: 0, x: direccion * desplazamiento }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direccion * desplazamiento }}
            transition={{ duration: reducir ? 0 : 0.18, ease: SALIDA }}
            className="flex flex-col gap-4 px-5 pt-3 pb-2"
          >
            <div aria-hidden className="grid h-40 place-items-center rounded-tarjeta border border-tarjeta-borde bg-muted">
              <div className="flex items-center gap-4">
                {slide.iconos.map(({ Icono, tono }, i) => (
                  <span
                    key={i}
                    className={`grid size-18 place-items-center rounded-full ${tono === "azul" ? "bg-azul-suave text-azul-texto" : "bg-coral-suave text-coral-texto"}`}
                  >
                    <Icono className="size-8" strokeWidth={1.6} />
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <DialogTitle className="font-cifra text-lg font-semibold text-balance">{slide.titulo}</DialogTitle>
              <DialogDescription className="text-sm text-pretty text-tinta-2">{slide.texto}</DialogDescription>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-5">
          <ol aria-label="Progreso" className="flex items-center gap-1.5">
            {SLIDES.map((s, i) => (
              <li
                key={s.titulo}
                aria-current={i === paso ? "step" : undefined}
                className={`h-2 rounded-full motion-safe:transition-colors motion-safe:duration-(--duracion-rapida) ${i === paso ? "w-5 bg-activo" : "w-2 bg-linea-fuerte"}`}
              >
                <span className="sr-only">
                  Paso {i + 1}
                  {i === paso ? " (actual)" : ""}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            {paso > 0 && (
              <Button variant="outline" size="lg" onClick={() => ir(paso - 1)}>
                Anterior
              </Button>
            )}
            {ultimo ? (
              <Button size="lg" onClick={empezar}>
                Empezar
              </Button>
            ) : (
              <Button size="lg" onClick={() => ir(paso + 1)}>
                Siguiente
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
