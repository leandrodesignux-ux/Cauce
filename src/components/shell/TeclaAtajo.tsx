"use client";

import { useSyncExternalStore } from "react";

const suscribir = () => () => {};

/** "⌘K" en Mac, "Ctrl K" en el resto. En el servidor muestra "⌘K". */
export function TeclaAtajo() {
  const esMac = useSyncExternalStore(
    suscribir,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => true,
  );
  return (
    <kbd className="rounded border border-linea px-1.5 font-sans text-xs text-tinta-2">{esMac ? "⌘K" : "Ctrl K"}</kbd>
  );
}
