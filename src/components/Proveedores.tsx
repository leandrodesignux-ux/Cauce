"use client";

import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { type DatosCompactos, type LeadIndice, expandirFlujo } from "@/lib/datos-cliente";
import { rehidratarStores } from "@/lib/stores";
import { ColorDeBarra } from "./shell/SwitchTema";
import { TooltipProvider } from "./ui/tooltip";
import type { Experimento, Fuga, SemanaEtapa } from "@/lib/tipos";

type Datos = {
  flujo: SemanaEtapa[];
  semanas: string[];
  ultimaSemana: string;
  fugas: Fuga[];
  experimentos: Experimento[];
  leads: LeadIndice[];
};

const ContextoDatos = createContext<Datos | null>(null);

export function useDatos(): Datos {
  const datos = useContext(ContextoDatos);
  if (!datos) throw new Error("useDatos fuera de <Proveedores>");
  return datos;
}

export function Proveedores({ datos, children }: { datos: DatosCompactos; children: ReactNode }) {
  const valor = useMemo<Datos>(
    () => ({
      flujo: expandirFlujo(datos),
      semanas: datos.semanas,
      ultimaSemana: datos.semanas[datos.semanas.length - 1],
      fugas: datos.fugas,
      experimentos: datos.experimentos,
      leads: datos.leads,
    }),
    [datos],
  );

  useEffect(rehidratarStores, []);

  return (
    // Tema por clase en <html>: arranca en claro y solo cambia con el switch (no sigue al sistema).
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <ColorDeBarra />
      <ContextoDatos.Provider value={valor}>
        {/* "user": respeta prefers-reduced-motion en todas las animaciones de motion. */}
        <MotionConfig reducedMotion="user">
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        </MotionConfig>
      </ContextoDatos.Provider>
    </ThemeProvider>
  );
}
