"use client";

import { ArrowRightLeft, CircleHelp, Search, SlidersHorizontal, Table2, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePaleta } from "@/components/CommandPalette";
import { useOnboarding } from "@/components/onboarding/Onboarding";
import { PanelFiltros } from "@/components/filtros/FilterBar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAccionesCauce } from "./acciones";
import { BotonRedondo } from "./BotonRedondo";
import { Isotipo } from "./Marca";
import { ParTema } from "./SwitchTema";

/**
 * Escritorio y tablet (≥768 px): rail fijo de botones circulares. Buscar siempre; filtros, comparar,
 * tabla y exportar solo en el home, donde aplican. Abajo, el par luna/sol y el sello de datos demo.
 */
export function Rail() {
  const pathname = usePathname();
  const abrirPaleta = usePaleta((s) => s.abrir);
  const abrirOnboarding = useOnboarding((s) => s.abrir);

  return (
    <aside aria-label="Acciones" className="sticky top-0 hidden h-dvh flex-col items-center gap-3 py-6 md:flex">
      <Link href="/" aria-label="Cauce, inicio" className="mb-3 grid size-12 place-items-center rounded-full">
        <Isotipo className="size-[30px]" />
      </Link>
      <BotonRedondo etiqueta="Buscar o saltar a… (Ctrl K)" aria-keyshortcuts="Control+K Meta+K" onClick={abrirPaleta}>
        <Search aria-hidden />
      </BotonRedondo>
      {pathname === "/" && <AccionesHome />}
      <div className="mt-auto flex flex-col items-center gap-3">
        <BotonRedondo etiqueta="Cómo funciona" onClick={abrirOnboarding}>
          <CircleHelp aria-hidden />
        </BotonRedondo>
        <ParTema />
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="cifra rounded-full border border-dashed border-tenue px-2 py-0.5 text-xs text-tinta-2">
              Demo
            </span>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Prototipo con datos demo
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}

function AccionesHome() {
  const { comparar, tabla, alternarComparar, alternarTabla, exportar } = useAccionesCauce();
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <BotonRedondo etiqueta="Filtros">
            <SlidersHorizontal aria-hidden />
          </BotonRedondo>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" sideOffset={12} className="max-h-[80dvh] w-96 overflow-y-auto p-5">
          <PanelFiltros />
        </PopoverContent>
      </Popover>
      <BotonRedondo etiqueta="Comparar con período anterior" presionado={comparar} onClick={alternarComparar}>
        <ArrowRightLeft aria-hidden />
      </BotonRedondo>
      <BotonRedondo etiqueta="Ver como tabla" presionado={tabla} onClick={alternarTabla}>
        <Table2 aria-hidden />
      </BotonRedondo>
      <BotonRedondo etiqueta="Exportar CSV" onClick={exportar}>
        <Upload aria-hidden />
      </BotonRedondo>
    </>
  );
}
