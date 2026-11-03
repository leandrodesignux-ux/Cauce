"use client";

import { usePathname } from "next/navigation";
import { ChipsFiltros } from "@/components/filtros/FilterBar";
import { NavVistas } from "./NavVistas";

/** Nav de vistas en pill y, en el home, los filtros como chips a la derecha (con scroll horizontal en móvil). */
export function BarraSuperior() {
  const pathname = usePathname();
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 md:gap-6">
      <NavVistas className="w-full md:w-auto" />
      {pathname === "/" && (
        <ChipsFiltros className="-mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-0.5 md:mx-0 md:ml-auto md:w-auto md:flex-wrap md:justify-end md:overflow-visible md:p-0" />
      )}
    </div>
  );
}
