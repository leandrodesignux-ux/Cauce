"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Botón circular vidriado con tooltip: las acciones del rail, la barra móvil y los encabezados de panel.
 * `presionado` lo vuelve un alternador (aria-pressed → color activo). Acepta ser hijo de un Trigger con asChild.
 * `superficie` evita apilar vidrio sobre vidrio: en un panel va sólido y en la barra móvil, sin superficie.
 */
export function BotonRedondo({
  etiqueta,
  lado = "right",
  presionado,
  superficie = "vidrio",
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "variant" | "size"> & {
  etiqueta: string;
  lado?: "right" | "top" | "bottom" | "left";
  presionado?: boolean;
  /** vidrio sobre el degradé (rail); tarjeta dentro de un panel; cromo dentro de la barra móvil. */
  superficie?: "vidrio" | "tarjeta" | "cromo";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={superficie} size="redondo" aria-label={etiqueta} aria-pressed={presionado} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={lado} sideOffset={8}>
        {etiqueta}
      </TooltipContent>
    </Tooltip>
  );
}
