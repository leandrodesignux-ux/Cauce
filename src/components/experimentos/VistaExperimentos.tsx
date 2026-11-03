"use client";

import { FlaskConical, GanttChart, Table2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo, type ReactNode } from "react";
import { StagePanel } from "@/components/panel/StagePanel";
import { useDatos } from "@/components/Proveedores";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { nombreEtapa } from "@/config/etapas";
import { ETIQUETA_ESTADO_EXPERIMENTO } from "@/config/experimentos";
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
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <header>
          <h1 className="mt-2 font-cifra text-xl leading-tight font-bold tracking-tight md:text-2xl">Registro de hipótesis</h1>
          <p className="mt-1.5 max-w-3xl text-tinta-2">
            Cada iniciativa declara antes de desplegarse qué espera mover y cuándo se va a poder leer. Así se sabe si lo que se dijo que iba a pasar,
            pasó.
          </p>
        </header>

        <section aria-label="Experimentos" className="vidrio flex flex-col gap-5 rounded-tarjeta p-3 shadow-tarjeta md:rounded-panel md:p-7">
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
            <ToggleGroup
              type="single"
              variant="segmentado"
              spacing={1}
              aria-label="Vista"
              value={vista}
              onValueChange={(v) => v && poner({ vista: v === "timeline" ? "timeline" : null })}
            >
              <ToggleGroupItem value="tabla">
                <Table2 data-icon="inline-start" />
                Tabla
              </ToggleGroupItem>
              <ToggleGroupItem value="timeline">
                <GanttChart data-icon="inline-start" />
                Timeline
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
  
          {visibles.length === 0 ? (
            <Empty className="flex-none py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FlaskConical />
                </EmptyMedia>
                <EmptyDescription>
                  No hay experimentos {estado ? `en estado «${ETIQUETA_ESTADO_EXPERIMENTO[estado]}»` : ""} todavía.{" "}
                  <button type="button" onClick={() => poner({ estado: null })} className="font-medium text-azul-texto underline underline-offset-2">
                    Ver todos
                  </button>
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : vista === "tabla" ? (
            <TablaExperimentos experimentos={visibles} seleccionado={exp?.id ?? null} onAbrir={abrir} />
          ) : (
            <TimelineExperimentos experimentos={visibles} seleccionado={exp?.id ?? null} onAbrir={abrir} />
          )}
        </section>
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
    <Toggle variant="outline" pressed={activo} onPressedChange={onClick}>
      {children}
    </Toggle>
  );
}
