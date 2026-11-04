"use client";

import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Un conteo que "salta" (escala 1 → 1.12 → 1) cada vez que cambia `clave` (no al montar).
 * Con reduced motion no se mueve.
 */
export function Bump({ clave, children, className }: { clave: string | number; children: ReactNode; className?: string }) {
  const [alcance, animar] = useAnimate<HTMLSpanElement>();
  const reducir = useReducedMotion() ?? false;
  const previa = useRef(clave);

  useEffect(() => {
    if (previa.current === clave) return;
    previa.current = clave;
    if (reducir || !alcance.current) return;
    const control = animar(alcance.current, { scale: [1, 1.12, 1] }, { duration: 0.35, ease: [0.4, 0, 0.2, 1] });
    return () => control.stop();
  }, [clave, reducir, alcance, animar]);

  return (
    <span ref={alcance} className={`inline-block ${className ?? ""}`}>
      {children}
    </span>
  );
}
