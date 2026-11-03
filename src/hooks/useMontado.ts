"use client";

import { useSyncExternalStore } from "react";

const suscribir = () => () => {};

/**
 * false en el servidor y durante la hidratación; true después. Para lo que solo existe en el cliente
 * (portales a document.body, el tema guardado) sin provocar diferencias de hidratación.
 */
export function useMontado(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => true,
    () => false,
  );
}
