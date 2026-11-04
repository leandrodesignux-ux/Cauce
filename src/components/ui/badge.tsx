import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/*
 * Pills de Cauce (docs/DESIGN.md): tres intensidades por tono.
 * - relleno: fondo -relleno con texto blanco (lo más fuerte: score alto, más de 3 días sin atención).
 * - suave: fondo -suave con texto -texto.
 * - activo: color activo (índigo; lavanda en oscuro), como el estado activo del resto de la UI.
 * El texto siempre nombra el estado: el color nunca va solo.
 */
const TONO = {
  azulRelleno: "bg-azul-relleno text-sobre-relleno",
  azulSuave: "bg-azul-suave text-azul-texto",
  coralRelleno: "bg-coral-relleno text-sobre-relleno",
  coralSuave: "bg-coral-suave text-coral-texto",
  neutro: "bg-neutro-suave text-tinta-2",
  activo: "bg-activo text-sobre-activo",
} as const

const badgeVariants = cva(
  "group/badge inline-flex h-6.5 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-badge px-2.5 text-xs font-semibold whitespace-nowrap focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        neutro: TONO.neutro,
        // Score de intención
        alto: TONO.azulRelleno,
        medio: TONO.azulSuave,
        bajo: TONO.neutro,
        // Estados de experimento
        diseno: TONO.neutro,
        en_curso: TONO.azulSuave,
        leyendo: TONO.activo,
        validado: TONO.azulRelleno,
        refutado: TONO.coralSuave,
        // Señales de un lead
        urgente: TONO.coralRelleno,
        // Días sin atención: dentro de la ventana crítica (≤3) o ya fuera (>3)
        critica: TONO.coralSuave,
        atrasado: TONO.coralRelleno,
        // Contador de pendientes en la pestaña activa de una poza
        pendientes: TONO.coralRelleno,
      },
    },
    defaultVariants: {
      variant: "neutro",
    },
  }
)

function Badge({
  className,
  variant = "neutro",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
