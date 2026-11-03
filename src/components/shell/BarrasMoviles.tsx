"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePaleta } from "@/components/CommandPalette";
import { Marca } from "./Marca";
import { SwitchTema } from "./SwitchTema";
import { VISTAS, vistaActiva } from "./vistas";

/** Móvil (<768 px): barra superior con marca y búsqueda. */
export function BarraSuperiorMovil() {
  const abrirPaleta = usePaleta((s) => s.abrir);
  return (
    <header className="sticky top-0 z-20 flex h-(--alto-barra-movil) items-center justify-between border-b border-linea bg-concreto px-4 md:hidden">
      <Link href="/" aria-label="Cauce, inicio" className="rounded-control">
        <Marca />
      </Link>
      <div className="flex items-center gap-2">
        <span className="rounded-control border border-dashed border-linea-fuerte px-2 py-0.5 text-xs text-niebla">Datos demo</span>
        <SwitchTema lado="bottom" />
        <button
          type="button"
          onClick={abrirPaleta}
          aria-label="Buscar o saltar a…"
          className="grid size-10 place-items-center rounded-control text-niebla hover:text-tinta"
        >
          <Search className="size-5" aria-hidden />
        </button>
      </div>
    </header>
  );
}

/** Móvil (<768 px): las tres vistas como barra inferior. */
export function BarraInferiorMovil() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-linea bg-papel pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid h-(--alto-barra-movil) grid-cols-3">
        {VISTAS.map(({ href, nombre, Icono }) => {
          const activa = vistaActiva(pathname, href);
          return (
            <li key={href} className="flex">
              <Link
                href={href}
                aria-current={activa ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  activa ? "text-cauce-texto" : "text-niebla"
                }`}
              >
                <Icono className="size-5" aria-hidden />
                {nombre}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
