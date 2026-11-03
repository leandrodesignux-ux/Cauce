"use client";

import { useSyncExternalStore } from "react";

/** Coincidencia con una media query. En el servidor devuelve `inicial`. */
export function useMedia(consulta: string, inicial = false): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(consulta);
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => window.matchMedia(consulta).matches,
    () => inicial,
  );
}
