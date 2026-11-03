"use client";

import { ArrowRightLeft, Search, SlidersHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePaleta } from "@/components/CommandPalette";
import { HojaFiltros } from "@/components/filtros/FilterBar";
import { useAccionesCauce } from "./acciones";
import { BotonRedondo } from "./BotonRedondo";
import { SwitchTema } from "./SwitchTema";

/** Móvil (<768 px): barra flotante vidriada con buscar, filtros, comparar (en el home) y tema. */
export function BarraMovil() {
  const pathname = usePathname();
  const abrirPaleta = usePaleta((s) => s.abrir);
  return (
    <nav
      aria-label="Acciones rápidas"
      className="vidrio fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 flex h-(--alto-barra-movil) items-center justify-between rounded-full p-2 shadow-tarjeta md:hidden"
    >
      <BotonRedondo etiqueta="Buscar o saltar a…" lado="top" onClick={abrirPaleta}>
        <Search aria-hidden />
      </BotonRedondo>
      {pathname === "/" && <AccionesHome />}
      <SwitchTema />
    </nav>
  );
}

function AccionesHome() {
  const { comparar, alternarComparar } = useAccionesCauce();
  return (
    <>
      <HojaFiltros
        disparador={
          <BotonRedondo etiqueta="Filtros" lado="top">
            <SlidersHorizontal aria-hidden />
          </BotonRedondo>
        }
      />
      <BotonRedondo etiqueta="Comparar con período anterior" lado="top" presionado={comparar} onClick={alternarComparar}>
        <ArrowRightLeft aria-hidden />
      </BotonRedondo>
    </>
  );
}
