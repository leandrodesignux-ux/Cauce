"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useMedia } from "@/hooks/useMedia";

type Titulo = ComponentType<{ children: ReactNode; className?: string }>;

/**
 * Detalle centrado (experimentos). ≥768 px: Dialog de hasta 760 px y 85 dvh, con el encabezado fijo
 * (título, estado y cerrar) y el contenido con scroll propio. Móvil: Drawer desde abajo.
 * Se abre sin Trigger (desde una tarjeta, fila o barra), así que al cerrar devuelve el foco a quien lo tenía.
 */
export function PanelCentrado({
  abierto,
  clave,
  titulo,
  subtitulo,
  estado,
  onCerrar,
  children,
}: {
  abierto: boolean;
  /** Cambia con la selección: el foco vuelve al título cuando se abre otro. */
  clave: string | null;
  titulo: string;
  subtitulo?: string;
  /** Badge de estado junto al título. */
  estado?: ReactNode;
  onCerrar: () => void;
  children: ReactNode;
}) {
  const tablet = useMedia("(min-width: 768px)", true);
  const encabezado = useRef<HTMLSpanElement>(null);
  const previo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (clave) encabezado.current?.focus({ preventScroll: true });
  }, [clave]);

  const contenido = (Titulo: Titulo) => (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-start gap-3 border-b border-linea px-6 pt-6 pb-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Titulo className="font-heading text-xl leading-tight font-semibold">
              <span ref={encabezado} tabIndex={-1} className="outline-none">
                {titulo}
              </span>
            </Titulo>
            {estado}
          </div>
          {subtitulo && <p className="mt-1 text-sm text-tinta-2">{subtitulo}</p>}
        </div>
        <Button variant="sutil" size="icon-lg" onClick={onCerrar} aria-label="Cerrar detalle">
          <X className="size-5" />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
    </div>
  );

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

  if (tablet) {
    return (
      <Dialog open={abierto} onOpenChange={alCambiar}>
        <DialogContent showCloseButton={false} className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-[760px]" {...foco}>
          {contenido(DialogTitle)}
        </DialogContent>
      </Dialog>
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
