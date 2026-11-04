"use client";

import { AlarmClock, ChevronDown, MessageSquare, Phone, RotateCcw, Undo2, Eye } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, type MouseEvent, useId, useState } from "react";
import { SECTORES } from "@/config/dimensiones";
import { type LeadFeed, DIAS_VENTANA_CRITICA, diasSinActividad, textoAntiguedad } from "@/lib/leads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreBadge } from "./ScoreBadge";

export type EstadoLead = "pendiente" | "rescatado" | "descartado";
export type Accion = "rescatar" | "descartar" | "restaurar";

const CURVA_SALIDA = [0.23, 1, 0.32, 1] as const;

const SALIDA = {
  oculto: (accion: Accion) => ({
    opacity: 0,
    x: accion === "rescatar" ? -56 : accion === "descartar" ? 56 : 0,
    transition: { duration: 0.2, ease: CURVA_SALIDA },
  }),
};

/**
 * Un lead del feed: quién es y qué tan caliente está (línea 1), su último mensaje (línea 2) y qué hacer con él.
 * Teléfono, mensajes y espacios vistos van en un detalle desplegable.
 */
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
  const sector = SECTORES.find((s) => s.id === lead.sector)!.nombre;
  const [abierto, setAbierto] = useState(false);
  const reducir = useReducedMotion() ?? false;
  const idDetalle = useId();

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
      className={`group grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 border-b border-linea px-4 py-5 outline-none last:border-0 focus-visible:bg-neutro-suave focus-visible:shadow-[inset_3px_0_0_var(--activo)] md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:px-5 ${
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
        className="mt-1 size-4 cursor-pointer self-start accent-azul-relleno md:mt-0 md:self-center"
      />

      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="font-medium">{lead.nombre}</span>
          <ScoreBadge score={lead.score} />
          <Badge variant={dias > DIAS_VENTANA_CRITICA ? "atrasado" : "critica"}>{textoAntiguedad(dias)}</Badge>
          <span className="text-sm text-tinta-2">
            {sector} · {lead.estado}
          </span>
        </p>
        <p className="flex min-w-0 items-center gap-1.5 text-sm text-tinta-2">
          {lead.urgencia && (
            <AlarmClock className="size-3.5 shrink-0 text-coral-texto" aria-label="Urgencia declarada" role="img" />
          )}
          <span className="truncate">“{lead.ultimoMensaje}”</span>
        </p>
      </div>

      <div className="col-start-2 flex flex-wrap items-center gap-2 md:col-start-auto md:justify-end">
        {estado === "pendiente" ? (
          <>
            <Button variant="coral" size="sm" onClick={() => onAccion("rescatar")}>
              Rescatar lead
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAccion("descartar")}>
              Descartar
            </Button>
          </>
        ) : (
          <>
            <span className={`inline-flex h-7.5 items-center text-sm ${estado === "rescatado" ? "text-azul-texto" : "text-tinta-2"}`}>
              {estado === "rescatado" ? "Rescatado" : "Descartado"}
            </span>
            <Button variant="outline" size="sm" onClick={() => onAccion("restaurar")}>
              {estado === "rescatado" ? <Undo2 data-icon="inline-start" /> : <RotateCcw data-icon="inline-start" />}
              Devolver a la fuga
            </Button>
          </>
        )}
        <Button
          variant="sutil"
          size="icon-sm"
          aria-expanded={abierto}
          aria-controls={idDetalle}
          aria-label={`Ver detalle de ${lead.nombre}`}
          title="Ver detalle"
          onClick={() => setAbierto((a) => !a)}
        >
          <ChevronDown className={`motion-safe:transition-transform motion-safe:duration-(--duracion-rapida) ${abierto ? "rotate-180" : ""}`} />
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            id={idDetalle}
            key="detalle"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reducir ? 0 : 0.22, ease: CURVA_SALIDA }}
            className="col-span-2 overflow-hidden md:col-span-1 md:col-start-2"
          >
            <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Dato icono={<Phone />} etiqueta="Teléfono">
                {lead.telefono}
              </Dato>
              <Dato icono={<MessageSquare />} etiqueta="Mensajes">
                {lead.mensajes}
              </Dato>
              <Dato icono={<Eye />} etiqueta="Espacios vistos">
                {lead.espaciosVistos}
              </Dato>
              {lead.urgencia && (
                <Dato icono={<AlarmClock />} etiqueta="Urgencia">
                  Declarada
                </Dato>
              )}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

function Dato({ icono, etiqueta, children }: { icono: React.ReactNode; etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden className="text-tinta-2 [&_svg]:size-3.5">
        {icono}
      </span>
      <dt className="text-tinta-2">{etiqueta}:</dt>
      <dd className="cifra font-medium">{children}</dd>
    </div>
  );
}
