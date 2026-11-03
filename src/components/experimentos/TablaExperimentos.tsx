"use client";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow, TableRowHead } from "@/components/ui/table";
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
      <div className="hidden md:block">
        <Table marco className="min-w-[980px]">
          <TableCaption className="sr-only">Registro de hipótesis de Growth</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Experimento y palanca</TableHead>
              <TableHead>Transición objetivo</TableHead>
              <TableHead>Hipótesis</TableHead>
              <TableHead>Despliegue</TableHead>
              <TableHead>Ventana de lectura</TableHead>
              <TableHead>Predicho → observado</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {experimentos.map((e) => (
              <TableRow key={e.id} data-state={seleccionado === e.id ? "selected" : undefined} className="align-top">
                <TableRowHead className="py-3">
                  <button
                    type="button"
                    data-exp={e.id}
                    onClick={() => onAbrir(e.id)}
                    aria-expanded={seleccionado === e.id}
                    className="rounded-control text-left font-medium hover:text-cauce-texto"
                  >
                    {e.nombre}
                  </button>
                  <span className="mt-0.5 block text-xs text-niebla">{e.palanca}</span>
                </TableRowHead>
                <TableCell className="whitespace-nowrap py-3">
                  {nombreEtapa(e.transicion.desde)} → {nombreEtapa(e.transicion.hacia)}
                </TableCell>
                <TableCell className="max-w-72 py-3 text-niebla">{e.hipotesis}</TableCell>
                <TableCell className="cifra whitespace-nowrap py-3">{formatearSemana(e.despliegue)}</TableCell>
                <TableCell className="whitespace-nowrap py-3">
                  <span className="cifra">
                    {formatearSemanaCorta(inicioLectura(e))} – {formatearSemanaCorta(finLectura(e))}
                  </span>
                  <span className="block text-xs text-niebla">
                    Semanas {e.ventanaSemanas[0]}–{e.ventanaSemanas[1]}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap py-3">
                  <PredichoObservado e={e} />
                </TableCell>
                <TableCell className="py-3">
                  <ChipEstado estado={e.estado} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
