"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

const ContextoCerrar = createContext<() => void>(() => {});

/** Cierra el popover que contiene al componente y devuelve el foco a su botón. */
export function useCerrarPopover(): () => void {
  return useContext(ContextoCerrar);
}

export const claseControl =
  "inline-flex h-8 items-center gap-1.5 rounded-control border px-3 text-sm whitespace-nowrap motion-safe:transition-colors";

export function claseEstadoControl(activo: boolean): string {
  return activo
    ? "border-cauce bg-cauce-suave text-cauce-texto"
    : "border-linea-fuerte text-tinta hover:border-niebla hover:bg-papel";
}

/** Popover no modal: Esc o clic afuera lo cierran y el foco vuelve al botón. */
export function Popover({
  etiqueta,
  activo = false,
  children,
  alinear = "inicio",
}: {
  etiqueta: ReactNode;
  activo?: boolean;
  children: ReactNode;
  alinear?: "inicio" | "fin";
}) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();

  const cerrar = useCallback(() => {
    setAbierto(false);
    boton.current?.focus();
  }, []);

  useEffect(() => {
    if (!abierto) return;
    panel.current?.querySelector<HTMLElement>("input, button, select")?.focus();
    const alPresionar = (e: PointerEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", alPresionar);
    return () => document.removeEventListener("pointerdown", alPresionar);
  }, [abierto]);

  return (
    <div
      ref={raiz}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape" && abierto) {
          e.stopPropagation();
          cerrar();
        }
      }}
      onBlur={(e) => {
        if (abierto && !raiz.current?.contains(e.relatedTarget as Node)) setAbierto(false);
      }}
    >
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((a) => !a)}
        className={`${claseControl} ${claseEstadoControl(activo)}`}
      >
        {etiqueta}
        <ChevronDown className={`size-3.5 opacity-70 motion-safe:transition-transform ${abierto ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div
            ref={panel}
            id={id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className={`absolute top-full z-30 mt-2 min-w-60 rounded-panel border border-linea bg-papel p-2 shadow-flotante ${
              alinear === "fin" ? "right-0" : "left-0"
            }`}
          >
            <ContextoCerrar.Provider value={cerrar}>{children}</ContextoCerrar.Provider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
