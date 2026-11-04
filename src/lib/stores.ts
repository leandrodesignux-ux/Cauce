"use client";

// Estado de sesión (no compartible) persistido en localStorage. Se rehidrata después de montar
// para que el primer render del cliente coincida con el del servidor.

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { type DatosDemo, type EstadoDemo, avanzar, esSimulado, estadoInicial } from "./demoVivo";

type Marcas = Record<string, string>; // leadId → fecha ISO de la acción

type Sesion = {
  rescatados: Marcas;
  descartados: Marcas;
  rescatar: (ids: string[]) => void;
  descartar: (ids: string[]) => void;
  /** Deshace rescate o descarte. */
  restaurar: (ids: string[]) => void;
  /** El onboarding se mostró (y se cerró) al menos una vez. */
  onboardingVisto: boolean;
  marcarOnboarding: () => void;
};

function sin(marcas: Marcas, ids: string[]): Marcas {
  const copia = { ...marcas };
  for (const id of ids) delete copia[id];
  return copia;
}

export const useSesion = create<Sesion>()(
  persist(
    (set) => ({
      rescatados: {},
      descartados: {},
      rescatar: (ids) =>
        set((s) => {
          const ahora = new Date().toISOString();
          return { rescatados: { ...s.rescatados, ...Object.fromEntries(ids.map((id) => [id, ahora])) }, descartados: sin(s.descartados, ids) };
        }),
      descartar: (ids) =>
        set((s) => {
          const ahora = new Date().toISOString();
          return { descartados: { ...s.descartados, ...Object.fromEntries(ids.map((id) => [id, ahora])) }, rescatados: sin(s.rescatados, ids) };
        }),
      restaurar: (ids) => set((s) => ({ rescatados: sin(s.rescatados, ids), descartados: sin(s.descartados, ids) })),
      onboardingVisto: false,
      marcarOnboarding: () => set({ onboardingVisto: true }),
    }),
    {
      name: "cauce-sesion",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ rescatados: s.rescatados, descartados: s.descartados, onboardingVisto: s.onboardingVisto }),
      skipHydration: true,
    },
  ),
);

const suscribirHidratacion = (aviso: () => void) => useSesion.persist.onFinishHydration(aviso);

/** true cuando el store de sesión ya leyó localStorage (en el servidor y en el primer render, false). */
export function useSesionHidratada(): boolean {
  return useSyncExternalStore(suscribirHidratacion, () => useSesion.persist.hasHydrated(), () => false);
}

export function esHoy(iso: string): boolean {
  const fecha = new Date(iso);
  const hoy = new Date();
  return fecha.getFullYear() === hoy.getFullYear() && fecha.getMonth() === hoy.getMonth() && fecha.getDate() === hoy.getDate();
}

/** "Rescatados hoy": leads rescatados en la fecha local actual. */
export function useRescatadosHoy(): number {
  return useSesion((s) => Object.values(s.rescatados).filter(esHoy).length);
}

type DemoVivo = {
  activo: boolean;
  pausado: boolean;
  estado: EstadoDemo;
  /** Activa la demo (o la reanuda si estaba en pausa). */
  iniciar: () => void;
  pausar: () => void;
  /** Vuelve al tick 0 y limpia las marcas de rescate/descarte de los leads simulados. */
  reiniciar: () => void;
  /** Apaga la demo: las cifras vuelven a las de los datos reales. */
  detener: () => void;
  /** Un tick del motor (lo llama el intervalo de Proveedores). */
  avanzar: (datos: DatosDemo, ahora: number) => void;
};

function limpiarMarcasSimuladas() {
  const { rescatados, descartados, restaurar } = useSesion.getState();
  const ids = [...Object.keys(rescatados), ...Object.keys(descartados)].filter(esSimulado);
  if (ids.length) restaurar(ids);
}

/** Modo demo en vivo: no se persiste (cada carga empieza apagada salvo con ?demo=1). */
export const useDemoVivo = create<DemoVivo>()((set) => ({
  activo: false,
  pausado: false,
  estado: estadoInicial(),
  iniciar: () => set({ activo: true, pausado: false }),
  pausar: () => set({ pausado: true }),
  reiniciar: () => {
    limpiarMarcasSimuladas();
    set({ estado: estadoInicial(), pausado: false });
  },
  detener: () => {
    limpiarMarcasSimuladas();
    set({ activo: false, pausado: false, estado: estadoInicial() });
  },
  avanzar: (datos, ahora) => set((s) => ({ estado: avanzar(s.estado, datos, ahora) })),
}));

export function rehidratarStores(): void {
  void useSesion.persist.rehydrate();
}
