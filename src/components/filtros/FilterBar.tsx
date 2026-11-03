"use client";

import { ChevronDown, RotateCcw, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useDatos } from "@/components/Proveedores";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { alternarValor, useFiltros } from "@/hooks/useFiltros";
import { contarFiltrosActivos, type EstadoFiltros, type PeriodoElegido } from "@/lib/filtros-url";
import { formatearRangoSemanas, formatearSemana } from "@/lib/formato";
import { DIMENSIONES, OPCIONES_PERIODO, type ClaveDimension } from "./opciones";

type Actualizar = ReturnType<typeof useFiltros>["actualizar"];

/** Valor visible de un chip de dimensión: "Todos", el nombre de la única opción o la cantidad elegida. */
function valorDimension(opciones: readonly { id: string; nombre: string }[], elegidos: readonly string[]): string {
  if (elegidos.length === 0) return "Todos";
  if (elegidos.length === 1) return opciones.find((o) => o.id === elegidos[0])!.nombre;
  return `${elegidos.length}`;
}

function valorPeriodo(estado: EstadoFiltros): string {
  if (estado.preset === "personalizado") return formatearRangoSemanas(estado.periodo.desde, estado.periodo.hasta);
  return OPCIONES_PERIODO.find((o) => o.id === estado.preset)!.medio;
}

/** Filtros del home como chips vidriados: Período, Canal, Sector y Estado. En móvil, con scroll horizontal. */
export function ChipsFiltros({ className }: { className?: string }) {
  const { estado, actualizar, restablecer } = useFiltros();
  const activos = contarFiltrosActivos(estado);
  return (
    <div role="toolbar" aria-label="Filtros" className={className}>
      <ChipPeriodo estado={estado} actualizar={actualizar} />
      {DIMENSIONES.map((d) => (
        <MenuDimension key={d.clave} clave={d.clave} estado={estado} actualizar={actualizar} />
      ))}
      {activos > 0 && (
        <Button variant="sutil" size="lg" onClick={restablecer} className="flex-none">
          <RotateCcw data-icon="inline-start" />
          Restablecer
        </Button>
      )}
    </div>
  );
}

function ChipPeriodo({ estado, actualizar }: { estado: EstadoFiltros; actualizar: Actualizar }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button variant="filtro" size="lg" data-activo={estado.preset !== "30d"} className="flex-none">
          Período <b className="cifra">{valorPeriodo(estado)}</b>
          <Flecha />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <SeccionPeriodo estado={estado} actualizar={actualizar} alTerminar={() => setAbierto(false)} />
      </PopoverContent>
    </Popover>
  );
}

function MenuDimension({ clave, estado, actualizar }: { clave: ClaveDimension; estado: EstadoFiltros; actualizar: Actualizar }) {
  const dimension = DIMENSIONES.find((d) => d.clave === clave)!;
  const elegidos = estado[clave] as string[];
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="filtro" size="lg" data-activo={elegidos.length > 0} className="flex-none">
          {dimension.nombre} <b>{valorDimension(dimension.opciones, elegidos)}</b>
          <Flecha />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" aria-label={dimension.nombre} className="w-60">
        {dimension.opciones.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.id}
            checked={elegidos.includes(o.id)}
            // Multiselección: el menú queda abierto al marcar.
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => actualizar(alternarValor(clave, o.id as never))}
          >
            {o.nombre}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator />
        <div className="flex justify-between">
          <DropdownMenuItem
            disabled={elegidos.length === 0}
            onSelect={(e) => {
              e.preventDefault();
              actualizar({ [clave]: [] } as Partial<EstadoFiltros>);
            }}
          >
            Ver todos
          </DropdownMenuItem>
          <DropdownMenuItem>Listo</DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Presets y rango personalizado. Lo usan el chip de Período y la hoja de filtros. */
function SeccionPeriodo({ estado, actualizar, alTerminar }: { estado: EstadoFiltros; actualizar: Actualizar; alTerminar?: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <ToggleGroup
        type="single"
        variant="outline"
        aria-label="Período"
        className="flex-wrap"
        value={estado.preset === "personalizado" ? "" : estado.preset}
        onValueChange={(v) => {
          if (!v) return;
          actualizar({ preset: v as PeriodoElegido });
          alTerminar?.();
        }}
      >
        {OPCIONES_PERIODO.map((o) => (
          <ToggleGroupItem key={o.id} value={o.id} aria-label={o.largo} size="lg">
            {o.medio}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {/* Se monta al abrir: arranca siempre desde el período vigente. */}
      <RangoPersonalizado estado={estado} actualizar={actualizar} alTerminar={alTerminar} />
    </div>
  );
}

function RangoPersonalizado({ estado, actualizar, alTerminar }: { estado: EstadoFiltros; actualizar: Actualizar; alTerminar?: () => void }) {
  const { semanas } = useDatos();
  const [desde, setDesde] = useState(estado.periodo.desde);
  const [hasta, setHasta] = useState(estado.periodo.hasta);
  const valido = desde <= hasta;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valido) return;
        actualizar({ preset: "personalizado", periodo: { desde, hasta } });
        alTerminar?.();
      }}
    >
      <p className="text-xs text-tinta-2">Rango personalizado: semanas completas, de lunes a domingo.</p>
      <CampoSemana etiqueta="Desde la semana del" valor={desde} onCambiar={setDesde} semanas={semanas} />
      <CampoSemana etiqueta="Hasta la semana del" valor={hasta} onCambiar={setHasta} semanas={semanas} />
      {!valido && <p className="text-xs text-coral-texto">La semana inicial tiene que ser anterior a la final.</p>}
      <Button type="submit" disabled={!valido}>
        Aplicar período
      </Button>
    </form>
  );
}

function CampoSemana({
  etiqueta,
  valor,
  onCambiar,
  semanas,
}: {
  etiqueta: string;
  valor: string;
  onCambiar: (v: string) => void;
  semanas: readonly string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm">{etiqueta}</span>
      <Select value={valor} onValueChange={onCambiar}>
        <SelectTrigger aria-label={etiqueta} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {semanas.map((s) => (
            <SelectItem key={s} value={s}>
              {formatearSemana(s)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Todos los filtros juntos: el popover del rail y la hoja de la barra móvil. */
export function PanelFiltros({ conVista = false }: { conVista?: boolean }) {
  const { estado, actualizar } = useFiltros();
  return (
    <div className="flex flex-col gap-6">
      <Seccion titulo="Período">
        <SeccionPeriodo key={`${estado.periodo.desde}-${estado.periodo.hasta}`} estado={estado} actualizar={actualizar} />
      </Seccion>
      {DIMENSIONES.map((d) => (
        <Seccion key={d.clave} titulo={d.nombre}>
          <ToggleGroup
            type="multiple"
            variant="outline"
            className="flex-wrap"
            value={estado[d.clave] as string[]}
            onValueChange={(v) => actualizar({ [d.clave]: v } as Partial<EstadoFiltros>)}
          >
            {d.opciones.map((o) => (
              <ToggleGroupItem key={o.id} value={o.id} size="lg">
                {o.nombre}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Seccion>
      ))}
      {conVista && (
        <Seccion titulo="Vista">
          <div className="flex flex-wrap gap-2">
            <Toggle variant="outline" size="lg" pressed={estado.tabla} onPressedChange={(tabla) => actualizar({ tabla })}>
              Ver como tabla
            </Toggle>
            <Toggle variant="outline" size="lg" pressed={estado.comparar} onPressedChange={(comparar) => actualizar({ comparar })}>
              Comparar con período anterior
            </Toggle>
          </div>
        </Seccion>
      )}
    </div>
  );
}

/** Móvil: hoja inferior con todos los filtros. `disparador` es el botón de la barra flotante. */
export function HojaFiltros({ disparador }: { disparador: ReactNode }) {
  const { restablecer } = useFiltros();
  return (
    <Drawer>
      <DrawerTrigger asChild>{disparador}</DrawerTrigger>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[88dvh]">
        <DrawerHeader className="flex-row items-center justify-between text-left">
          <div>
            <DrawerTitle className="font-cifra text-lg font-semibold">Filtros</DrawerTitle>
            <DrawerDescription className="sr-only">Período, dimensiones y forma de ver el journey.</DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="sutil" size="icon-lg" aria-label="Cerrar">
              <X />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-4">
          <PanelFiltros conVista />
        </div>
        <DrawerFooter className="flex-row border-t border-linea pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button variant="outline" size="lg" className="flex-1" onClick={restablecer}>
            Restablecer
          </Button>
          <DrawerClose asChild>
            <Button size="lg" className="flex-[2]">
              Ver resultados
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function Flecha() {
  return <ChevronDown data-icon="inline-end" className="size-3.5 opacity-60 motion-safe:transition-transform group-aria-expanded/button:rotate-180" />;
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-sm font-medium text-tinta-2">{titulo}</h3>
      {children}
    </section>
  );
}
