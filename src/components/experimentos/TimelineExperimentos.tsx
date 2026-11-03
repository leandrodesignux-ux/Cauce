"use client";

import { scaleTime } from "d3-scale";
import { useRef } from "react";
import { nombreEtapa } from "@/config/etapas";
import { ETIQUETA_ESTADO_EXPERIMENTO } from "@/config/experimentos";
import { useAncho } from "@/hooks/useAncho";
import { HOY, finLectura, inicioLectura, situacion } from "@/lib/experimentos";
import { formatearSemana } from "@/lib/formato";
import { sumarDias } from "@/lib/selectors";
import type { EstadoExperimento, Experimento } from "@/lib/tipos";
import { ChipEstado } from "./comunes";

const TONO_BARRA: Record<EstadoExperimento, { ejecucion: string; lectura: string; borde: string }> = {
  diseno: { ejecucion: "transparent", lectura: "transparent", borde: "var(--tenue)" },
  en_curso: { ejecucion: "var(--azul-suave)", lectura: "var(--azul-relleno)", borde: "var(--azul-relleno)" },
  leyendo: { ejecucion: "color-mix(in srgb, var(--coral) 18%, transparent)", lectura: "var(--coral)", borde: "var(--coral)" },
  validado: { ejecucion: "var(--azul-suave)", lectura: "var(--azul-relleno)", borde: "var(--azul-relleno)" },
  refutado: { ejecucion: "var(--coral-suave)", lectura: "var(--coral)", borde: "var(--coral)" },
};

const fecha = (iso: string) => new Date(`${iso}T00:00:00Z`);
const mes = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "UTC" });
const mesAnio = new Intl.DateTimeFormat("es-MX", { month: "short", year: "numeric", timeZone: "UTC" });

/** Barras desde el despliegue hasta el fin de la ventana de lectura, con la línea de hoy. */
export function TimelineExperimentos({
  experimentos,
  seleccionado,
  onAbrir,
}: {
  experimentos: Experimento[];
  seleccionado: string | null;
  onAbrir: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ancho = useAncho(ref);
  const columnaEtiquetas = ancho >= 900 ? 340 : 0;
  const areaBarras = Math.max(0, ancho - columnaEtiquetas);

  const desde = sumarDias([...experimentos.map((e) => e.despliegue), HOY].sort()[0], -14);
  const hasta = sumarDias([...experimentos.map(finLectura), HOY].sort().at(-1)!, 14);
  const x = scaleTime().domain([fecha(desde), fecha(hasta)]).range([8, Math.max(9, areaBarras - 8)]);
  const meses = x.ticks(columnaEtiquetas ? 8 : 4);
  const xHoy = x(fecha(HOY));

  return (
    <div ref={ref} className="rounded-panel border border-linea bg-tarjeta p-4 md:p-5">
      {ancho > 0 && (
        <>
          {/* Eje de meses */}
          <div className="relative mb-2 h-6" style={{ marginLeft: columnaEtiquetas }} aria-hidden>
            {meses.map((d) => (
              <span key={d.toISOString()} className="absolute top-0 -translate-x-1/2 text-xs text-tinta-2" style={{ left: x(d) }}>
                {(d.getUTCMonth() === 0 ? mesAnio : mes).format(d).replace(".", "")}
              </span>
            ))}
          </div>

          <ol className="relative flex flex-col" aria-label="Línea de tiempo de experimentos">
            {/* Guías de mes y línea de hoy detrás de las filas (en móvil van dentro de cada barra para no cruzar los nombres) */}
            {columnaEtiquetas > 0 && <div aria-hidden className="pointer-events-none absolute inset-y-0" style={{ left: columnaEtiquetas, width: areaBarras }}>
              {meses.map((d) => (
                <span key={d.toISOString()} className="absolute inset-y-0 w-px bg-linea" style={{ left: x(d) }} />
              ))}
              <span className="absolute inset-y-0 w-0.5 bg-activo" style={{ left: xHoy }} />
            </div>}

            {experimentos.map((e) => {
              const tono = TONO_BARRA[e.estado];
              const x0 = x(fecha(e.despliegue));
              const x1 = x(fecha(inicioLectura(e)));
              const x2 = x(fecha(finLectura(e)));
              const activo = seleccionado === e.id;
              const s = situacion(e);
              return (
                <li key={e.id} className="relative">
                  <button
                    type="button"
                    data-exp={e.id}
                    onClick={() => onAbrir(e.id)}
                    aria-expanded={activo}
                    aria-label={`${e.nombre}. ${ETIQUETA_ESTADO_EXPERIMENTO[e.estado]}. Despliegue ${formatearSemana(e.despliegue)}, lectura del ${formatearSemana(
                      inicioLectura(e),
                    )} al ${formatearSemana(finLectura(e))}. ${s.texto}.`}
                    className={`grid w-full items-center gap-y-2 rounded-control py-3 text-left md:py-2.5 ${activo ? "bg-azul-suave" : "hover:bg-neutro-suave"}`}
                    style={{ gridTemplateColumns: columnaEtiquetas ? `${columnaEtiquetas}px 1fr` : "1fr" }}
                  >
                    <span className="flex min-w-0 items-center gap-2 px-2">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{e.nombre}</span>
                        <span className="block truncate text-xs text-tinta-2">
                          {nombreEtapa(e.transicion.desde)} → {nombreEtapa(e.transicion.hacia)} · {s.texto}
                        </span>
                      </span>
                      <ChipEstado estado={e.estado} />
                    </span>
                    <span className="relative block h-7" aria-hidden>
                      {columnaEtiquetas === 0 && (
                        <>
                          {meses.map((d) => (
                            <span key={d.toISOString()} className="absolute inset-y-0 w-px bg-linea" style={{ left: x(d) }} />
                          ))}
                          <span className="absolute inset-y-0 w-0.5 bg-activo" style={{ left: xHoy }} />
                        </>
                      )}
                      {/* Ejecución: del despliegue al inicio de la lectura */}
                      <span
                        className="absolute top-1.5 h-4 rounded-l-full border"
                        style={{
                          left: x0,
                          width: Math.max(2, x1 - x0),
                          background: tono.ejecucion,
                          borderColor: tono.borde,
                          borderStyle: e.estado === "diseno" ? "dashed" : "solid",
                        }}
                      />
                      {/* Ventana de lectura */}
                      <span
                        className="absolute top-1.5 h-4 rounded-r-full border"
                        style={{
                          left: x1,
                          width: Math.max(2, x2 - x1),
                          background: tono.lectura,
                          borderColor: tono.borde,
                          borderStyle: e.estado === "diseno" ? "dashed" : "solid",
                        }}
                      />
                      <span className="absolute top-0 size-2 -translate-x-1/2 rounded-full bg-activo" style={{ left: x0, top: 10 }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="relative mt-1 h-5" style={{ marginLeft: columnaEtiquetas }} aria-hidden>
            <span className="absolute -translate-x-1/2 whitespace-nowrap text-xs font-medium" style={{ left: xHoy }}>
              Hoy · {formatearSemana(HOY)}
            </span>
          </div>

          <ul aria-label="Leyenda" className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-linea pt-3 text-xs text-tinta-2">
            <li className="flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-full bg-activo" />
              Despliegue
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-3 w-6 rounded-l-full border border-azul bg-azul-suave" />
              En ejecución
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-3 w-6 rounded-r-full bg-azul-relleno" />
              Ventana de lectura
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-3 w-6 rounded-full border border-dashed border-tenue" />
              En diseño
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden className="h-3 w-0.5 bg-activo" />
              Hoy (corte de los datos)
            </li>
          </ul>
        </>
      )}
    </div>
  );
}
