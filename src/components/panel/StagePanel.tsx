"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMedia } from "@/hooks/useMedia";

const SALIDA = [0.22, 1, 0.36, 1] as const;

type Titulo = ComponentType<{ children: ReactNode; className?: string }>;

const TituloAside: Titulo = ({ children, className }) => <h2 className={className}>{children}</h2>;

/**
 * Panel lateral de etapa o transición.
 * Escritorio (≥1280 px): entra desde la derecha y empuja el contenido (420 px).
 * Tablet: Sheet del 60 % del ancho. Móvil (<768 px): Drawer desde abajo. En ambos es modal y atrapa el foco.
 * Se abre desde el río o la tabla, sin Trigger. Escritorio: el foco lo devuelve quien llama en `onCerrar`.
 * Modal: la trampa de foco sigue activa durante la salida, así que el panel lo devuelve al elemento que lo abrió.
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
  const escritorio = useMedia("(min-width: 1280px)", true);
  const tablet = useMedia("(min-width: 768px)", true);
  const reducir = useReducedMotion() ?? false;
  const encabezado = useRef<HTMLHeadingElement>(null);
  const previo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (clave) encabezado.current?.focus({ preventScroll: true });
  }, [clave]);

  const contenido = (Titulo: Titulo) => (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-start gap-3 border-b border-linea px-5 pb-4 pt-5">
        <div className="min-w-0 flex-1">
          <Titulo className="font-cifra text-xl font-semibold leading-tight">
            <span ref={encabezado} tabIndex={-1} className="outline-none">
              {titulo}
            </span>
          </Titulo>
          {subtitulo && <p className="mt-1 text-sm text-tinta-2">{subtitulo}</p>}
        </div>
        <Button variant="sutil" size="icon-lg" onClick={onCerrar} aria-label="Cerrar panel">
          <X className="size-5" />
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
    </div>
  );

  // Modal: el foco entra al título y, al terminar de cerrar, vuelve a quien lo tenía al abrir.
  const foco = {
    onOpenAutoFocus: (e: Event) => {
      e.preventDefault();
      previo.current = document.activeElement as HTMLElement | null;
      encabezado.current?.focus({ preventScroll: true });
    },
    onCloseAutoFocus: (e: Event) => {
      e.preventDefault();
      const destino = previo.current;
      if (destino?.isConnected && destino !== document.body) destino.focus({ preventScroll: true });
    },
    "aria-describedby": undefined,
  };
  const alCambiar = (abrir: boolean) => {
    if (!abrir) onCerrar();
  };

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
            transition={{ duration: reducir ? 0 : 0.2, ease: SALIDA }}
            className="sticky top-0 h-dvh shrink-0 overflow-hidden"
            onKeyDown={(e) => {
              if (e.key !== "Escape") return;
              e.stopPropagation();
              onCerrar();
            }}
          >
            <div className="flex h-full w-(--ancho-panel) flex-col rounded-l-panel border-l border-linea bg-tarjeta shadow-flotante">
              {contenido(TituloAside)}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    );
  }

  if (tablet) {
    return (
      <Sheet open={abierto} onOpenChange={alCambiar}>
        <SheetContent side="right" showCloseButton={false} className="gap-0 rounded-l-panel data-[side=right]:w-[60%] data-[side=right]:sm:max-w-none" {...foco}>
          {contenido(SheetTitle)}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={abierto} onOpenChange={alCambiar}>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:h-[92dvh] data-[vaul-drawer-direction=bottom]:max-h-[92dvh]" {...foco}>
        {contenido(DrawerTitle)}
      </DrawerContent>
    </Drawer>
  );
}
