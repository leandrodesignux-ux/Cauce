"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { COLOR } from "@/config/colores";
import { useMontado } from "@/hooks/useMontado";
import { BotonRedondo } from "./BotonRedondo";

function useTema() {
  const { resolvedTheme, setTheme } = useTheme();
  const montado = useMontado();
  return { oscuro: montado && resolvedTheme === "dark", setTheme };
}

/** Rail: el par luna/sol. El modo vigente queda en pill negra (blanca en oscuro). La elección persiste. */
export function ParTema() {
  const { oscuro, setTheme } = useTema();
  return (
    <div role="group" aria-label="Tema" className="flex flex-col gap-3">
      <BotonRedondo etiqueta="Modo oscuro" presionado={oscuro} onClick={() => setTheme("dark")}>
        <Moon aria-hidden />
      </BotonRedondo>
      <BotonRedondo etiqueta="Modo claro" presionado={!oscuro} onClick={() => setTheme("light")}>
        <Sun aria-hidden />
      </BotonRedondo>
    </div>
  );
}

/** Barra móvil: un solo botón que alterna el tema. */
export function SwitchTema({ lado = "top" }: { lado?: "top" | "right" | "bottom" }) {
  const { oscuro, setTheme } = useTema();
  return (
    <BotonRedondo etiqueta={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"} lado={lado} onClick={() => setTheme(oscuro ? "light" : "dark")}>
      {oscuro ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </BotonRedondo>
  );
}

/** Mantiene el color de la barra del navegador (theme-color) en sintonía con el tema elegido. */
export function ColorDeBarra() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    meta?.setAttribute("content", resolvedTheme === "dark" ? COLOR.fondoOscuro : COLOR.fondoB);
  }, [resolvedTheme]);
  return null;
}
