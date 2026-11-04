"use client";

import { useCallback, useEffect, useState } from "react";
import { ACTOS } from "./actos";

/** Cómo se llegó al acto: en orden (se reproduce su coreografía) o saltando (se reconstruye su estado final en 0.4 s). */
export type Modo = "coreografia" | "rapido";

export type Pausas = { manual: boolean; hover: boolean; foco: boolean; oculto: boolean };

const SIN_PAUSAS: Pausas = { manual: false, hover: false, foco: false, oculto: false };

/**
 * Autoplay, pausa y navegación de los actos. El tiempo de cada acto lo lleva la animación CSS de su
 * segmento de progreso (animation-play-state sigue a `pausado`); al terminar, llama a `completar`.
 * Sin rAF ni timers propios: el único loop es el de los puntos de la escena.
 */
export function useActos(reducir: boolean) {
  // El contenido del diálogo se monta en cada apertura: empieza en el acto 1, sin pausas.
  const [acto, setActo] = useState(0);
  const [modo, setModo] = useState<Modo>("coreografia");
  const [pausas, setPausas] = useState<Pausas>(() => ({ ...SIN_PAUSAS, oculto: typeof document !== "undefined" && document.hidden }));

  // Pestaña oculta: pausa (los puntos y el segmento).
  useEffect(() => {
    const alCambiar = () => setPausas((p) => ({ ...p, oculto: document.hidden }));
    document.addEventListener("visibilitychange", alCambiar);
    return () => document.removeEventListener("visibilitychange", alCambiar);
  }, []);

  const ir = useCallback(
    (destino: number) => {
      if (destino < 0 || destino >= ACTOS.length || destino === acto) return;
      setModo(destino === acto + 1 ? "coreografia" : "rapido");
      setActo(destino);
    },
    [acto],
  );

  /** Fin del segmento del acto actual (autoplay). En el último acto se queda quieto. */
  const completar = useCallback(() => {
    if (acto < ACTOS.length - 1) ir(acto + 1);
  }, [acto, ir]);

  const pausar = useCallback((motivo: keyof Pausas, valor: boolean) => setPausas((p) => (p[motivo] === valor ? p : { ...p, [motivo]: valor })), []);
  const alternarPausa = useCallback(() => setPausas((p) => ({ ...p, manual: !p.manual })), []);

  const autoplay = !reducir;
  const pausado = !autoplay || pausas.manual || pausas.hover || pausas.foco || pausas.oculto;
  return {
    acto,
    modo,
    ultimo: acto === ACTOS.length - 1,
    autoplay,
    /** También detiene los puntos de la escena. */
    pausado,
    pausaManual: pausas.manual,
    ir,
    completar,
    pausar,
    alternarPausa,
  };
}
