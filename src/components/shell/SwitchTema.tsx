"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { COLOR } from "@/config/colores";
import { useMontado } from "@/hooks/useMontado";
import { BotonRedondo } from "./BotonRedondo";

/**
 * Cambia el tema con un fundido corto (View Transitions) en vez de un salto de brillo.
 * La clase se aplica dentro de la transición para que el navegador capture los dos estados;
 * next-themes la vuelve a poner igual y guarda la elección. Sin soporte o con reduced motion, cambia directo.
 */
function useTema() {
  const { resolvedTheme, setTheme } = useTheme();
  const montado = useMontado();
  const cambiar = (tema: "light" | "dark") => {
    const aplicar = () => {
      document.documentElement.classList.toggle("dark", tema === "dark");
      document.documentElement.style.colorScheme = tema;
      setTheme(tema);
    };
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return aplicar();
    document.startViewTransition(aplicar);
  };
  return { oscuro: montado && resolvedTheme === "dark", cambiar };
}

/** Rail: el par luna/sol. El modo vigente queda en color activo (índigo; lavanda en oscuro). La elección persiste. */
export function ParTema() {
  const { oscuro, cambiar } = useTema();
  return (
    <div role="group" aria-label="Tema" className="flex flex-col gap-3">
      <BotonRedondo etiqueta="Modo oscuro" presionado={oscuro} onClick={() => cambiar("dark")}>
        <Moon aria-hidden />
      </BotonRedondo>
      <BotonRedondo etiqueta="Modo claro" presionado={!oscuro} onClick={() => cambiar("light")}>
        <Sun aria-hidden />
      </BotonRedondo>
    </div>
  );
}

/** Barra móvil: un solo botón que alterna el tema. */
export function SwitchTema({ lado = "top", superficie = "vidrio" }: { lado?: "top" | "right" | "bottom"; superficie?: "vidrio" | "cromo" }) {
  const { oscuro, cambiar } = useTema();
  return (
    <BotonRedondo
      etiqueta={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      lado={lado}
      superficie={superficie}
      onClick={() => cambiar(oscuro ? "light" : "dark")}
    >
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
