"use client";

import { EncabezadoVista } from "@/components/shell/EncabezadoVista";
import { FlaskConical, LayoutGrid, Table2 } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { PanelCentrado } from "@/components/panel/PanelCentrado";
import { useDatos } from "@/components/Proveedores";
import { SiguientePaso } from "@/components/shell/SiguientePaso";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import { nombreEtapa } from "@/config/etapas";
import { ETIQUETA_ESTADO_EXPERIMENTO } from "@/config/experimentos";
import type { EstadoExperimento } from "@/lib/tipos";
import { reemplazarUrl } from "@/lib/url";
import { ChipEstado } from "./comunes";
import { DetalleExperimento } from "./DetalleExperimento";
import { TablaExperimentos, TarjetasExperimentos } from "./TablaExperimentos";

/** Orden de los grupos: lo que está corriendo primero, lo que está en diseño al final. */
const ORDEN_GRUPOS: readonly EstadoExperimento[] = ["en_curso", "leyendo", "validado", "refutado", "diseno"];

export function VistaExperimentos() {
  const { experimentos } = useDatos();
  const params = useSearchParams();
  const pathname = usePathname();

  // Sin ?vista = tarjetas agrupadas por estado; ?vista=tabla, la tabla. URLs viejas: ?vista=timeline se ve como tarjetas y ?estado se ignora.
  const vista = params.get("vista") === "tabla" ? "tabla" : "tarjetas";
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

  // Por grupo de estado y, dentro de cada uno, por despliegue.
  const ordenados = useMemo(
    () => [...experimentos].sort((a, b) => ORDEN_GRUPOS.indexOf(a.estado) - ORDEN_GRUPOS.indexOf(b.estado) || a.despliegue.localeCompare(b.despliegue)),
    [experimentos],
  );
  const grupos = useMemo(
    () => ORDEN_GRUPOS.map((estado) => ({ estado, lista: ordenados.filter((e) => e.estado === estado) })).filter((g) => g.lista.length > 0),
    [ordenados],
  );

  const abrir = (id: string) => poner({ exp: exp?.id === id ? null : id });
  const cerrar = () => {
    const id = exp?.id;
    poner({ exp: null });
    // Tabla y tarjetas móviles comparten data-exp: se enfoca la que está visible.
    if (id)
      requestAnimationFrame(() =>
        [...document.querySelectorAll<HTMLElement>(`[data-exp="${id}"]`)].find((el) => el.offsetParent !== null)?.focus(),
      );
  };

  return (
    <div className="flex flex-1">
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <EncabezadoVista titulo="Experimentos" subtitulo="Qué paso espera mejorar cada experimento, cuándo se podrá medir y si funcionó." />

        <section aria-label="Experimentos" className="vidrio flex flex-col gap-5 rounded-tarjeta p-3 shadow-tarjeta md:rounded-panel md:p-7">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => poner({ vista: vista === "tabla" ? null : "tabla", estado: null })}>
              {vista === "tabla" ? <LayoutGrid data-icon="inline-start" /> : <Table2 data-icon="inline-start" />}
              {vista === "tabla" ? "Ver como tarjetas" : "Ver como tabla"}
            </Button>
          </div>

          {ordenados.length === 0 ? (
            <Empty className="flex-none py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FlaskConical />
                </EmptyMedia>
                <EmptyDescription>Todavía no hay experimentos.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : vista === "tabla" ? (
            <TablaExperimentos experimentos={ordenados} seleccionado={exp?.id ?? null} onAbrir={abrir} />
          ) : (
            grupos.map((g) => (
              <section key={g.estado} aria-labelledby={`grupo-${g.estado}`} className="flex flex-col gap-3">
                <h2 id={`grupo-${g.estado}`} className="flex items-baseline gap-2 text-base font-semibold">
                  {ETIQUETA_ESTADO_EXPERIMENTO[g.estado]}
                  <span className="cifra text-sm font-normal text-tinta-cuerpo">{g.lista.length}</span>
                </h2>
                <TarjetasExperimentos experimentos={g.lista} seleccionado={exp?.id ?? null} onAbrir={abrir} />
              </section>
            ))
          )}
        </section>

        <SiguientePaso desde="/experimentos" />
      </div>

      <PanelCentrado
        abierto={exp !== null}
        clave={exp?.id ?? null}
        titulo={exp?.nombre ?? ""}
        subtitulo={exp ? `${nombreEtapa(exp.transicion.desde)} → ${nombreEtapa(exp.transicion.hacia)}` : undefined}
        estado={exp ? <ChipEstado estado={exp.estado} /> : undefined}
        onCerrar={cerrar}
      >
        {exp && <DetalleExperimento e={exp} />}
      </PanelCentrado>
    </div>
  );
}

