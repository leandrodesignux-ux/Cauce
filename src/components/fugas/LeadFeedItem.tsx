"use client";

import { AlarmClock, MessageSquare, Phone, RotateCcw, Undo2 } from "lucide-react";
import { motion } from "motion/react";
import type { KeyboardEvent, MouseEvent } from "react";
import { SECTORES } from "@/config/dimensiones";
import { formatearEntero } from "@/lib/formato";
import { type LeadFeed, DIAS_VENTANA_CRITICA, diasSinActividad, textoAntiguedad } from "@/lib/leads";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "./ScoreBadge";
import { Button } from "@/components/ui/button";

export type EstadoLead = "pendiente" | "rescatado" | "descartado";
export type Accion = "rescatar" | "descartar" | "restaurar";

const SALIDA = {
  oculto: (accion: Accion) => ({
    opacity: 0,
    x: accion === "rescatar" ? -56 : accion === "descartar" ? 56 : 0,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] as const },
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
      className={`group grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 border-b border-linea px-3 py-4 last:border-0 focus-visible:bg-neutro-suave md:grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1fr)_auto] md:items-center md:px-4 ${
        seleccionado ? "bg-azul-suave" : destacado ? "bg-coral-suave" : ""
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
        className="mt-1 size-4 cursor-pointer accent-azul-relleno md:mt-0"
      />

      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-medium">{lead.nombre}</span>
          <span className="cifra inline-flex items-center gap-1 text-xs text-tinta-2">
            <Phone className="size-3" aria-hidden />
            {lead.telefono}
          </span>
        </p>
        <p className="mt-0.5 truncate text-xs text-tinta-2">
          {sector} · {lead.estado}
          {senales.length > 0 && ` · ${senales.join(" · ")}`}
        </p>
        <p className="mt-2 line-clamp-2 text-sm">“{lead.ultimoMensaje}”</p>
      </div>

      <div className="col-start-2 flex flex-wrap items-center gap-2 md:col-start-auto">
        <ScoreBadge score={lead.score} />
        {lead.urgencia && (
          <Badge variant="urgente">
            <AlarmClock aria-hidden />
            Urgente
          </Badge>
        )}
        {critico ? (
          <Badge variant="critica">{textoAntiguedad(dias)}</Badge>
        ) : (
          <span className="inline-flex h-6 items-center px-2 text-xs text-tinta-2">{textoAntiguedad(dias)}</span>
        )}
        <span className="cifra inline-flex items-center gap-1 text-xs text-tinta-2" title={`${lead.mensajes} mensajes, ${lead.espaciosVistos} espacios vistos`}>
          <MessageSquare className="size-3" aria-hidden />
          {lead.mensajes} · {lead.espaciosVistos} espacios
        </span>
      </div>

      <div className="col-start-2 flex gap-2 md:col-start-auto md:justify-end">
        {estado === "pendiente" ? (
          <>
            <Button variant="coral" onClick={() => onAccion("rescatar")}>
              Rescatar lead
            </Button>
            <Button variant="outline" onClick={() => onAccion("descartar")}>
              Descartar
            </Button>
          </>
        ) : (
          <>
            <span className={`inline-flex h-8 items-center text-sm ${estado === "rescatado" ? "text-azul-texto" : "text-tinta-2"}`}>
              {estado === "rescatado" ? "Rescatado" : "Descartado"}
            </span>
            <Button variant="outline" onClick={() => onAccion("restaurar")}>
              {estado === "rescatado" ? <Undo2 data-icon="inline-start" /> : <RotateCcw data-icon="inline-start" />}
              Devolver a la poza
            </Button>
          </>
        )}
      </div>
    </motion.li>
  );
}
