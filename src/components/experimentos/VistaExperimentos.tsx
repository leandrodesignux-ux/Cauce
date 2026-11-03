"use client";

import { GanttChart, Table2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { StagePanel } from "@/components/panel/StagePanel";
import { useDatos } from "@/components/Proveedores";
import { nombreEtapa } from "@/config/etapas";
import { ETIQUETA_ESTADO_EXPERIMENTO } from "@/config/experimentos";
import { useMedia } from "@/hooks/useMedia";
import { useInterfaz } from "@/lib/stores";
import type { EstadoExperimento } from "@/lib/tipos";
import { reemplazarUrl } from "@/lib/url";
import { DetalleExperimento } from "./DetalleExperimento";
import { TablaExperimentos } from "./TablaExperimentos";
import { TimelineExperimentos } from "./TimelineExperimentos";

const ESTADOS = Object.keys(ETIQUETA_ESTADO_EXPERIMENTO) as EstadoExperimento[];

export function VistaExperimentos() {
  const { experimentos } = useDatos();
  const params = useSearchParams();
  const pathname = usePathname();
  const escritorio = useMedia("(min-width: 1280px)", true);
  const fijarPanelAbierto = useInterfaz((s) => s.fijarPanelAbierto);

  const vista = params.get("vista") === "timeline" ? "timeline" : "tabla";
  const estado = ESTADOS.find((e) => e === params.get("estado")) ?? null;
  const exp = experimentos.find((e) => e.id === params.get("exp")) ?? null;

  const poner = useCallback(
    (cambios: Record<string, string | null>) => {
      const base = new URLSearchParams(window.location.search);
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor) base.set(clave, valor);
        else base.delete(clave);
      }
      reemplazarUrl(pathname, base);
    },
    [pathname],
  );

  useEffect(() => {
    fijarPanelAbierto(escritorio && exp !== null);
    return () => fijarPanelAbierto(false);
  }, [escritorio, exp, fijarPanelAbierto]);

  const ordenados = useMemo(() => [...experimentos].sort((a, b) => a.despliegue.localeCompare(b.despliegue)), [experimentos]);
  const visibles = estado ? ordenados.filter((e) => e.estado === estado) : ordenados;

  const abrir = (id: string) => poner({ exp: exp?.id === id ? null : id });
  const cerrar = () => {
    const id = exp?.id;
    poner({ exp: null });
    // Tabla y fichas móviles comparten data-exp: se enfoca la que está visible.
    if (id)
      requestAnimationFrame(() =>
        [...document.querySelectorAll<HTMLElement>(`[data-exp="${id}"]`)].find((el) => el.offsetParent !== null)?.focus(),
      );
  };

  return (
    <div className="flex flex-1">
      <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-6 md:px-6 xl:px-8">
        <header>
          <h1 className="font-cifra text-xl font-semibold md:text-2xl">Registro de hipótesis</h1>
          <p className="mt-1 max-w-2xl text-sm text-niebla">
            Cada iniciativa declara antes de desplegarse qué espera mover y cuándo se va a poder leer. Así se sabe si lo que se dijo que iba a pasar,
            pasó.
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
            <Chip activo={estado === null} onClick={() => poner({ estado: null })}>
              Todos <span className="cifra text-xs opacity-70">{experimentos.length}</span>
            </Chip>
            {ESTADOS.map((e) => {
              const n = experimentos.filter((x) => x.estado === e).length;
              return (
                <Chip key={e} activo={estado === e} onClick={() => poner({ estado: estado === e ? null : e })}>
                  {ETIQUETA_ESTADO_EXPERIMENTO[e]} <span className="cifra text-xs opacity-70">{n}</span>
                </Chip>
              );
            })}
          </div>
          <div role="group" aria-label="Vista" className="flex h-9 rounded-control border border-linea-fuerte p-0.5">
            <BotonVista activo={vista === "tabla"} onClick={() => poner({ vista: null })} icono={<Table2 className="size-4" aria-hidden />}>
              Tabla
            </BotonVista>
            <BotonVista activo={vista === "timeline"} onClick={() => poner({ vista: "timeline" })} icono={<GanttChart className="size-4" aria-hidden />}>
              Timeline
            </BotonVista>
          </div>
        </div>

        {visibles.length === 0 ? (
          <p className="rounded-panel border border-dashed border-linea-fuerte px-4 py-10 text-center text-sm text-niebla">
            No hay experimentos {estado ? `en estado «${ETIQUETA_ESTADO_EXPERIMENTO[estado]}»` : ""} todavía.{" "}
            <button type="button" onClick={() => poner({ estado: null })} className="text-cauce-texto underline underline-offset-2">
              Ver todos
            </button>
          </p>
        ) : vista === "tabla" ? (
          <TablaExperimentos experimentos={visibles} seleccionado={exp?.id ?? null} onAbrir={abrir} />
        ) : (
          <TimelineExperimentos experimentos={visibles} seleccionado={exp?.id ?? null} onAbrir={abrir} />
        )}
      </div>

      <StagePanel
        abierto={exp !== null}
        clave={exp?.id ?? null}
        titulo={exp?.nombre ?? ""}
        subtitulo={exp ? `${nombreEtapa(exp.transicion.desde)} → ${nombreEtapa(exp.transicion.hacia)}` : undefined}
        onCerrar={cerrar}
      >
        {exp && <DetalleExperimento e={exp} />}
      </StagePanel>
    </div>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-control border px-3 text-sm motion-safe:transition-colors ${
        activo ? "border-cauce bg-cauce-suave text-cauce-texto" : "border-linea-fuerte hover:border-niebla hover:bg-papel"
      }`}
    >
      {children}
    </button>
  );
}

function BotonVista({ activo, onClick, icono, children }: { activo: boolean; onClick: () => void; icono: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[calc(var(--radio-control)-2px)] px-3 text-sm motion-safe:transition-colors ${
        activo ? "bg-tinta text-concreto" : "text-niebla hover:text-tinta"
      }`}
    >
      {icono}
      {children}
    </button>
  );
}
