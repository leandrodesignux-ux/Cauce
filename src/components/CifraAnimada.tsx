"use client";

import { useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { useTween } from "@/hooks/useTween";

/** Una cifra que interpola 300 ms hacia su valor nuevo (directo con reduced motion). */
export function CifraAnimada({ valor, formato, duracion = 300 }: { valor: number; formato: (v: number) => string; duracion?: number }) {
  const reducir = useReducedMotion() ?? false;
  const objetivo = useMemo(() => [valor], [valor]);
  const [animado] = useTween(objetivo, duracion, reducir);
  return <>{formato(animado ?? valor)}</>;
}
