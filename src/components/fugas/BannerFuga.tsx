"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { nombreEtapa } from "@/config/etapas";
import { formatearEntero, formatearUsd } from "@/lib/formato";
import type { Banda, Distribucion, RangoAntiguedad } from "@/lib/leads";
import type { Experimento, Fuga } from "@/lib/tipos";

type Segmento<T extends string> = { id: T; nombre: string; color: string };

const INTENCION: Segmento<Banda>[] = [
  { id: "alto", nombre: "Alto", color: "bg-azul-relleno" },
  { id: "medio", nombre: "Medio", color: "bg-azul" },
  { id: "bajo", nombre: "Bajo", color: "bg-linea-fuerte" },
];
const ANTIGUEDAD: Segmento<RangoAntiguedad>[] = [
  // La ventana crítica lleva el acento coral: es lo que se enfría primero.
  { id: "critica", nombre: "≤3 días", color: "bg-coral" },
  { id: "reciente", nombre: "4–14 días", color: "bg-azul" },
  { id: "antigua", nombre: "Más de 14 días", color: "bg-linea-fuerte" },
];

/**
 * Banner de una fuga en /fugas: valor estimado, volumen y transición a la izquierda; a la derecha, los
 * pendientes por intención y por antigüedad en dos barras apiladas. Cada segmento es un filtro (banda o
 * antiguedad en la URL). Fugas sin leads: monto, volumen y el experimento que las ataca, sin barras.
 */
export function BannerFuga({
  fuga,
  valorUsd,
  volumen,
  esModelo,
  experimento,
  distribucion,
  filtroBanda,
  filtroAntiguedad,
  onFiltrar,
  comoSeCalcula,
}: {
  fuga: Fuga;
  valorUsd: number;
  volumen: number;
  esModelo: boolean;
  experimento: Experimento | null;
  /** null si la fuga no tiene leads. */
  distribucion: Distribucion | null;
  filtroBanda: Banda | null;
  filtroAntiguedad: RangoAntiguedad | null;
  onFiltrar: (cambios: { banda?: Banda | null; antiguedad?: RangoAntiguedad | null }) => void;
  comoSeCalcula?: ReactNode;
}) {
  const hayFiltros = filtroBanda !== null || filtroAntiguedad !== null;
  return (
    <div className="grid gap-6 rounded-tarjeta border border-tarjeta-borde bg-tarjeta p-6 shadow-tarjeta md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-10">
      <div className="flex flex-col items-start gap-1">
        <p className="text-sm text-tinta-2">Valor estimado</p>
        <p className="cifra text-2xl font-semibold md:text-3xl">{formatearUsd(valorUsd)}</p>
        <p className="text-sm text-tinta-2">
          <span className="cifra">{formatearEntero(volumen)}</span> {esModelo ? "sin atender" : "perdidos"} en 30 días · {nombreEtapa(fuga.desde)} →{" "}
          {nombreEtapa(fuga.hacia)}
        </p>
        {!distribucion && experimento && (
          <p className="mt-2 text-sm text-tinta-2">
            La ataca{" "}
            <Link href={`/experimentos?exp=${experimento.id}`} className="font-medium text-azul-texto underline underline-offset-2">
              {experimento.nombre}
            </Link>
            .
          </p>
        )}
        {comoSeCalcula && <div className="mt-3">{comoSeCalcula}</div>}
      </div>

      {distribucion && (
        <div className="flex flex-col gap-4">
          <BarraFiltro
            titulo="Por intención"
            segmentos={INTENCION}
            conteo={distribucion.banda}
            activo={filtroBanda}
            onAlternar={(id) => onFiltrar({ banda: filtroBanda === id ? null : id })}
          />
          <BarraFiltro
            titulo="Por antigüedad"
            segmentos={ANTIGUEDAD}
            conteo={distribucion.antiguedad}
            activo={filtroAntiguedad}
            onAlternar={(id) => onFiltrar({ antiguedad: filtroAntiguedad === id ? null : id })}
          />
          {hayFiltros && (
            <button
              type="button"
              onClick={() => onFiltrar({ banda: null, antiguedad: null })}
              className="self-start rounded-control text-sm font-medium text-azul-texto underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-activo"
            >
              Quitar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BarraFiltro<T extends string>({
  titulo,
  segmentos,
  conteo,
  activo,
  onAlternar,
}: {
  titulo: string;
  segmentos: Segmento<T>[];
  conteo: Record<T, number>;
  activo: T | null;
  onAlternar: (id: T) => void;
}) {
  const total = segmentos.reduce((s, x) => s + conteo[x.id], 0);
  return (
    <div role="group" aria-label={`Pendientes ${titulo.toLowerCase()}`} className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-tinta-2">{titulo}</p>
      {/* Cada segmento es un botón de 36 px de alto con la barra de 12 px adentro: área de toque cómoda. */}
      <div className="flex h-9 items-center gap-0.5">
        {segmentos.map((s) =>
          conteo[s.id] === 0 ? null : (
            <button
              key={s.id}
              type="button"
              aria-pressed={activo === s.id}
              aria-label={`${s.nombre}: ${formatearEntero(conteo[s.id])} pendientes. ${activo === s.id ? "Quitar filtro" : "Filtrar"}.`}
              onClick={() => onAlternar(s.id)}
              style={{ flexGrow: conteo[s.id] / Math.max(1, total) }}
              className="group/seg flex h-full min-w-3 basis-0 items-center rounded-control outline-none focus-visible:ring-2 focus-visible:ring-activo"
            >
              <span
                className={`h-3 w-full rounded-[3px] ${s.color} motion-safe:transition-[opacity,scale] motion-safe:duration-(--duracion-rapida) group-hover/seg:scale-y-[1.33] group-aria-pressed/seg:scale-y-[1.33] ${
                  activo !== null && activo !== s.id ? "opacity-35" : ""
                }`}
              />
            </button>
          ),
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-tinta-2">
        {segmentos.map((s) => (
          <li key={s.id} className={`flex items-center gap-1.5 ${activo === s.id ? "font-semibold text-tinta" : ""}`}>
            <span aria-hidden className={`size-2 rounded-full ${s.color}`} />
            {s.nombre} <span className="cifra">{formatearEntero(conteo[s.id])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
