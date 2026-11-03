"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMedia } from "@/hooks/useMedia";

type Titulo = ComponentType<{ children: ReactNode; className?: string }>;

/**
 * Panel de etapa, transición o experimento. ≥768 px: Sheet a la derecha (440 px en escritorio, 60 % en tablet).
 * Móvil (<768 px): Drawer desde abajo. Es modal y atrapa el foco; se abre sin Trigger (desde una fila del
 * board o de la tabla), así que al cerrar devuelve el foco al elemento que lo tenía al abrir.
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
  const tablet = useMedia("(min-width: 768px)", true);
  const encabezado = useRef<HTMLHeadingElement>(null);
  const previo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (clave) encabezado.current?.focus({ preventScroll: true });
  }, [clave]);

  const contenido = (Titulo: Titulo) => (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-start gap-3 border-b border-linea px-6 pb-4 pt-6">
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
      <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5">{children}</div>
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

  if (tablet) {
    return (
      <Sheet open={abierto} onOpenChange={alCambiar}>
        <SheetContent side="right" showCloseButton={false} className="gap-0 data-[side=right]:w-[60%] data-[side=right]:sm:max-w-none data-[side=right]:xl:w-(--ancho-panel)" {...foco}>
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
