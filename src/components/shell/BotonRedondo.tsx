"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Botón circular vidriado con tooltip: las acciones del rail, la barra móvil y los encabezados de panel.
 * `presionado` lo vuelve un alternador (aria-pressed → pill negra). Acepta ser hijo de un Trigger con asChild.
 */
export function BotonRedondo({
  etiqueta,
  lado = "right",
  presionado,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "variant" | "size"> & {
  etiqueta: string;
  lado?: "right" | "top" | "bottom" | "left";
  presionado?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="vidrio" size="redondo" aria-label={etiqueta} aria-pressed={presionado} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={lado} sideOffset={8}>
        {etiqueta}
      </TooltipContent>
    </Tooltip>
  );
}
