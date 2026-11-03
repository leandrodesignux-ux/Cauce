"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMontado } from "@/hooks/useMontado";
import { useMedia } from "@/hooks/useMedia";

const ENFOCABLES = 'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])';
const SALIDA = [0.22, 1, 0.36, 1] as const;

/**
 * Panel lateral de etapa o transición.
 * Escritorio (≥1280 px): entra desde la derecha y empuja el contenido (420 px).
 * Tablet: hoja del 60 % del ancho. Móvil: pantalla completa. En ambos es modal y atrapa el foco.
 */
export function StagePanel({
  abierto,
  clave,
  titulo,
  subtitulo,
  onCerrar,
  children,
}: {
  abierto: boolean;
  /** Cambia con la selección: el foco vuelve al título cuando se abre otra etapa. */
  clave: string | null;
  titulo: string;
  subtitulo?: string;
  onCerrar: () => void;
  children: ReactNode;
}) {
  const montado = useMontado();
  const escritorio = useMedia("(min-width: 1280px)", true);
  const reducir = useReducedMotion() ?? false;
  const encabezado = useRef<HTMLHeadingElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clave) encabezado.current?.focus({ preventScroll: true });
  }, [clave]);

  // Modal (tablet y móvil): bloquea el scroll de la página.
  useEffect(() => {
    if (!abierto || escritorio) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [abierto, escritorio]);

  const alPresionar = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCerrar();
      return;
    }
    if (escritorio || e.key !== "Tab" || !panel.current) return;
    const enfocables = [...panel.current.querySelectorAll<HTMLElement>(ENFOCABLES)];
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    if (e.shiftKey && (document.activeElement === primero || document.activeElement === encabezado.current)) {
      e.preventDefault();
      ultimo?.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero?.focus();
    }
  };

  const duracion = reducir ? 0 : 0.2;

  const contenido = (
    <div ref={panel} onKeyDown={alPresionar} className="flex h-full flex-col">
      <header className="flex items-start gap-3 border-b border-linea px-5 pb-4 pt-5">
        <div className="min-w-0 flex-1">
          <h2 ref={encabezado} tabIndex={-1} className="font-cifra text-xl font-semibold leading-tight outline-none">
            {titulo}
          </h2>
          {subtitulo && <p className="mt-1 text-sm text-niebla">{subtitulo}</p>}
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar panel"
          title="Cerrar (Esc)"
          className="grid size-9 shrink-0 place-items-center rounded-control text-niebla hover:bg-concreto hover:text-tinta"
        >
          <X className="size-5" aria-hidden />
        </button>
      </header>
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
    </div>
  );

  if (escritorio) {
    return (
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.aside
            key="panel"
            aria-label={`Detalle: ${titulo}`}
            initial={{ width: 0 }}
            animate={{ width: "auto" }}
            exit={{ width: 0 }}
            transition={{ duration: duracion, ease: SALIDA }}
            className="sticky top-0 h-dvh shrink-0 overflow-hidden"
          >
            <div className="h-full w-(--ancho-panel) rounded-l-panel border-l border-linea bg-papel shadow-flotante">{contenido}</div>
          </motion.aside>
        )}
      </AnimatePresence>
    );
  }

  if (!montado) return null;
  return createPortal(
    <AnimatePresence>
      {abierto && (
        <div className="fixed inset-0 z-40">
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duracion }}
            onClick={onCerrar}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Detalle: ${titulo}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: duracion, ease: SALIDA }}
            className="absolute inset-y-0 right-0 w-full bg-papel shadow-flotante md:w-[60%] md:rounded-l-panel md:border-l md:border-linea"
          >
            {contenido}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
