"use client";

import {
  Building2,
  CalendarDays,
  ChevronRight,
  FileCheck2,
  Globe,
  LayoutGrid,
  MessageCircle,
  ShieldCheck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { ETAPAS, FASES, ORDEN_ETAPAS } from "@/config/etapas";
import { formatearEntero, formatearPuntos } from "@/lib/formato";
import type { EtapaJourney, Journey } from "@/lib/journey";
import type { EtapaId } from "@/lib/tipos";

const ICONO: Record<EtapaId, LucideIcon> = {
  descubrimiento: Globe,
  exploracion: LayoutGrid,
  evaluacion: Building2,
  contacto: MessageCircle,
  calificacion: ShieldCheck,
  asignacion: UserCheck,
  visita: CalendarDays,
  cierre: FileCheck2,
};

export const NOMBRE_ETAPA: Record<EtapaId, string> = Object.fromEntries(ETAPAS.map((e) => [e.id, e.nombre])) as Record<EtapaId, string>;
const ULTIMA = ORDEN_ETAPAS[ORDEN_ETAPAS.length - 1];

/**
 * Recorrido: las 8 etapas como un stepper de tarjetas agrupadas por fase (Atraer, Convertir, Cerrar), con un
 * chevron entre tarjetas. Escritorio: una fila; tablet: dos filas; móvil: lista vertical.
 * Cada tarjeta abre el panel de su etapa; `resaltada` la marca cuando un experimento que la ataca tiene hover o foco.
 */
export function JourneyBoard({
  journey,
  comparar,
  resaltada,
  onAbrirEtapa,
}: {
  journey: Journey;
  comparar: boolean;
  resaltada: EtapaId | null;
  onAbrirEtapa: (id: EtapaId) => void;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-x-3 xl:grid-cols-[3fr_3fr_2fr]">
      {FASES.map((fase, f) => (
        <section key={fase.id} aria-labelledby={`fase-${fase.id}`} className="flex min-w-0 flex-col gap-3">
          <p id={`fase-${fase.id}`} className="px-1 font-medium md:pl-7">
            {fase.nombre}
            <small className="block text-xs font-normal text-tinta-2">{fase.descripcion}</small>
          </p>
          <ol className="flex flex-col gap-1.5 md:flex-row md:items-stretch">
            {fase.etapas.map((id, i) => (
              <li key={id} className="flex min-w-0 flex-col items-stretch gap-1.5 md:flex-1 md:flex-row md:items-center">
                {(f > 0 || i > 0) && <Chevron />}
                <TarjetaEtapa
                  etapa={journey.etapas.find((e) => e.id === id)!}
                  comparar={comparar}
                  resaltada={resaltada === id}
                  onAbrir={() => onAbrirEtapa(id)}
                />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** Chevron entre tarjetas: hacia abajo en la lista móvil, hacia la derecha desde tablet. */
function Chevron() {
  return (
    <span aria-hidden className="grid h-5 place-items-center text-tenue md:h-auto md:w-4 md:flex-none">
      <ChevronRight className="size-4 rotate-90 md:rotate-0" strokeWidth={2} />
    </span>
  );
}

function textoTasa(etapa: EtapaJourney): string {
  if (etapa.tasa === null) return "—";
  const pct = etapa.tasa * 100;
  // Cierre sobre el total queda por debajo del 1 %: dos decimales para que no se lea "0.0 %".
  return `${pct.toLocaleString("es-MX", { minimumFractionDigits: pct < 1 ? 2 : 1, maximumFractionDigits: pct < 1 ? 2 : 1 })} %`;
}

function Delta({ pp }: { pp: number | null }) {
  if (pp === null) return null;
  if (Math.abs(pp) < 0.05) return <span className="block text-xs text-tinta-2">Sin cambio vs. período anterior</span>;
  const sube = pp > 0;
  return (
    <span className={`block text-xs ${sube ? "text-azul-texto" : "text-coral-texto"}`}>
      <span aria-hidden>{sube ? "↑" : "↓"} </span>
      <span className="sr-only">{sube ? "Sube " : "Baja "}</span>
      {formatearPuntos(Math.abs(pp)).replace("+", "")}
    </span>
  );
}

function TarjetaEtapa({
  etapa,
  comparar,
  resaltada,
  onAbrir,
}: {
  etapa: EtapaJourney;
  comparar: boolean;
  resaltada: boolean;
  onAbrir: () => void;
}) {
  const Icono = ICONO[etapa.id];
  const esCierre = etapa.id === ULTIMA;
  const tasa = `${textoTasa(etapa)} ${esCierre ? "del total" : "avanza"}`;
  return (
    <button
      type="button"
      data-etapa={etapa.id}
      data-resalta={resaltada}
      onClick={onAbrir}
      aria-label={`${NOMBRE_ETAPA[etapa.id]}: ${formatearEntero(etapa.volumen)}. ${tasa}. Ver el detalle de la etapa.`}
      className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-tile border border-tarjeta-borde bg-tarjeta p-3 text-left shadow-tarjeta motion-safe:transition-[background-color,border-color,transform] motion-safe:duration-(--duracion-presion) motion-safe:ease-salida motion-safe:active:scale-[0.98] hover:bg-azul-suave data-[resalta=true]:border-azul data-[resalta=true]:bg-azul-suave md:flex md:flex-col md:items-start md:self-stretch"
    >
      <span aria-hidden className="grid size-10 place-items-center rounded-full bg-azul-suave text-azul-texto md:size-9">
        <Icono className="size-[18px]" strokeWidth={1.7} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs text-tinta-2">{NOMBRE_ETAPA[etapa.id]}</span>
        <span className="cifra block text-lg font-semibold">{formatearEntero(etapa.volumen)}</span>
        {comparar && <span className="cifra block text-xs text-tinta-2">Antes: {formatearEntero(etapa.anterior)}</span>}
      </span>
      <span className="text-right md:mt-auto md:text-left">
        <span className="cifra block text-sm font-semibold whitespace-nowrap">{tasa}</span>
        <Delta pp={etapa.deltaPp} />
      </span>
    </button>
  );
}
