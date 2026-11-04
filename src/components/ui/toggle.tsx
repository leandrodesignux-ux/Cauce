"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Toggle as TogglePrimitive } from "radix-ui"

const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1 rounded-full text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-(--duracion-presion) ease-salida outline-none motion-safe:active:scale-[0.97] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-transparent hover:bg-muted hover:text-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
        // Chips y alternadores de Cauce: pill vidriada en reposo, pill negra (blanca en oscuro) si está activa.
        outline:
          "rounded-full vidrio text-tinta-2 hover:bg-tarjeta hover:text-tinta data-[state=on]:border-activo data-[state=on]:bg-activo data-[state=on]:text-sobre-activo",
        // Chip de alerta (ventana crítica): borde coral en reposo, pill coral sólida si está activa.
        alerta:
          "rounded-full border border-coral bg-tarjeta text-tinta hover:bg-coral-suave data-[state=on]:border-coral-relleno data-[state=on]:bg-coral-relleno data-[state=on]:text-sobre-relleno",
        // Control segmentado (vistas, período, tabla/timeline): pill negra para el activo dentro de una pill vidriada.
        segmentado:
          "h-full rounded-full px-4 text-tinta-2 hover:text-tinta data-[state=on]:bg-activo data-[state=on]:text-sobre-activo",
      },
      size: {
        default:
          "h-8 min-w-8 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        sm: "h-7 min-w-7 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 min-w-9 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
