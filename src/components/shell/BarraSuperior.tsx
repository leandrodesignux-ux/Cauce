"use client";

import { usePathname } from "next/navigation";
import { ChipsFiltros } from "@/components/filtros/FilterBar";
import { ControlDemo } from "./ControlDemo";

/**
 * Arriba del contenido: el control del modo demo en vivo (en móvil, solo cuando está activo; se activa desde la
 * barra flotante) y, en el home, los filtros como chips (a la derecha en escritorio; en móvil, con scroll horizontal).
 * La nav de vistas va debajo del título de cada vista (EncabezadoVista).
 */
export function BarraSuperior() {
  const pathname = usePathname();
  const home = pathname === "/";
  return (
    <div className="mb-5 flex flex-col gap-3 empty:hidden md:flex-row md:items-center md:justify-between">
      <ControlDemo className="hidden md:inline-flex" />
      <ControlDemo soloActivo className="self-start md:hidden" />
      {home && (
        <ChipsFiltros className="-mx-4 flex w-[calc(100%+2rem)] snap-x scroll-px-4 gap-2 overflow-x-auto overscroll-x-contain px-4 pb-0.5 [scrollbar-width:none] *:snap-start md:mx-0 md:ml-auto md:w-auto md:flex-wrap md:justify-end md:overflow-visible md:p-0" />
      )}
    </div>
  );
}
