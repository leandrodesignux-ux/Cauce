"use client";

import { useEffect, useRef, useState } from "react";

const salida = (p: number) => 1 - Math.pow(1 - p, 3);

/**
 * Interpola un arreglo de números hacia `objetivo` en `duracion` ms (ease-out).
 * Con `instantaneo` salta directo al valor final. `objetivo` debe ser estable (useMemo).
 */
export function useTween(objetivo: readonly number[], duracion: number, instantaneo: boolean): readonly number[] {
  const [valor, setValor] = useState(objetivo);
  const actual = useRef(objetivo);

  useEffect(() => {
    const desde = actual.current;
    let id = 0;
    let inicio: number | null = null;
    const paso = (t: number) => {
      inicio ??= t;
      const p = instantaneo || desde.length !== objetivo.length ? 1 : Math.min(1, (t - inicio) / duracion);
      const e = salida(p);
      const v = objetivo.map((o, i) => desde[i] + (o - desde[i]) * e);
      actual.current = v;
      setValor(v);
      if (p < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [objetivo, duracion, instantaneo]);

  return valor;
}
