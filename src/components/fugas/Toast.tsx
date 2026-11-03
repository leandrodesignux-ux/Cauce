"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useMontado } from "@/hooks/useMontado";

export type DatosToast = { id: number; mensaje: string; accion?: { etiqueta: string; alHacer: () => void } };

const DURACION = 5000;

/** Aviso abajo al centro, con acción (Deshacer) disponible durante 5 s. */
export function Toast({ toast, onCerrar }: { toast: DatosToast | null; onCerrar: () => void }) {
  const montado = useMontado();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onCerrar, DURACION);
    return () => clearTimeout(t);
  }, [toast, onCerrar]);

  if (!montado) return null;
  return createPortal(
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--alto-barra-movil)+12px)] z-50 flex justify-center px-4 md:bottom-6">
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto relative flex items-center gap-4 overflow-hidden rounded-panel bg-tinta py-3 pl-4 pr-2 text-sm text-concreto shadow-flotante"
          >
            <span>{toast.mensaje}</span>
            {toast.accion && (
              <button
                type="button"
                onClick={() => {
                  toast.accion!.alHacer();
                  onCerrar();
                }}
                className="rounded-control px-2.5 py-1 font-semibold underline underline-offset-2 hover:bg-concreto/10"
              >
                {toast.accion.etiqueta}
              </button>
            )}
            <motion.span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-laton"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: DURACION / 1000, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
