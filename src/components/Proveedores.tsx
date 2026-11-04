"use client";

import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { type DatosDemo, MS_POR_TICK } from "@/lib/demoVivo";
import { type DatosCompactos, type LeadIndice, expandirFlujo } from "@/lib/datos-cliente";
import { rehidratarStores, useDemoVivo } from "@/lib/stores";
import { ColorDeBarra } from "./shell/SwitchTema";
import { Toaster } from "./ui/sonner";
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
  const base = useMemo<Datos>(
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

  // Modo demo en vivo: con la demo activa, las filas y los leads simulados se suman a los reales y todos los
  // selectores se recalculan solos. Apagada, useDatos devuelve exactamente los datos reales.
  const activo = useDemoVivo((s) => s.activo);
  const extra = useDemoVivo((s) => s.estado);
  const valor = useMemo<Datos>(
    () => (activo && (extra.filasExtra.length || extra.leadsExtra.length) ? { ...base, flujo: [...base.flujo, ...extra.filasExtra], leads: [...base.leads, ...extra.leadsExtra] } : base),
    [activo, extra, base],
  );
  const datosDemo = useMemo<DatosDemo>(
    () => ({ flujo: base.flujo, semanas: base.semanas, leads: base.leads, experimentos: base.experimentos, banco: datos.banco }),
    [base, datos.banco],
  );

  useEffect(rehidratarStores, []);
  useMotorDemo(datosDemo);

  return (
    // Tema por clase en <html>: arranca en claro y solo cambia con el switch (no sigue al sistema).
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <ColorDeBarra />
      <ContextoDatos.Provider value={valor}>
        {/* "user": respeta prefers-reduced-motion en todas las animaciones de motion. */}
        <MotionConfig reducedMotion="user">
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          <Toaster />
        </MotionConfig>
      </ContextoDatos.Provider>
    </ThemeProvider>
  );
}

/**
 * Intervalo del modo demo (un tick cada 1.2 s). Se detiene con la pausa y con la pestaña oculta.
 * `?demo=1` en la URL lo activa al cargar.
 */
function useMotorDemo(datos: DatosDemo) {
  const activo = useDemoVivo((s) => s.activo);
  const pausado = useDemoVivo((s) => s.pausado);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1") useDemoVivo.getState().iniciar();
  }, []);

  useEffect(() => {
    if (!activo || pausado) return;
    let id = 0;
    const arrancar = () => {
      window.clearInterval(id);
      if (!document.hidden) id = window.setInterval(() => useDemoVivo.getState().avanzar(datos, Date.now()), MS_POR_TICK);
    };
    arrancar();
    document.addEventListener("visibilitychange", arrancar);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", arrancar);
    };
  }, [activo, pausado, datos]);
}
