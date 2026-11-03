"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { COLOR } from "@/config/colores";
import { useMontado } from "@/hooks/useMontado";
import { cn } from "@/lib/utils";

/** Switch claro/oscuro. La elección persiste (next-themes la guarda en localStorage). */
export function SwitchTema({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const montado = useMontado();
  const oscuro = montado && resolvedTheme === "dark";
  const etiqueta = oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-lg"
      aria-label={etiqueta}
      title={etiqueta}
      onClick={() => setTheme(oscuro ? "light" : "dark")}
      className={cn("text-niebla hover:text-tinta", className)}
    >
      {oscuro ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
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
