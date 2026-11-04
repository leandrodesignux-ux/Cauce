"use client";

import { Pause, Play, Radio, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoVivo } from "@/lib/stores";

/**
 * Control del modo demo en vivo. Apagado: "Activar demo en vivo". Activo: una pastilla azul suave con un punto
 * verde que pulsa (la única animación en loop: indica estado; quieto con reduced motion o en pausa), "En vivo ·
 * simulado" y botones de ícono para pausar/reanudar, reiniciar y apagar.
 */
export function ControlDemo({ soloActivo = false, className }: { soloActivo?: boolean; className?: string }) {
  const activo = useDemoVivo((s) => s.activo);
  const pausado = useDemoVivo((s) => s.pausado);
  const { iniciar, pausar, reiniciar, detener } = useDemoVivo.getState();

  if (!activo) {
    if (soloActivo) return null;
    return (
      <Button variant="filtro" size="lg" onClick={iniciar} className={className}>
        <Radio data-icon="inline-start" />
        Activar demo en vivo
      </Button>
    );
  }

  return (
    <div role="group" aria-label="Demo en vivo" className={`flex h-10 items-center gap-1 rounded-full bg-azul-suave pr-1 pl-3.5 text-sm text-azul-texto ${className ?? ""}`}>
      <span aria-hidden data-pausado={pausado || undefined} className="punto-vivo mr-1" />
      <span className="font-medium whitespace-nowrap" aria-live="polite">
        {pausado ? "En pausa · simulado" : "En vivo · simulado"}
      </span>
      <Button variant="sutil" size="icon-sm" onClick={pausado ? iniciar : pausar} aria-label={pausado ? "Reanudar demo" : "Pausar demo"} className="ml-1 text-azul-texto">
        {pausado ? <Play /> : <Pause />}
      </Button>
      <Button variant="sutil" size="icon-sm" onClick={reiniciar} aria-label="Reiniciar demo" className="text-azul-texto">
        <RotateCcw />
      </Button>
      <Button variant="sutil" size="icon-sm" onClick={detener} aria-label="Apagar demo en vivo" className="text-azul-texto">
        <X />
      </Button>
    </div>
  );
}
