import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

/*
 * Badges de Cauce (docs/DESIGN.md): relleno tintado, texto en la variante -texto
 * y borde del mismo tono al 40 %. Nunca solo contorno ni relleno sólido.
 */
const TONO = {
  cauce: "border-cauce/40 bg-cauce-suave text-cauce-texto",
  laton: "border-laton/40 bg-laton-suave text-laton-texto",
  oxido: "border-oxido/40 bg-oxido-suave text-oxido-texto",
  niebla: "border-niebla/40 bg-niebla-suave text-niebla-texto",
} as const

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-control border px-2 text-xs font-medium whitespace-nowrap focus-visible:ring-[3px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        neutro: TONO.niebla,
        // Score de intención
        alto: TONO.cauce,
        medio: TONO.laton,
        bajo: TONO.niebla,
        // Estados de experimento
        diseno: TONO.niebla,
        en_curso: TONO.cauce,
        leyendo: TONO.laton,
        validado: "border-cauce/40 bg-cauce-fuerte text-cauce-texto",
        refutado: TONO.oxido,
        // Señales de un lead
        urgente: TONO.oxido,
        // Contador de pendientes en la pestaña activa de una poza
        pendientes: TONO.oxido,
        critica: TONO.laton,
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
