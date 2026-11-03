"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { COLOR } from "@/config/colores";
import { useMontado } from "@/hooks/useMontado";

/** Switch claro/oscuro. La elección persiste (next-themes la guarda en localStorage). */
export function SwitchTema({ className, lado = "right" }: { className?: string; lado?: "right" | "bottom" }) {
  const { resolvedTheme, setTheme } = useTheme();
  const montado = useMontado();
  const oscuro = montado && resolvedTheme === "dark";
  const etiqueta = oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="sutil"
          size="icon-lg"
          aria-label={etiqueta}
          onClick={() => setTheme(oscuro ? "light" : "dark")}
          className={className}
        >
          {oscuro ? <Sun aria-hidden /> : <Moon aria-hidden />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={lado} sideOffset={8}>
        {etiqueta}
      </TooltipContent>
    </Tooltip>
  );
}

/** Mantiene el color de la barra del navegador (theme-color) en sintonía con el tema elegido. */
export function ColorDeBarra() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    meta?.setAttribute("content", resolvedTheme === "dark" ? COLOR.concretoOscuro : COLOR.concreto);
  }, [resolvedTheme]);
  return null;
}
