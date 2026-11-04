"use client";

import { ArrowRightLeft, CircleHelp, Search, SlidersHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePaleta } from "@/components/CommandPalette";
import { useOnboarding } from "@/components/onboarding/Onboarding";
import { HojaFiltros } from "@/components/filtros/FilterBar";
import { useAccionesCauce } from "./acciones";
import { BotonRedondo } from "./BotonRedondo";
import { SwitchTema } from "./SwitchTema";

/** Móvil (<768 px): barra flotante compacta y centrada (material denso) con buscar, filtros y comparar (en el home), cómo funciona y tema. */
export function BarraMovil() {
  const pathname = usePathname();
  const abrirPaleta = usePaleta((s) => s.abrir);
  const abrirOnboarding = useOnboarding((s) => s.abrir);
  return (
    <nav
      aria-label="Acciones rápidas"
      className="vidrio-denso fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex h-(--alto-barra-movil) -translate-x-1/2 items-center gap-2 rounded-full p-1.5 shadow-flotante md:hidden"
    >
      <BotonRedondo etiqueta="Buscar o saltar a…" lado="top" superficie="cromo" onClick={abrirPaleta}>
        <Search aria-hidden />
      </BotonRedondo>
      {pathname === "/" && <AccionesHome />}
      <BotonRedondo etiqueta="Cómo funciona" lado="top" superficie="cromo" onClick={abrirOnboarding}>
        <CircleHelp aria-hidden />
      </BotonRedondo>
      <SwitchTema superficie="cromo" />
    </nav>
  );
}

function AccionesHome() {
  const { comparar, alternarComparar } = useAccionesCauce();
  return (
    <>
      <HojaFiltros
        disparador={
          <BotonRedondo etiqueta="Filtros" lado="top" superficie="cromo">
            <SlidersHorizontal aria-hidden />
          </BotonRedondo>
        }
      />
      <BotonRedondo etiqueta="Comparar con período anterior" lado="top" superficie="cromo" presionado={comparar} onClick={alternarComparar}>
        <ArrowRightLeft aria-hidden />
      </BotonRedondo>
    </>
  );
}
