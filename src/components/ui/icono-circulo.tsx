import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ícono en círculo de las tarjetas (etapas, resumen, fugas, experimentos y siguiente paso).
 * Fondo de tarjeta con un borde fino del tono; el ícono en -texto. Decorativo: aria-hidden.
 */
export function IconoCirculo({ Icono, tono = "azul", className }: { Icono: LucideIcon; tono?: "azul" | "coral"; className?: string }) {
  return (
    <span
      aria-hidden
      data-slot="icono-circulo"
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-full border bg-tarjeta",
        tono === "coral" ? "border-coral/35 text-coral-texto" : "border-azul-relleno/35 text-azul-texto",
        className,
      )}
    >
      <Icono className="size-[18px]" strokeWidth={1.7} />
    </span>
  );
}
