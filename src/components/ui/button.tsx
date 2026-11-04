import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Cauce: botones con radio contenido (--radio-boton). Las acciones de la UI (rail, barra móvil, encabezados
// de panel) son círculos vidriados (`vidrio` + `redondo`); el estado activo va en --activo.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-boton border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform] duration-(--duracion-presion) ease-salida outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 motion-safe:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/85",
        outline:
          "border-linea-fuerte bg-tarjeta hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        // Ghost en tinta-2: acciones secundarias, cerrar paneles.
        sutil:
          "text-muted-foreground hover:bg-neutro-suave hover:text-foreground aria-expanded:bg-neutro-suave aria-expanded:text-foreground",
        // Superficie vidriada sobre el degradé: botones redondos del rail y chips de filtro.
        // Activo (aria-pressed o data-activo) = color activo.
        vidrio:
          "vidrio text-tinta-cuerpo hover:bg-tarjeta aria-expanded:bg-tarjeta aria-pressed:border-activo aria-pressed:bg-activo aria-pressed:text-sobre-activo data-[activo=true]:border-activo data-[activo=true]:bg-activo data-[activo=true]:text-sobre-activo",
        // Botón redondo dentro de un panel vidriado: superficie sólida (nunca vidrio sobre vidrio).
        tarjeta:
          "border-tarjeta-borde bg-tarjeta text-tinta-cuerpo shadow-tarjeta hover:bg-muted aria-expanded:bg-muted aria-pressed:border-activo aria-pressed:bg-activo aria-pressed:text-sobre-activo",
        // Botón redondo dentro del cromo flotante (barra móvil): sin superficie propia, el material ya lo da la barra.
        cromo:
          "text-tinta-cuerpo hover:bg-neutro-suave aria-expanded:bg-neutro-suave aria-pressed:bg-activo aria-pressed:text-sobre-activo",
        // Disparadores de filtro: chip vidriado con la etiqueta en tinta-2 y el valor en tinta (<b>).
        filtro:
          "vidrio text-tinta-cuerpo hover:bg-tarjeta aria-expanded:bg-tarjeta [&_b]:font-semibold [&_b]:text-tinta data-[activo=true]:border-azul data-[activo=true]:bg-tarjeta",
        // Acción de rescate: pill coral con texto blanco.
        coral: "bg-coral-relleno font-semibold text-sobre-relleno hover:bg-coral-relleno/90",
        destructive:
          "bg-coral-suave text-coral-texto hover:bg-coral-suave/80 focus-visible:ring-destructive/20",
        link: "text-azul-texto underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7.5 gap-1 px-3 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-10",
        // Botón circular de acción (rail, barra móvil, encabezado de panel).
        redondo: "size-12 rounded-full [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
