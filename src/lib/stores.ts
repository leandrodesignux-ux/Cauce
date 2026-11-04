"use client";

// Estado de sesión (no compartible) persistido en localStorage. Se rehidrata después de montar
// para que el primer render del cliente coincida con el del servidor.

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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


export function rehidratarStores(): void {
  void useSesion.persist.rehydrate();
}
