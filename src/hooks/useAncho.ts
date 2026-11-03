"use client";

import { useEffect, useState, type RefObject } from "react";

/** Ancho del elemento en px (0 hasta la primera medición). */
export function useAncho(ref: RefObject<HTMLElement | null>): number {
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observador = new ResizeObserver(([entrada]) => setAncho(Math.round(entrada.contentRect.width)));
    observador.observe(el);
    return () => observador.disconnect();
  }, [ref]);
  return ancho;
}
