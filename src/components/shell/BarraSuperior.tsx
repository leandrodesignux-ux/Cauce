"use client";

import { usePathname } from "next/navigation";
import { ChipsFiltros } from "@/components/filtros/FilterBar";

/** En el home, los filtros como chips (a la derecha en escritorio; en móvil, con scroll horizontal). La nav de vistas va debajo del título de cada vista (EncabezadoVista). */
export function BarraSuperior() {
  const pathname = usePathname();
  if (pathname !== "/") return null;
  return (
    <div className="mb-5 flex items-center md:justify-end">
      <ChipsFiltros className="-mx-4 flex w-[calc(100%+2rem)] snap-x scroll-px-4 gap-2 overflow-x-auto overscroll-x-contain px-4 pb-0.5 [scrollbar-width:none] *:snap-start md:mx-0 md:w-auto md:flex-wrap md:justify-end md:overflow-visible md:p-0" />
    </div>
  );
}
