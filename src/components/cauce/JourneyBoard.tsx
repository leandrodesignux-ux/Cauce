"use client";

import {
  Building2,
  CalendarDays,
  ChevronDown,
  FileCheck2,
  Globe,
  LayoutGrid,
  MessageCircle,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ETAPAS, FASES, ORDEN_ETAPAS } from "@/config/etapas";
import { useTween } from "@/hooks/useTween";
import { formatearEntero, formatearPuntos } from "@/lib/formato";
import { type EtapaJourney, type Journey, volumenDeJourney } from "@/lib/journey";
import { avanceDeEtapa, tasaDeFase } from "@/lib/selectors";
import type { EtapaId } from "@/lib/tipos";
import { type OnResaltar, type Resaltado, propsResaltar } from "./resaltado";

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
const siguienteDe = (id: EtapaId): EtapaId | undefined => ORDEN_ETAPAS[ORDEN_ETAPAS.indexOf(id) + 1];

function porcentaje(tasa: number | null): string {
  if (tasa === null) return "—";
  const pct = tasa * 100;
  // Cierre sobre el total queda por debajo del 1 %: dos decimales para que no se lea "0.0 %".
  const d = pct < 1 ? 2 : 1;
  return `${pct.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d })} %`;
}

/**
 * Recorrido: tres fases (Atraer, Convertir, Cerrar) en columnas desde lg, con sus etapas apiladas.
 * Cada fase dice qué porcentaje pasa a la siguiente; cada etapa, su volumen y cuánto avanza.
 * Hover o foco en una etapa o en el encabezado de una fase fijan el resaltado compartido de la vista.
 */
export function JourneyBoard({
  journey,
  comparar,
  resaltado,
  onResaltar,
  onAbrirEtapa,
  onSimular,
}: {
  journey: Journey;
  comparar: boolean;
  resaltado: Resaltado;
  onResaltar: OnResaltar;
  onAbrirEtapa: (id: EtapaId) => void;
  onSimular: (desde: EtapaId) => void;
}) {
  const reducir = useReducedMotion() ?? false;
  const volumen = useMemo(() => volumenDeJourney(journey), [journey]);
  const objetivo = useMemo(() => journey.etapas.map((e) => e.volumen), [journey]);
  const animado = useTween(objetivo, 300, reducir);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {FASES.map((fase, f) => {
        const siguiente = FASES[f + 1];
        const tasa = tasaDeFase(volumen, FASES, f);
        const metrica = siguiente ? `pasa a ${siguiente.nombre}` : `llega a ${NOMBRE_ETAPA[ULTIMA]}`;
        return (
          <section
            key={fase.id}
            aria-labelledby={`fase-${fase.id}`}
            className="flex min-w-0 flex-col gap-4 rounded-tarjeta border border-tarjeta-borde bg-tarjeta/60 p-5"
          >
            <div
              tabIndex={0}
              aria-label={`${fase.nombre}: ${fase.descripcion}. ${porcentaje(tasa)} ${metrica}.`}
              {...propsResaltar(onResaltar, { etapas: [...fase.etapas], origen: "fase" })}
              className="-m-1.5 flex items-start justify-between gap-3 rounded-control p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-activo"
            >
              <div className="min-w-0">
                <span aria-hidden className="cifra block text-xs text-tinta-2">
                  {String(f + 1).padStart(2, "0")}
                </span>
                <h3 id={`fase-${fase.id}`} className="font-heading text-lg font-semibold">
                  {fase.nombre}
                </h3>
                <p className="text-sm text-tinta-2">{fase.descripcion}</p>
              </div>
              <p aria-hidden className="shrink-0 text-right">
                <span className="cifra block text-lg font-semibold">{porcentaje(tasa)}</span>
                <span className="block text-xs text-tinta-2">{metrica}</span>
              </p>
            </div>
            <ol className="flex flex-col">
              {fase.etapas.map((id, i) => {
                const indice = ORDEN_ETAPAS.indexOf(id);
                return (
                  <li key={id} className="flex flex-col">
                    {i > 0 && (
                      <span aria-hidden className="grid h-6 place-items-center text-tinta-2">
                        <ChevronDown className="size-4" strokeWidth={2} />
                      </span>
                    )}
                    <TarjetaEtapa
                      etapa={journey.etapas[indice]}
                      volumenAnimado={animado[indice] ?? journey.etapas[indice].volumen}
                      avance={avanceDeEtapa(volumen, id)}
                      comparar={comparar}
                      resaltado={resaltado}
                      onResaltar={onResaltar}
                      onAbrir={() => onAbrirEtapa(id)}
                      onSimular={() => onSimular(id)}
                    />
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function Delta({ pp }: { pp: number | null }) {
  if (pp === null) return null;
  if (Math.abs(pp) < 0.05) return <span className="text-tinta-2">sin cambio</span>;
  const sube = pp > 0;
  return (
    <span className={sube ? "text-azul-texto" : "text-coral-texto"}>
      <span aria-hidden>{sube ? "↑" : "↓"} </span>
      <span className="sr-only">{sube ? "sube " : "baja "}</span>
      {formatearPuntos(Math.abs(pp)).replace("+", "")}
    </span>
  );
}

function TarjetaEtapa({
  etapa,
  volumenAnimado,
  avance,
  comparar,
  resaltado,
  onResaltar,
  onAbrir,
  onSimular,
}: {
  etapa: EtapaJourney;
  volumenAnimado: number;
  avance: { avanzan: number; seQuedan: number } | null;
  comparar: boolean;
  resaltado: Resaltado;
  onResaltar: OnResaltar;
  onAbrir: () => void;
  onSimular: () => void;
}) {
  const Icono = ICONO[etapa.id];
  const esCierre = etapa.id === ULTIMA;
  const siguiente = siguienteDe(etapa.id);
  const tasa = `${porcentaje(etapa.tasa)} ${esCierre ? "del total" : "avanza"}`;
  const de = resaltado?.etapas ?? [];
  const activa = resaltado?.origen === "etapa" && de[0] === etapa.id;
  const esSiguiente = resaltado?.origen === "etapa" && de[1] === etapa.id;
  const fuga = resaltado?.origen === "fuga" && de.includes(etapa.id);
  const marcada = (resaltado?.origen === "fase" || resaltado?.origen === "experimento") && de.includes(etapa.id);
  const total = avance ? avance.avanzan + avance.seQuedan : 0;
  const relleno = activa && avance ? (total > 0 ? avance.avanzan / total : 0) : Math.min(1, Math.max(0, etapa.tasa ?? 0));

  return (
    <div
      data-tarjeta-etapa={etapa.id}
      data-activa={activa}
      data-siguiente={esSiguiente}
      data-fuga={fuga}
      data-marcada={marcada}
      {...propsResaltar(onResaltar, { etapas: siguiente ? [etapa.id, siguiente] : [etapa.id], origen: "etapa" })}
      className="tarjeta-clicable relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 rounded-tile border border-tarjeta-borde bg-tarjeta p-4 shadow-tarjeta data-[activa=true]:border-azul data-[activa=true]:shadow-flotante data-[fuga=true]:border-dashed data-[fuga=true]:border-coral data-[marcada=true]:border-azul data-[marcada=true]:bg-azul-suave data-[siguiente=true]:border-azul/50 motion-safe:data-[activa=true]:-translate-y-0.5"
    >
      <span aria-hidden className="grid size-10 place-items-center rounded-full bg-azul-suave text-azul-texto">
        <Icono className="size-[18px]" strokeWidth={1.7} />
      </span>
      <div className="min-w-0">
        {/* El botón cubre toda la tarjeta (after:inset-0); el de simular queda por encima. */}
        <button
          type="button"
          data-etapa={etapa.id}
          onClick={onAbrir}
          aria-label={`${NOMBRE_ETAPA[etapa.id]}: ${formatearEntero(etapa.volumen)}. ${tasa}.${avance ? ` Avanzan ${formatearEntero(avance.avanzan)}, se quedan ${formatearEntero(avance.seQuedan)}.` : ""} Ver el detalle de la etapa.`}
          className="block max-w-full truncate text-left text-sm font-medium text-tinta-cuerpo outline-none after:absolute after:inset-0 after:rounded-tile"
        >
          {NOMBRE_ETAPA[etapa.id]}
        </button>
        <p aria-hidden className="cifra text-2xl font-semibold">
          {formatearEntero(Math.round(volumenAnimado))}
        </p>
        {comparar && (
          <p aria-hidden className="cifra mt-1 text-xs text-tinta-2">
            Antes: {formatearEntero(etapa.anterior)}
          </p>
        )}
      </div>
      {esCierre ? (
        <span />
      ) : (
        <Button
          variant="sutil"
          size="icon-sm"
          onClick={onSimular}
          aria-label={`Simular mejora de ${NOMBRE_ETAPA[etapa.id]} a ${NOMBRE_ETAPA[siguiente!]}`}
          title="Simular mejora"
          className="relative z-10 -mt-1 -mr-1"
        >
          <SlidersHorizontal />
        </Button>
      )}

      <div aria-hidden className="col-span-3 flex flex-col gap-2">
        {/* Barra de avance: relleno azul = tasa. Con la etapa activa, el resto se vuelve coral (los que se quedan). */}
        <span
          className={`relative block h-1 overflow-hidden rounded-full motion-safe:transition-colors motion-safe:duration-(--duracion-media) ${activa && avance ? "bg-coral" : "bg-azul-suave"}`}
        >
          <span
            className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-azul-relleno motion-safe:transition-transform motion-safe:duration-(--duracion-media) motion-safe:ease-salida"
            style={{ transform: `scaleX(${relleno})` }}
          />
        </span>
        <span className="grid text-xs [&>*]:[grid-area:1/1]">
          <span className={`flex flex-wrap gap-x-2 motion-safe:transition-opacity motion-safe:duration-(--duracion-rapida) ${activa && avance ? "opacity-0" : ""}`}>
            <span className="cifra font-semibold text-tinta">{tasa}</span>
            <Delta pp={etapa.deltaPp} />
          </span>
          {avance && (
            <span className={`cifra text-tinta-2 motion-safe:transition-opacity motion-safe:duration-(--duracion-rapida) ${activa ? "" : "opacity-0"}`}>
              Avanzan <b className="font-semibold text-azul-texto">{formatearEntero(avance.avanzan)}</b> · Se quedan{" "}
              <b className="font-semibold text-coral-texto">{formatearEntero(avance.seQuedan)}</b>
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
