import { Suspense, type ReactNode } from "react";
import { CommandPalette } from "@/components/CommandPalette";
import { BarraMovil } from "./BarraMovil";
import { BarraSuperior } from "./BarraSuperior";
import { Rail } from "./Rail";

/**
 * Escritorio y tablet: rail de 88 px + contenido. Móvil: contenido a todo el ancho y barra flotante abajo.
 * Rail, barra superior y barra móvil leen filtros de la URL: van en Suspense.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[var(--ancho-rail)_minmax(0,1fr)]">
      <Suspense>
        <Rail />
      </Suspense>
      <div className="flex min-w-0 flex-col px-4 pt-4 pb-28 md:pt-6 md:pr-8 md:pb-12 md:pl-2">
        <Suspense>
          <BarraSuperior />
        </Suspense>
        <main id="contenido" className="flex min-w-0 flex-1 flex-col">
          {children}
        </main>
        <p className="mt-10 text-center text-xs text-tinta-2 md:hidden">Prototipo con datos demo</p>
      </div>
      <Suspense>
        <BarraMovil />
      </Suspense>
      <Suspense>
        <CommandPalette />
      </Suspense>
    </div>
  );
}
