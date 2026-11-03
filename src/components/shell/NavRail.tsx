"use client";

import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePaleta } from "@/components/CommandPalette";
import { useInterfaz } from "@/lib/stores";
import { Marca } from "./Marca";
import { SelloDemo } from "./SelloDemo";
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
  const abrirPaleta = usePaleta((s) => s.abrir);

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
        <button
          type="button"
          onClick={abrirPaleta}
          aria-label="Buscar o saltar a…"
          title="Buscar o saltar a…"
          className="flex h-9 w-full items-center gap-2 rounded-control border border-linea px-2.5 text-sm text-niebla hover:border-linea-fuerte hover:text-tinta"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className={`${conEtiqueta} flex-1 text-left`}>Buscar</span>
          <span className={conEtiqueta}>
            <TeclaAtajo />
          </span>
        </button>
      </div>

      <ul className="flex flex-col gap-0.5 px-3">
        {VISTAS.map(({ href, nombre, Icono }) => {
          const activa = vistaActiva(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={activa ? "page" : undefined}
                aria-label={nombre}
                title={nombre}
                className={`relative flex h-9 items-center gap-3 rounded-control px-2.5 text-sm font-medium ${
                  activa ? "bg-cauce-suave text-cauce" : "text-niebla hover:bg-papel hover:text-tinta"
                }`}
              >
                <Icono className="size-[18px] shrink-0" aria-hidden />
                <span className={conEtiqueta}>{nombre}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto flex flex-col gap-3 p-3">
        <button
          type="button"
          onClick={alternar}
          aria-label={compacta ? "Expandir navegación" : "Colapsar navegación"}
          title={compacta ? "Expandir navegación" : "Colapsar navegación"}
          className="hidden h-9 items-center gap-3 rounded-control px-2.5 text-sm text-niebla hover:bg-papel hover:text-tinta xl:flex"
        >
          {compacta ? <PanelLeftOpen className="size-[18px] shrink-0" aria-hidden /> : <PanelLeftClose className="size-[18px] shrink-0" aria-hidden />}
          <span className={conEtiqueta}>Colapsar</span>
        </button>
        <SelloDemo compacto={compacta} />
      </div>
    </nav>
  );
}
