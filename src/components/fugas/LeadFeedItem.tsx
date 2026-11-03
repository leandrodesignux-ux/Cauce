"use client";

import { AlarmClock, MessageSquare, Phone, RotateCcw, Undo2 } from "lucide-react";
import { motion } from "motion/react";
import type { KeyboardEvent, MouseEvent } from "react";
import { SECTORES } from "@/config/dimensiones";
import { formatearEntero } from "@/lib/formato";
import { type LeadFeed, DIAS_VENTANA_CRITICA, diasSinActividad, textoAntiguedad } from "@/lib/leads";
import { ScoreBadge } from "./ScoreBadge";

export type EstadoLead = "pendiente" | "rescatado" | "descartado";
export type Accion = "rescatar" | "descartar" | "restaurar";

const SALIDA = {
  oculto: (accion: Accion) => ({
    opacity: 0,
    x: accion === "rescatar" ? -56 : accion === "descartar" ? 56 : 0,
    transition: { duration: 0.22, ease: "easeIn" as const },
  }),
};

/** Un lead del feed: quién es, qué pidió, qué tan caliente está y qué hacer con él. */
export function LeadFeedItem({
  lead,
  estado,
  seleccionado,
  destacado,
  onSeleccionar,
  onAccion,
  onEnfocar,
}: {
  lead: LeadFeed;
  estado: EstadoLead;
  seleccionado: boolean;
  destacado: boolean;
  onSeleccionar: (rango: boolean) => void;
  onAccion: (accion: Accion) => void;
  onEnfocar: () => void;
}) {
  const dias = diasSinActividad(lead);
  const critico = dias <= DIAS_VENTANA_CRITICA;
  const sector = SECTORES.find((s) => s.id === lead.sector)!.nombre;
  const senales = [
    lead.senales.superficieM2 !== null ? `${formatearEntero(lead.senales.superficieM2)} m²` : null,
    lead.senales.zona,
    lead.senales.presupuestoMxn !== null ? `$${formatearEntero(lead.senales.presupuestoMxn)}/mes` : null,
  ].filter(Boolean);

  const alPresionar = (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === " " || e.key === "x") {
      e.preventDefault();
      onSeleccionar(e.shiftKey);
    }
  };

  return (
    <motion.li
      layout="position"
      variants={SALIDA}
      exit="oculto"
      tabIndex={0}
      data-lead={lead.id}
      aria-label={`${lead.nombre}, ${sector}, ${lead.estado}, score ${lead.score}${lead.urgencia ? ", urgente" : ""}, ${textoAntiguedad(dias).toLowerCase()}`}
      onFocus={(e) => {
        if (e.target === e.currentTarget) onEnfocar();
      }}
      onKeyDown={alPresionar}
      onClick={(e: MouseEvent) => {
        if (e.shiftKey) onSeleccionar(true);
      }}
      className={`group grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 border-b border-linea px-3 py-4 last:border-0 focus-visible:bg-concreto md:grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1fr)_auto] md:items-center md:px-4 ${
        seleccionado ? "bg-cauce-suave" : destacado ? "bg-laton/10" : ""
      }`}
    >
      <input
        type="checkbox"
        aria-label={`Seleccionar a ${lead.nombre}`}
        checked={seleccionado}
        onChange={() => {}}
        onClick={(e) => {
          e.stopPropagation();
          onSeleccionar(e.shiftKey);
        }}
        className="mt-1 size-4 cursor-pointer accent-cauce md:mt-0"
      />

      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium">{lead.nombre}</span>
          <span className="cifra inline-flex items-center gap-1 text-xs text-niebla">
            <Phone className="size-3" aria-hidden />
            {lead.telefono}
          </span>
        </p>
        <p className="mt-0.5 truncate text-xs text-niebla">
          {sector} · {lead.estado}
          {senales.length > 0 && ` · ${senales.join(" · ")}`}
        </p>
        <p className="mt-2 line-clamp-2 text-sm">“{lead.ultimoMensaje}”</p>
      </div>

      <div className="col-start-2 flex flex-wrap items-center gap-2 md:col-start-auto">
        <ScoreBadge score={lead.score} />
        {lead.urgencia && (
          <span className="inline-flex h-6 items-center gap-1 rounded-control border border-oxido px-2 text-xs text-oxido">
            <AlarmClock className="size-3" aria-hidden />
            Urgente
          </span>
        )}
        <span
          className={`inline-flex h-6 items-center rounded-control px-2 text-xs ${
            critico ? "bg-laton/15 font-medium text-laton" : "text-niebla"
          }`}
        >
          {textoAntiguedad(dias)}
        </span>
        <span className="cifra inline-flex items-center gap-1 text-xs text-niebla" title={`${lead.mensajes} mensajes, ${lead.espaciosVistos} espacios vistos`}>
          <MessageSquare className="size-3" aria-hidden />
          {lead.mensajes} · {lead.espaciosVistos} espacios
        </span>
      </div>

      <div className="col-start-2 flex gap-2 md:col-start-auto md:justify-end">
        {estado === "pendiente" ? (
          <>
            <button
              type="button"
              onClick={() => onAccion("rescatar")}
              className="inline-flex h-8 items-center rounded-control border border-cauce bg-cauce px-3 text-sm font-medium text-sobre-cauce hover:opacity-90"
            >
              Rescatar lead
            </button>
            <button
              type="button"
              onClick={() => onAccion("descartar")}
              className="inline-flex h-8 items-center rounded-control border border-linea-fuerte px-3 text-sm text-niebla hover:border-niebla hover:text-tinta"
            >
              Descartar
            </button>
          </>
        ) : (
          <>
            <span className={`inline-flex h-8 items-center text-sm ${estado === "rescatado" ? "text-cauce" : "text-niebla"}`}>
              {estado === "rescatado" ? "Rescatado" : "Descartado"}
            </span>
            <button
              type="button"
              onClick={() => onAccion("restaurar")}
              className="inline-flex h-8 items-center gap-1.5 rounded-control border border-linea-fuerte px-3 text-sm hover:border-niebla"
            >
              {estado === "rescatado" ? <Undo2 className="size-3.5" aria-hidden /> : <RotateCcw className="size-3.5" aria-hidden />}
              Devolver a la poza
            </button>
          </>
        )}
      </div>
    </motion.li>
  );
}
