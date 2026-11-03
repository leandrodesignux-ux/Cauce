"use client";

import {
  Building2,
  CalendarDays,
  ChevronRight,
  Droplet,
  FileCheck2,
  Globe,
  LayoutGrid,
  MessageCircle,
  ShieldCheck,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ETAPAS, FASES, ORDEN_ETAPAS } from "@/config/etapas";
import { ETIQUETA_ESTADO_EXPERIMENTO } from "@/config/experimentos";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import { formatearEntero, formatearMxnCompacto, formatearPp } from "@/lib/formato";
import type { EtapaJourney, Journey, PozaJourney } from "@/lib/journey";
import type { EtapaId, Experimento } from "@/lib/tipos";
import { type Caja, type Conectores, calcularConectores } from "./conectores";

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

const NOMBRE: Record<EtapaId, string> = Object.fromEntries(ETAPAS.map((e) => [e.id, e.nombre])) as Record<EtapaId, string>;
const ULTIMA = ORDEN_ETAPAS[ORDEN_ETAPAS.length - 1];

/**
 * Journey board: tres tarjetas (Atraer, Convertir, Cerrar) con las etapas en filas y las fugas colgando
 * debajo de su etapa de origen; abajo (o a la derecha en pantallas muy anchas), los experimentos.
 * Los conectores son un SVG superpuesto que se mide con ResizeObserver y se recalcula al cambiar tema, filtros o tamaño.
 */
export function JourneyBoard({
  journey,
  comparar,
  experimentos,
  destacado,
  onAbrirEtapa,
}: {
  journey: Journey;
  comparar: boolean;
  experimentos: readonly Experimento[];
  /** Id del experimento en pill negra (el más reciente en lectura). */
  destacado: string | null;
  onAbrirEtapa: (id: EtapaId) => void;
}) {
  const board = useRef<HTMLDivElement>(null);
  const [medidas, setMedidas] = useState<(Conectores & { ancho: number; alto: number }) | null>(null);
  const [resaltada, setResaltada] = useState<EtapaId | null>(null);
  const { resolvedTheme } = useTheme();

  useLayoutEffect(() => {
    const raiz = board.current;
    if (!raiz) return;
    let cuadro = 0;
    const medir = () => {
      const b = raiz.getBoundingClientRect();
      const caja = (el: Element): Caja => {
        const r = el.getBoundingClientRect();
        return { x: r.left - b.left, y: r.top - b.top, ancho: r.width, alto: r.height };
      };
      const etapas = [...raiz.querySelectorAll<HTMLElement>("[data-icono-etapa]")].map((el) => ({
        id: el.dataset.iconoEtapa!,
        icono: caja(el),
        tarjeta: caja(el.closest("[data-tarjeta]")!),
      }));
      const fugas = [...raiz.querySelectorAll<HTMLElement>("[data-icono-fuga]")].map((el) => ({
        id: el.dataset.iconoFuga!,
        desde: el.dataset.desde!,
        icono: caja(el),
      }));
      setMedidas({ ...calcularConectores(etapas, fugas), ancho: b.width, alto: b.height });
    };
    const programar = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(medir);
    };
    medir();
    const observador = new ResizeObserver(programar);
    observador.observe(raiz);
    // Las fuentes web cambian el alto de las filas cuando terminan de cargar.
    void document.fonts?.ready.then(programar);
    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
    };
  }, [journey, comparar, resolvedTheme]);


  return (
    <div ref={board} className="relative grid grid-cols-1 gap-7 md:grid-cols-2 md:gap-10 tablero:grid-cols-3 ancho:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,0.9fr)]">
      {medidas && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] size-full overflow-visible"
          viewBox={`0 0 ${medidas.ancho} ${medidas.alto}`}
        >
          {medidas.espina.map((d) => (
            <path key={d} d={d} fill="none" className="stroke-azul" strokeWidth={2} />
          ))}
          {medidas.puentes.map((p) => (
            <g key={p.d}>
              <path d={p.d} fill="none" className="stroke-azul" strokeWidth={2} />
              {p.puntos.map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r={4} className="fill-tarjeta stroke-azul" strokeWidth={2} />
              ))}
            </g>
          ))}
          {medidas.fugas.map((d) => (
            <path key={d} d={d} fill="none" className="stroke-coral" strokeWidth={1.5} strokeDasharray="4 4" />
          ))}
        </svg>
      )}

      {FASES.map((fase) => (
        <div key={fase.id} className="flex min-w-0 flex-col gap-3.5">
          <div data-tarjeta className="flex flex-1 flex-col gap-1 rounded-tarjeta border border-tarjeta-borde bg-tarjeta p-2 shadow-tarjeta md:p-3.5">
            {fase.etapas.map((id) => {
              const etapa = journey.etapas.find((e) => e.id === id)!;
              return (
                <div key={id} className="contents">
                  <FilaEtapa etapa={etapa} comparar={comparar} resaltada={resaltada === id} onAbrir={() => onAbrirEtapa(id)} />
                  {journey.pozas
                    .filter((p) => ORDEN_ETAPAS[p.desde] === id)
                    .map((p) => (
                      <FilaFuga key={p.id} poza={p} desde={id} />
                    ))}
                </div>
              );
            })}
          </div>
          <p className="font-medium max-md:order-first md:text-center">
            {fase.nombre}
            <small className="block text-xs font-normal text-tinta-2">{fase.descripcion}</small>
          </p>
        </div>
      ))}

      <section aria-labelledby="t-experimentos" className="col-span-full flex min-w-0 flex-col gap-3.5 ancho:col-span-1">
        <p id="t-experimentos" className="font-medium">
          Experimentos
          <small className="block text-xs font-normal text-tinta-2">
            <span className="hidden [@media(hover:hover)]:inline">Pase el cursor o enfoque uno para ver qué etapa ataca.</span>
            <span className="[@media(hover:hover)]:hidden">Toque uno para ver su detalle.</span>
          </small>
        </p>
        <ul className="grid flex-1 grid-cols-2 gap-2.5 md:grid-cols-3 tablero:grid-cols-6 ancho:grid-cols-2">
          {experimentos.map((e) => (
            <li key={e.id} className="flex">
              <TileExperimento
                e={e}
                activo={e.id === destacado}
                onResaltar={(si) => setResaltada(si ? e.transicion.desde : null)}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function textoTasa(etapa: EtapaJourney): string {
  if (etapa.tasa === null) return "—";
  const pct = etapa.tasa * 100;
  // Cierre sobre el total queda por debajo del 1 %: dos decimales para que no se lea "0.0 %".
  return `${pct.toLocaleString("es-MX", { minimumFractionDigits: pct < 1 ? 2 : 1, maximumFractionDigits: pct < 1 ? 2 : 1 })} %`;
}

function Delta({ pp }: { pp: number | null }) {
  if (pp === null) return <small className="block text-xs font-medium text-tinta-2">—</small>;
  if (Math.abs(pp) < 0.05) return <small className="block text-xs font-medium text-tinta-2">= 0.0 pp</small>;
  const sube = pp > 0;
  return (
    <small className={`block text-xs font-medium ${sube ? "text-azul-texto" : "text-coral-texto"}`}>
      <span aria-hidden>{sube ? "↑" : "↓"} </span>
      <span className="sr-only">{sube ? "sube " : "baja "}</span>
      {formatearPp(Math.abs(pp)).replace("+", "")}
    </small>
  );
}

function FilaEtapa({
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
  return (
    <button
      type="button"
      data-etapa={etapa.id}
      data-resalta={resaltada}
      onClick={onAbrir}
      aria-label={`${NOMBRE[etapa.id]}: ${formatearEntero(etapa.volumen)}. ${esCierre ? "Del total" : "Avanza"} ${textoTasa(etapa)}. Ver el detalle de la etapa.`}
      className="relative grid min-h-14 w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-fila border border-transparent p-2.5 text-left motion-safe:transition-colors hover:bg-azul-suave data-[resalta=true]:border-azul data-[resalta=true]:bg-azul-suave md:grid-cols-[44px_minmax(0,1fr)_auto_32px]"
    >
      <span data-icono-etapa={etapa.id} className="relative z-[1] grid size-10 place-items-center rounded-full bg-azul-suave text-azul-texto md:size-11">
        <Icono className="size-5" strokeWidth={1.7} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-tinta-2">{NOMBRE[etapa.id]}</span>
        <span className="cifra block text-lg font-semibold">{formatearEntero(etapa.volumen)}</span>
        {comparar && <span className="cifra block text-xs text-tinta-2">Antes: {formatearEntero(etapa.anterior)}</span>}
      </span>
      <span className="cifra whitespace-nowrap text-right text-sm font-semibold">
        {textoTasa(etapa)}
        {esCierre ? <small className="block text-xs font-medium text-tinta-2">del total</small> : <Delta pp={etapa.deltaPp} />}
      </span>
      <Ir />
    </button>
  );
}

function FilaFuga({ poza, desde }: { poza: PozaJourney; desde: EtapaId }) {
  const fantasmas = poza.id === FUGA_MODELO_PERDIDA;
  const icono = (
    <span
      data-icono-fuga={poza.id}
      data-desde={desde}
      className="grid size-8 place-items-center rounded-full border-[1.5px] border-dashed border-coral text-coral-texto md:size-9"
    >
      <Droplet className="size-4" strokeWidth={2} aria-hidden />
    </span>
  );
  const textos = (
    <span className="min-w-0">
      <span className="block text-sm font-medium">{poza.nombre}</span>
      <span className="block text-xs text-tinta-2">
        {formatearEntero(poza.volumen)} {fantasmas ? "sin broker" : "perdidos"}
      </span>
    </span>
  );
  const monto = <span className="cifra text-right text-sm font-semibold">{formatearMxnCompacto(poza.valor)}</span>;
  const clases =
    "relative ml-3 grid w-[calc(100%-0.75rem)] grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-fila px-2.5 py-2 text-left motion-safe:transition-colors hover:bg-coral-suave md:ml-[22px] md:w-[calc(100%-22px)] md:grid-cols-[36px_minmax(0,1fr)_auto_auto]";

  if (fantasmas) {
    return (
      <div role="group" aria-label={`Fuga: ${poza.nombre}`} className={clases}>
        {icono}
        {textos}
        {monto}
        <Button asChild variant="coral" size="sm" className="max-md:col-start-2 max-md:justify-self-start">
          <Link href={`/fugas?poza=${poza.id}`}>Rescatar</Link>
        </Button>
      </div>
    );
  }
  return (
    <Link href={`/fugas?poza=${poza.id}`} aria-label={`Fuga: ${poza.nombre}, ${formatearEntero(poza.volumen)} perdidos, ${formatearMxnCompacto(poza.valor)}. Abrir la poza.`} className={clases}>
      {icono}
      {textos}
      {monto}
      <Ir />
    </Link>
  );
}

function Ir() {
  return (
    <span aria-hidden className="hidden size-8 place-items-center rounded-full border border-linea text-tinta-2 md:grid">
      <ChevronRight className="size-4" strokeWidth={2} />
    </span>
  );
}

function TileExperimento({ e, activo, onResaltar }: { e: Experimento; activo: boolean; onResaltar: (si: boolean) => void }) {
  return (
    <Link
      href={`/experimentos?exp=${e.id}`}
      data-activo={activo}
      onMouseEnter={() => onResaltar(true)}
      onMouseLeave={() => onResaltar(false)}
      onFocus={() => onResaltar(true)}
      onBlur={() => onResaltar(false)}
      aria-label={`${e.nombre}. ${ETIQUETA_ESTADO_EXPERIMENTO[e.estado]}, ${formatearPp(e.prediccionPp)} esperado en ${NOMBRE[e.transicion.desde]}. Ver el detalle.`}
      className="group/tile flex min-h-24 w-full flex-col justify-between gap-2.5 rounded-tile border border-tarjeta-borde bg-tarjeta px-4 py-3.5 text-left shadow-tarjeta outline-2 outline-offset-0 outline-transparent motion-safe:transition-[outline-color] hover:outline-azul data-[activo=true]:border-activo data-[activo=true]:bg-activo data-[activo=true]:text-sobre-activo"
    >
      <span className="text-sm leading-snug font-medium">{e.nombre}</span>
      <span className="text-xs text-tinta-2 group-data-[activo=true]/tile:text-sobre-activo/85">
        {ETIQUETA_ESTADO_EXPERIMENTO[e.estado]} · <b className="cifra text-sm text-tinta group-data-[activo=true]/tile:text-sobre-activo">{formatearPp(e.prediccionPp)}</b>
        {activo && " esperado"}
      </span>
    </Link>
  );
}
