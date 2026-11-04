import { Suspense, type ReactNode } from "react";
import { CommandPalette } from "@/components/CommandPalette";
import { Onboarding } from "@/components/onboarding/Onboarding";
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
      <div className="flex min-w-0 flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-32 md:pt-6 md:pr-8 md:pb-12 md:pl-2">
        <Suspense>
          <BarraSuperior />
        </Suspense>
        <main id="contenido" className="flex min-w-0 flex-1 flex-col">
          {children}
        </main>
        <p className="mt-10 text-center text-xs text-tinta-cuerpo md:hidden">Prototipo con datos demo</p>
      </div>
      {/* Borde inferior: el contenido se funde antes de la barra flotante en vez de chocar con ella. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-32 bg-linear-to-t from-fondo-c via-fondo-c/85 to-transparent md:hidden"
      />
      <Suspense>
        <BarraMovil />
      </Suspense>
      <Suspense>
        <CommandPalette />
      </Suspense>
      <Onboarding />
    </div>
  );
}
