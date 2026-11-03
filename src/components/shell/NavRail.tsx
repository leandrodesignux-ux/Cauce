"use client";

import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { usePaleta } from "@/components/CommandPalette";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMedia } from "@/hooks/useMedia";
import { useInterfaz } from "@/lib/stores";
import { Marca } from "./Marca";
import { SelloDemo } from "./SelloDemo";
import { SwitchTema } from "./SwitchTema";
import { TeclaAtajo } from "./TeclaAtajo";
import { VISTAS, vistaActiva } from "./vistas";

/**
 * Navegación lateral fija. Tablet (768–1279 px): siempre en íconos.
 * Escritorio (≥1280 px): 200 px, colapsable a íconos.
 */
export function NavRail() {
  const pathname = usePathname();
  const compacta = useInterfaz((s) => s.navCompacta || s.panelAbierto);
  const alternar = useInterfaz((s) => s.alternarNav);
  // Con el panel abierto la nav queda compacta a la fuerza: no se ofrece expandirla.
  const panelAbierto = useInterfaz((s) => s.panelAbierto);
  const abrirPaleta = usePaleta((s) => s.abrir);
  const escritorio = useMedia("(min-width: 1280px)", true);
  // Tooltips solo cuando la nav está en íconos (tablet siempre, escritorio si está compacta).
  const enIconos = compacta || !escritorio;

  // Clases que solo se aplican cuando la nav muestra etiquetas (escritorio y no compacta).
  const conEtiqueta = compacta ? "hidden" : "hidden xl:inline";

  return (
    <nav
      aria-label="Principal"
      className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-linea md:flex motion-safe:transition-[width] motion-safe:duration-(--duracion-rapida) ${
        compacta ? "w-(--ancho-nav-compacta)" : "w-(--ancho-nav-compacta) xl:w-(--ancho-nav)"
      }`}
    >
      <div className="flex h-16 items-center px-5">
        <Link href="/" aria-label="Cauce, inicio" className="rounded-control">
          <span className={compacta ? "" : "xl:hidden"}>
            <Marca compacta />
          </span>
          <span className={conEtiqueta}>
            <Marca />
          </span>
        </Link>
      </div>

      <div className="px-3 pb-3">
        <ConTooltip activo={enIconos} texto="Buscar o saltar a…">
          <button
            type="button"
            onClick={abrirPaleta}
            aria-label="Buscar o saltar a…"
            className="flex h-9 w-full items-center gap-2 rounded-control border border-linea px-2.5 text-sm text-tinta-2 hover:border-linea-fuerte hover:text-tinta"
          >
            <Search className="size-4 shrink-0" aria-hidden />
            <span className={`${conEtiqueta} flex-1 text-left`}>Buscar</span>
            <span className={conEtiqueta}>
              <TeclaAtajo />
            </span>
          </button>
        </ConTooltip>
      </div>

      <ul className="flex flex-col gap-0.5 px-3">
        {VISTAS.map(({ href, nombre, Icono }) => {
          const activa = vistaActiva(pathname, href);
          return (
            <li key={href}>
              <ConTooltip activo={enIconos} texto={nombre}>
                <Link
                  href={href}
                  aria-current={activa ? "page" : undefined}
                  aria-label={nombre}
                  className={`relative flex h-9 items-center gap-3 rounded-control px-2.5 text-sm font-medium ${
                    activa ? "bg-azul-suave text-azul-texto" : "text-tinta-2 hover:bg-tarjeta hover:text-tinta"
                  }`}
                >
                  <Icono className="size-[18px] shrink-0" aria-hidden />
                  <span className={conEtiqueta}>{nombre}</span>
                </Link>
              </ConTooltip>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col gap-3 p-3">
        {/* Colapsar y tema comparten fila; en íconos se apilan. El sello va solo, debajo. */}
        <div className={`flex items-center gap-1 ${compacta ? "flex-col" : "max-xl:flex-col"}`}>
          <ConTooltip activo={enIconos} texto={compacta ? "Expandir navegación" : "Colapsar navegación"}>
            <button
              type="button"
              onClick={alternar}
              aria-label={compacta ? "Expandir navegación" : "Colapsar navegación"}
              className={`hidden h-9 flex-1 items-center gap-3 rounded-control px-2.5 text-sm text-tinta-2 hover:bg-tarjeta hover:text-tinta ${panelAbierto ? "" : "xl:flex"}`}
            >
              {compacta ? <PanelLeftOpen className="size-[18px] shrink-0" aria-hidden /> : <PanelLeftClose className="size-[18px] shrink-0" aria-hidden />}
              <span className={conEtiqueta}>Colapsar</span>
            </button>
          </ConTooltip>
          <SwitchTema />
        </div>
        <SelloDemo compacto={compacta} />
      </div>
    </nav>
  );
}

/** Tooltip a la derecha del ítem, solo cuando la etiqueta no se ve. */
function ConTooltip({ activo, texto, children }: { activo: boolean; texto: string; children: ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Tooltip open={activo && abierto} onOpenChange={setAbierto}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {texto}
      </TooltipContent>
    </Tooltip>
  );
}
