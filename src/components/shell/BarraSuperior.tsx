"use client";

import { usePathname } from "next/navigation";
import { ChipsFiltros } from "@/components/filtros/FilterBar";
import { NavVistas } from "./NavVistas";

/** Nav de vistas en pill y, en el home, los filtros como chips a la derecha. En móvil la nav va fija aparte (AppShell) y quedan los chips, con scroll horizontal. */
export function BarraSuperior() {
  const pathname = usePathname();
  return (
    <div className={`mb-5 flex-wrap items-center gap-3 md:flex md:gap-6 ${pathname === "/" ? "flex" : "hidden"}`}>
      <NavVistas className="hidden md:block" />
      {pathname === "/" && (
        <ChipsFiltros className="-mx-4 flex w-[calc(100%+2rem)] snap-x scroll-px-4 gap-2 overflow-x-auto overscroll-x-contain px-4 pb-0.5 [scrollbar-width:none] *:snap-start md:mx-0 md:ml-auto md:w-auto md:flex-wrap md:justify-end md:overflow-visible md:p-0" />
      )}
    </div>
  );
}
