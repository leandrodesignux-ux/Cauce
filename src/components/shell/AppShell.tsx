import { Suspense, type ReactNode } from "react";
import { CommandPalette } from "@/components/CommandPalette";
import { BarraInferiorMovil, BarraSuperiorMovil } from "./BarrasMoviles";
import { NavRail } from "./NavRail";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col pb-(--alto-barra-movil) md:pb-0">
        <BarraSuperiorMovil />
        <main id="contenido" className="flex min-w-0 flex-1 flex-col">
          {children}
        </main>
      </div>
      <BarraInferiorMovil />
      <Suspense>
        <CommandPalette />
      </Suspense>
    </div>
  );
}
