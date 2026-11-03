"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useMontado } from "@/hooks/useMontado";

const ENFOCABLES = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/** Hoja modal desde abajo (móvil). Atrapa el foco, Esc cierra y el foco vuelve a quien la abrió. */
export function HojaInferior({
  abierta,
  onCerrar,
  titulo,
  children,
  pie,
}: {
  abierta: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  pie?: ReactNode;
}) {
  const montado = useMontado();
  const panel = useRef<HTMLDivElement>(null);
  const previo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!abierta) return;
    previo.current = document.activeElement as HTMLElement;
    panel.current?.querySelector<HTMLElement>(ENFOCABLES)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previo.current?.focus();
    };
  }, [abierta]);

  const alPresionar = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCerrar();
    }
    if (e.key !== "Tab" || !panel.current) return;
    const enfocables = [...panel.current.querySelectorAll<HTMLElement>(ENFOCABLES)];
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    if (e.shiftKey && document.activeElement === primero) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  };

  if (!montado) return null;

  return createPortal(
    <AnimatePresence>
      {abierta && (
        <div className="fixed inset-0 z-40" onKeyDown={alPresionar}>
          <motion.div
            className="absolute inset-0 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCerrar}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-panel border-t border-linea bg-papel shadow-flotante"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-linea-fuerte" aria-hidden />
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <h2 className="font-cifra text-lg font-semibold">{titulo}</h2>
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar"
                className="grid size-10 place-items-center rounded-control text-niebla hover:text-tinta"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">{children}</div>
            {pie && <div className="border-t border-linea p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{pie}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
