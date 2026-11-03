"use client";

import { nombreEtapa } from "@/config/etapas";
import { finLectura, inicioLectura } from "@/lib/experimentos";
import { formatearSemana, formatearSemanaCorta } from "@/lib/formato";
import type { Experimento } from "@/lib/tipos";
import { ChipEstado, PredichoObservado } from "./comunes";

/** Registro en tabla: todas las columnas de PRODUCT.md. Cada fila abre el detalle. */
export function TablaExperimentos({
  experimentos,
  seleccionado,
  onAbrir,
}: {
  experimentos: Experimento[];
  seleccionado: string | null;
  onAbrir: (id: string) => void;
}) {
  const th = "px-3 py-2.5 text-left text-xs font-medium text-niebla whitespace-nowrap";
  return (
    <>
      {/* Móvil: una ficha por experimento con las mismas columnas */}
      <ul className="flex flex-col gap-3 md:hidden">
        {experimentos.map((e) => (
          <li key={e.id}>
            <button
              type="button"
              data-exp={e.id}
              onClick={() => onAbrir(e.id)}
              aria-expanded={seleccionado === e.id}
              className={`flex w-full flex-col gap-2 rounded-panel border p-4 text-left ${seleccionado === e.id ? "border-cauce bg-cauce-suave" : "border-linea bg-papel"}`}
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="block font-medium">{e.nombre}</span>
                  <span className="block text-xs text-niebla">{e.palanca}</span>
                </span>
                <ChipEstado estado={e.estado} />
              </span>
              <span className="text-sm">
                {nombreEtapa(e.transicion.desde)} → {nombreEtapa(e.transicion.hacia)}
              </span>
              <span className="text-sm text-niebla">{e.hipotesis}</span>
              <span className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-niebla">
                <span className="whitespace-nowrap">Despliegue {formatearSemanaCorta(e.despliegue)}</span>
                <span className="whitespace-nowrap">
                  Lectura {formatearSemanaCorta(inicioLectura(e))} – {formatearSemanaCorta(finLectura(e))}
                </span>
              </span>
              <PredichoObservado e={e} compacto />
            </button>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-panel border border-linea bg-papel md:block">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <caption className="sr-only">Registro de hipótesis de Growth</caption>
          <thead>
            <tr className="border-b border-linea">
              <th scope="col" className={th}>Experimento y palanca</th>
              <th scope="col" className={th}>Transición objetivo</th>
              <th scope="col" className={th}>Hipótesis</th>
              <th scope="col" className={th}>Despliegue</th>
              <th scope="col" className={th}>Ventana de lectura</th>
              <th scope="col" className={th}>Predicho → observado</th>
              <th scope="col" className={th}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {experimentos.map((e) => (
              <tr key={e.id} className={`border-b border-linea align-top last:border-0 ${seleccionado === e.id ? "bg-cauce-suave" : "hover:bg-concreto"}`}>
                <th scope="row" className="px-3 py-3 text-left font-normal">
                  <button
                    type="button"
                    data-exp={e.id}
                    onClick={() => onAbrir(e.id)}
                    aria-expanded={seleccionado === e.id}
                    className="rounded-control text-left font-medium hover:text-cauce"
                  >
                    {e.nombre}
                  </button>
                  <span className="mt-0.5 block text-xs text-niebla">{e.palanca}</span>
                </th>
                <td className="whitespace-nowrap px-3 py-3">
                  {nombreEtapa(e.transicion.desde)} → {nombreEtapa(e.transicion.hacia)}
                </td>
                <td className="max-w-72 px-3 py-3 text-niebla">{e.hipotesis}</td>
                <td className="cifra whitespace-nowrap px-3 py-3">{formatearSemana(e.despliegue)}</td>
                <td className="whitespace-nowrap px-3 py-3">
                  <span className="cifra">
                    {formatearSemanaCorta(inicioLectura(e))} – {formatearSemanaCorta(finLectura(e))}
                  </span>
                  <span className="block text-xs text-niebla">
                    Semanas {e.ventanaSemanas[0]}–{e.ventanaSemanas[1]}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <PredichoObservado e={e} />
                </td>
                <td className="px-3 py-3">
                  <ChipEstado estado={e.estado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
