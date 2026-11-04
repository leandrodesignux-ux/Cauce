"use client";

import { AnimatePresence, motion } from "motion/react";

export type Token = { id: string; desde: { x: number; y: number }; hasta: { x: number; y: number } };

/**
 * Tokens "+1" que vuelan desde la fila rescatada hasta el conteo de Rescatados (posiciones medidas con
 * getBoundingClientRect, en coordenadas de la ventana). Al llegar, `onLlegar` dispara el bump del conteo.
 * Decorativo (aria-hidden); con reduced motion no se crean.
 */
export function TokensRescate({ tokens, onLlegar }: { tokens: Token[]; onLlegar: (id: string) => void }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {tokens.map((t) => (
          <motion.span
            key={t.id}
            className="cifra absolute top-0 left-0 rounded-full bg-azul-relleno px-2 py-0.5 text-xs font-semibold text-sobre-relleno shadow-flotante"
            initial={{ x: t.desde.x, y: t.desde.y, scale: 1, opacity: 1 }}
            animate={{ x: t.hasta.x, y: t.hasta.y, scale: 0.85, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={() => onLlegar(t.id)}
          >
            +1
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Centro de un elemento en la ventana, corrido para centrar el token (~32 × 20 px). */
export function centroDe(el: Element | null): { x: number; y: number } | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2 - 16, y: r.top + r.height / 2 - 10 };
}
