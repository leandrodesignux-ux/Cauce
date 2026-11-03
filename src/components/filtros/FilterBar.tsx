"use client";

import { ArrowRightLeft, CalendarRange, ChevronDown, RotateCcw, SlidersHorizontal, Table2, Waves, X } from "lucide-react";
import { useState } from "react";
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
import { DIMENSIONES, OPCIONES_PERIODO, etiquetaDimension, type ClaveDimension } from "./opciones";

type Actualizar = ReturnType<typeof useFiltros>["actualizar"];

/** Filtros del cauce. Escritorio y tablet: fila de controles. Móvil: botón que abre un drawer. */
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
          <MenuDimension key={d.clave} clave={d.clave} estado={estado} actualizar={actualizar} />
        ))}
        {activos > 0 && (
          <Button variant="sutil" onClick={restablecer}>
            <RotateCcw data-icon="inline-start" />
            Restablecer
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Toggle variant="outline" pressed={estado.comparar} onPressedChange={(comparar) => actualizar({ comparar })}>
            <ArrowRightLeft data-icon="inline-start" />
            Comparar con período anterior
          </Toggle>
          <SelectorVista estado={estado} actualizar={actualizar} />
        </div>
      </div>

      {/* Móvil */}
      <div className="flex items-center gap-2 md:hidden">
        <Drawer open={hoja} onOpenChange={setHoja}>
          <DrawerTrigger asChild>
            <Button variant="filtro" size="lg" data-activo={activos > 0} className="h-10">
              <SlidersHorizontal data-icon="inline-start" />
              Filtros
              {activos > 0 && <span className="cifra rounded-full bg-azul-relleno px-1.5 text-xs text-sobre-relleno">{activos}</span>}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[88dvh]">
            <DrawerHeader className="flex-row items-center justify-between text-left">
              <div>
                <DrawerTitle className="text-lg">Filtros</DrawerTitle>
                <DrawerDescription className="sr-only">Período, dimensiones y forma de ver el cauce.</DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="sutil" size="icon-lg" aria-label="Cerrar">
                  <X />
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <div className="flex flex-col gap-6 overflow-y-auto px-4 pb-4">
              <Seccion titulo="Período">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="lg"
                  className="flex-wrap"
                  value={estado.preset === "personalizado" ? "" : estado.preset}
                  onValueChange={(v) => v && actualizar({ preset: v as PeriodoElegido })}
                >
                  {OPCIONES_PERIODO.map((o) => (
                    <ToggleGroupItem key={o.id} value={o.id} aria-label={o.largo}>
                      {o.medio}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Seccion>
              {DIMENSIONES.map((d) => (
                <Seccion key={d.clave} titulo={d.nombre}>
                  <ToggleGroup
                    type="multiple"
                    variant="outline"
                    size="lg"
                    className="flex-wrap"
                    value={estado[d.clave] as string[]}
                    onValueChange={(v) => actualizar({ [d.clave]: v } as Partial<EstadoFiltros>)}
                  >
                    {d.opciones.map((o) => (
                      <ToggleGroupItem key={o.id} value={o.id}>
                        {o.nombre}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </Seccion>
              ))}
              <Seccion titulo="Vista">
                <div className="flex flex-wrap gap-2">
                  <SelectorVista estado={estado} actualizar={actualizar} />
                  <Toggle variant="outline" size="lg" pressed={estado.comparar} onPressedChange={(comparar) => actualizar({ comparar })}>
                    Comparar con período anterior
                  </Toggle>
                </div>
              </Seccion>
            </div>
            <DrawerFooter className="flex-row border-t border-linea pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button variant="outline" className="h-11 flex-1" onClick={restablecer}>
                Restablecer
              </Button>
              <DrawerClose asChild>
                <Button className="h-11 flex-[2]">Ver resultados</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <span className="truncate text-sm text-tinta-2">{formatearRangoSemanas(estado.periodo.desde, estado.periodo.hasta)}</span>
      </div>
    </>
  );
}

function SelectorPeriodo({ estado, actualizar }: { estado: EstadoFiltros; actualizar: Actualizar }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <ToggleGroup
        type="single"
        variant="segmentado"
        spacing={1}
        aria-label="Período"
        value={estado.preset === "personalizado" ? "" : estado.preset}
        onValueChange={(v) => v && actualizar({ preset: v as PeriodoElegido })}
      >
        {OPCIONES_PERIODO.map((o) => (
          <ToggleGroupItem key={o.id} value={o.id} aria-label={o.largo} className="cifra">
            {o.corto}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Popover open={abierto} onOpenChange={setAbierto}>
        <PopoverTrigger asChild>
          <Button variant="filtro" data-activo={estado.preset === "personalizado"}>
            <CalendarRange data-icon="inline-start" />
            <span className="cifra">{formatearRangoSemanas(estado.periodo.desde, estado.periodo.hasta)}</span>
            <Flecha />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-68">
          {/* Se monta al abrir: arranca siempre desde el período vigente. */}
          <RangoPersonalizado estado={estado} actualizar={actualizar} alTerminar={() => setAbierto(false)} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function RangoPersonalizado({ estado, actualizar, alTerminar }: { estado: EstadoFiltros; actualizar: Actualizar; alTerminar: () => void }) {
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
        alTerminar();
      }}
    >
      <p className="text-xs text-tinta-2">Semanas completas, de lunes a domingo.</p>
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

function MenuDimension({ clave, estado, actualizar }: { clave: ClaveDimension; estado: EstadoFiltros; actualizar: Actualizar }) {
  const dimension = DIMENSIONES.find((d) => d.clave === clave)!;
  const elegidos = estado[clave] as string[];
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="filtro" data-activo={elegidos.length > 0}>
          {etiquetaDimension(dimension.nombre, dimension.opciones, elegidos)}
          <Flecha />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" aria-label={dimension.nombre} className="w-60">
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

/** Flujo o tabla: la misma información en río o en tablas. */
function SelectorVista({ estado, actualizar }: { estado: EstadoFiltros; actualizar: Actualizar }) {
  return (
    <ToggleGroup
      type="single"
      variant="segmentado"
      spacing={1}
      aria-label="Vista"
      value={estado.tabla ? "tabla" : "flujo"}
      onValueChange={(v) => v && actualizar({ tabla: v === "tabla" })}
    >
      <ToggleGroupItem value="flujo">
        <Waves data-icon="inline-start" />
        Flujo
      </ToggleGroupItem>
      <ToggleGroupItem value="tabla">
        <Table2 data-icon="inline-start" />
        Tabla
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function Flecha() {
  return <ChevronDown data-icon="inline-end" className="size-3.5 opacity-70 motion-safe:transition-transform group-aria-expanded/button:rotate-180" />;
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="text-sm font-medium text-tinta-2">{titulo}</h3>
      {children}
    </section>
  );
}
