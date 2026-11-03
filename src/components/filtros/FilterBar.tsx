"use client";

import { ArrowRightLeft, CalendarRange, RotateCcw, SlidersHorizontal, Table2 } from "lucide-react";
import { useState } from "react";
import { useDatos } from "@/components/Proveedores";
import { alternarValor, useFiltros } from "@/hooks/useFiltros";
import { contarFiltrosActivos, type EstadoFiltros } from "@/lib/filtros-url";
import { formatearRangoSemanas, formatearSemana } from "@/lib/formato";
import { HojaInferior } from "./HojaInferior";
import { DIMENSIONES, OPCIONES_PERIODO, etiquetaDimension, type ClaveDimension } from "./opciones";
import { Popover, claseControl, claseEstadoControl, useCerrarPopover } from "./Popover";

type Actualizar = ReturnType<typeof useFiltros>["actualizar"];

/** Filtros del cauce. Escritorio y tablet: fila de controles. Móvil: botón que abre una hoja inferior. */
export function FilterBar() {
  const { estado, actualizar, restablecer } = useFiltros();
  const [hoja, setHoja] = useState(false);
  const activos = contarFiltrosActivos(estado);

  return (
    <>
      {/* Escritorio y tablet */}
      <div role="toolbar" aria-label="Filtros" className="hidden flex-wrap items-center gap-2 md:flex">
        <SelectorPeriodo estado={estado} actualizar={actualizar} />
        <span className="mx-1 h-5 w-px bg-linea" aria-hidden />
        {DIMENSIONES.map((d) => (
          <Popover key={d.clave} activo={estado[d.clave].length > 0} etiqueta={etiquetaDimension(d.nombre, d.opciones, estado[d.clave])}>
            <ListaOpciones clave={d.clave} estado={estado} actualizar={actualizar} />
          </Popover>
        ))}
        {activos > 0 && (
          <button type="button" onClick={restablecer} className={`${claseControl} border-transparent text-niebla hover:text-tinta`}>
            <RotateCcw className="size-3.5" aria-hidden />
            Restablecer
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Alternar activo={estado.comparar} onClick={() => actualizar((a) => ({ comparar: !a.comparar }))} icono={<ArrowRightLeft className="size-3.5" aria-hidden />}>
            Comparar con período anterior
          </Alternar>
          <Alternar activo={estado.tabla} onClick={() => actualizar((a) => ({ tabla: !a.tabla }))} icono={<Table2 className="size-3.5" aria-hidden />}>
            Ver como tabla
          </Alternar>
        </div>
      </div>

      {/* Móvil */}
      <div className="flex items-center gap-2 md:hidden">
        <button type="button" onClick={() => setHoja(true)} className={`${claseControl} ${claseEstadoControl(activos > 0)} h-10`}>
          <SlidersHorizontal className="size-4" aria-hidden />
          Filtros
          {activos > 0 && <span className="rounded-full bg-cauce px-1.5 text-xs text-sobre-cauce">{activos}</span>}
        </button>
        <span className="truncate text-sm text-niebla">{formatearRangoSemanas(estado.periodo.desde, estado.periodo.hasta)}</span>
      </div>

      <HojaInferior
        abierta={hoja}
        onCerrar={() => setHoja(false)}
        titulo="Filtros"
        pie={
          <div className="flex gap-2">
            <button type="button" onClick={restablecer} className={`${claseControl} h-11 flex-1 justify-center border-linea-fuerte`}>
              Restablecer
            </button>
            <button
              type="button"
              onClick={() => setHoja(false)}
              className={`${claseControl} h-11 flex-[2] justify-center border-cauce bg-cauce font-medium text-sobre-cauce`}
            >
              Ver resultados
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <Seccion titulo="Período">
            <div className="flex flex-wrap gap-2">
              {OPCIONES_PERIODO.map((o) => (
                <Chip key={o.id} activo={estado.preset === o.id} onClick={() => actualizar({ preset: o.id })}>
                  {o.medio}
                </Chip>
              ))}
            </div>
          </Seccion>
          {DIMENSIONES.map((d) => (
            <Seccion key={d.clave} titulo={d.nombre}>
              <div className="flex flex-wrap gap-2">
                {d.opciones.map((o) => {
                  const elegidos = estado[d.clave] as string[];
                  const activo = elegidos.includes(o.id);
                  return (
                    <Chip
                      key={o.id}
                      activo={activo}
                      onClick={() => actualizar(alternarValor(d.clave, o.id as never))}
                    >
                      {o.nombre}
                    </Chip>
                  );
                })}
              </div>
            </Seccion>
          ))}
          <Seccion titulo="Vista">
            <div className="flex flex-wrap gap-2">
              <Chip activo={estado.comparar} onClick={() => actualizar((a) => ({ comparar: !a.comparar }))}>
                Comparar con período anterior
              </Chip>
              <Chip activo={estado.tabla} onClick={() => actualizar((a) => ({ tabla: !a.tabla }))}>
                Ver como tabla
              </Chip>
            </div>
          </Seccion>
        </div>
      </HojaInferior>
    </>
  );
}

function SelectorPeriodo({ estado, actualizar }: { estado: EstadoFiltros; actualizar: Actualizar }) {
  return (
    <div className="flex items-center gap-2">
      <div role="group" aria-label="Período" className="flex h-8 rounded-control border border-linea-fuerte p-0.5">
        {OPCIONES_PERIODO.map((o) => {
          const activo = estado.preset === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={activo}
              aria-label={o.largo}
              onClick={() => actualizar({ preset: o.id })}
              className={`cifra rounded-[calc(var(--radio-control)-2px)] px-2.5 text-sm motion-safe:transition-colors ${
                activo ? "bg-tinta text-concreto" : "text-niebla hover:text-tinta"
              }`}
            >
              {o.corto}
            </button>
          );
        })}
      </div>
      <Popover
        activo={estado.preset === "personalizado"}
        etiqueta={
          <>
            <CalendarRange className="size-3.5" aria-hidden />
            <span className="cifra">{formatearRangoSemanas(estado.periodo.desde, estado.periodo.hasta)}</span>
          </>
        }
      >
        <RangoPersonalizado estado={estado} actualizar={actualizar} />
      </Popover>
    </div>
  );
}

function RangoPersonalizado({ estado, actualizar }: { estado: EstadoFiltros; actualizar: Actualizar }) {
  const { semanas } = useDatos();
  const alTerminar = useCerrarPopover();
  const [desde, setDesde] = useState(estado.periodo.desde);
  const [hasta, setHasta] = useState(estado.periodo.hasta);
  const valido = desde <= hasta;

  const select = "h-9 w-full rounded-control border border-linea-fuerte bg-papel px-2 text-sm";
  return (
    <form
      className="flex w-64 flex-col gap-3 p-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valido) return;
        actualizar({ preset: "personalizado", periodo: { desde, hasta } });
        alTerminar();
      }}
    >
      <p className="text-xs text-niebla">Semanas completas, de lunes a domingo.</p>
      <label className="flex flex-col gap-1 text-sm">
        Desde la semana del
        <select className={select} value={desde} onChange={(e) => setDesde(e.target.value)}>
          {semanas.map((s) => (
            <option key={s} value={s}>
              {formatearSemana(s)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Hasta la semana del
        <select className={select} value={hasta} onChange={(e) => setHasta(e.target.value)}>
          {semanas.map((s) => (
            <option key={s} value={s}>
              {formatearSemana(s)}
            </option>
          ))}
        </select>
      </label>
      {!valido && <p className="text-xs text-oxido">La semana inicial tiene que ser anterior a la final.</p>}
      <button type="submit" disabled={!valido} className={`${claseControl} justify-center border-cauce bg-cauce font-medium text-sobre-cauce disabled:opacity-50`}>
        Aplicar período
      </button>
    </form>
  );
}

function ListaOpciones({
  clave,
  estado,
  actualizar,
}: {
  clave: ClaveDimension;
  estado: EstadoFiltros;
  actualizar: Actualizar;
}) {
  const alTerminar = useCerrarPopover();
  const dimension = DIMENSIONES.find((d) => d.clave === clave)!;
  const elegidos = estado[clave] as string[];
  return (
    <fieldset className="flex flex-col">
      <legend className="sr-only">{dimension.nombre}</legend>
      {dimension.opciones.map((o) => (
        <label key={o.id} className="flex h-9 cursor-pointer items-center gap-2.5 rounded-control px-2 text-sm hover:bg-concreto">
          <input
            type="checkbox"
            className="size-4 accent-cauce"
            checked={elegidos.includes(o.id)}
            onChange={() => actualizar(alternarValor(clave, o.id as never))}
          />
          {o.nombre}
        </label>
      ))}
      <div className="mt-1 flex justify-between border-t border-linea px-1 pt-2">
        <button
          type="button"
          disabled={elegidos.length === 0}
          onClick={() => actualizar({ [clave]: [] } as Partial<EstadoFiltros>)}
          className="rounded-control px-1 text-sm text-niebla hover:text-tinta disabled:opacity-40"
        >
          Ver todos
        </button>
        <button type="button" onClick={alTerminar} className="rounded-control px-1 text-sm font-medium text-cauce">
          Listo
        </button>
      </div>
    </fieldset>
  );
}

function Alternar({ activo, onClick, icono, children }: { activo: boolean; onClick: () => void; icono: React.ReactNode; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={activo} onClick={onClick} className={`${claseControl} ${claseEstadoControl(activo)}`}>
      {icono}
      {children}
    </button>
  );
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={activo} onClick={onClick} className={`${claseControl} ${claseEstadoControl(activo)} h-9`}>
      {children}
    </button>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-sm font-medium text-niebla">{titulo}</h3>
      {children}
    </section>
  );
}
