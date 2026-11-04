"use client";

import { EncabezadoVista } from "@/components/shell/EncabezadoVista";
import { Calculator, Inbox, SearchX } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useDatos } from "@/components/Proveedores";
import { SiguientePaso } from "@/components/shell/SiguientePaso";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { nombreEtapa } from "@/config/etapas";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import { NOMBRE_CORTO_POZA, causaVisible } from "@/config/pozas";
import { formatearEntero } from "@/lib/formato";
import { type LeadFeed, banda, diasSinActividad, distribucionLeads, rangoAntiguedad } from "@/lib/leads";
import { POR_PAGINA, numerosDePagina, paginar } from "@/lib/paginacion";
import { periodoDesdePreset, valorEnRiesgoPorPoza } from "@/lib/selectors";
import { useSesion } from "@/lib/stores";
import { BannerFuga } from "./BannerFuga";
import { LeadFeedItem, type Accion, type EstadoLead } from "./LeadFeedItem";
import { LossModel } from "./LossModel";
import { type Bandeja, useFiltrosFugas } from "./useFiltrosFugas";

const BANDEJAS: { id: Bandeja; nombre: string }[] = [
  { id: "pendientes", nombre: "Pendientes" },
  { id: "rescatados", nombre: "Rescatados" },
  { id: "descartados", nombre: "Descartados" },
];
const ESTADO_DE_BANDEJA: Record<Bandeja, EstadoLead> = { pendientes: "pendiente", rescatados: "rescatado", descartados: "descartado" };
const BANDEJA_DE_ESTADO: Record<EstadoLead, Bandeja> = { pendiente: "pendientes", rescatado: "rescatados", descartado: "descartados" };

export function VistaFugas({ leads }: { leads: LeadFeed[] }) {
  const { flujo, fugas, experimentos, ultimaSemana } = useDatos();
  const { filtros, actualizar } = useFiltrosFugas(
    useMemo(() => fugas.map((f) => f.id), [fugas]),
    FUGA_MODELO_PERDIDA,
  );
  const rescatados = useSesion((s) => s.rescatados);
  const descartados = useSesion((s) => s.descartados);
  const { rescatar, descartar, restaurar } = useSesion.getState();

  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [enfocado, setEnfocado] = useState<string | null>(null);
  const [ultimaAccion, setUltimaAccion] = useState<Accion>("rescatar");
  const ancla = useRef<string | null>(null);

  const estadoDe = useCallback(
    (id: string): EstadoLead => (rescatados[id] ? "rescatado" : descartados[id] ? "descartado" : "pendiente"),
    [rescatados, descartados],
  );

  const poza = fugas.find((f) => f.id === filtros.poza)!;
  const valorPoza = useMemo(
    () => valorEnRiesgoPorPoza(flujo, [poza], { periodo: periodoDesdePreset("30d", ultimaSemana) })[0],
    [flujo, poza, ultimaSemana],
  );
  const enPoza = useMemo(() => leads.filter((l) => l.fugaId === filtros.poza), [leads, filtros.poza]);
  const pendientesPorPoza = useMemo(() => {
    const c: Record<string, number> = {};
    for (const l of leads) if (estadoDe(l.id) === "pendiente") c[l.fugaId!] = (c[l.fugaId!] ?? 0) + 1;
    return c;
  }, [leads, estadoDe]);

  const enBandeja = useMemo(() => enPoza.filter((l) => estadoDe(l.id) === ESTADO_DE_BANDEJA[filtros.bandeja]), [enPoza, estadoDe, filtros.bandeja]);
  const visibles = useMemo(
    () =>
      enBandeja
        .filter((l) => !filtros.banda || banda(l.score) === filtros.banda)
        .filter((l) => !filtros.antiguedad || rangoAntiguedad(diasSinActividad(l)) === filtros.antiguedad)
        .sort((a, b) => b.score - a.score || diasSinActividad(a) - diasSinActividad(b)),
    [enBandeja, filtros.banda, filtros.antiguedad],
  );

  // Página actual (10 por página), acotada: si una acción vacía la última página, se ve la anterior.
  const pag = paginar(visibles.length, filtros.pagina);
  const enPagina = useMemo(() => visibles.slice(pag.desde, pag.hasta), [visibles, pag.desde, pag.hasta]);
  const pendientesEnPoza = useMemo(() => enPoza.filter((l) => estadoDe(l.id) === "pendiente"), [enPoza, estadoDe]);
  const distribucion = useMemo(() => distribucionLeads(pendientesEnPoza), [pendientesEnPoza]);
  const conteoBandeja = useMemo(() => {
    const c: Record<Bandeja, number> = { pendientes: 0, rescatados: 0, descartados: 0 };
    for (const l of enPoza) c[BANDEJA_DE_ESTADO[estadoDe(l.id)]]++;
    return c;
  }, [enPoza, estadoDe]);

  // La URL sigue a la página efectiva (p. ej. después de rescatar el último lead de la última página).
  useEffect(() => {
    if (visibles.length > 0 && filtros.pagina !== pag.pagina) actualizar({ pagina: pag.pagina });
  }, [visibles.length, filtros.pagina, pag.pagina, actualizar]);

  // El foco pasa al primer lead de la nueva página cuando ya está pintada (la URL se actualiza después del clic).
  const focoTrasPaginar = useRef<string | null>(null);
  useEffect(() => {
    const id = focoTrasPaginar.current;
    if (!id || !enPagina.some((l) => l.id === id)) return;
    focoTrasPaginar.current = null;
    const el = document.querySelector<HTMLElement>(`[data-lead="${id}"]`);
    el?.focus({ preventScroll: true });
    el?.scrollIntoView({ block: "nearest" });
  }, [enPagina]);

  const irAPagina = (n: number) => {
    setSeleccion(new Set());
    focoTrasPaginar.current = visibles[(n - 1) * POR_PAGINA]?.id ?? null;
    actualizar({ pagina: n });
  };

  const enfocar = useCallback((id: string | undefined) => {
    if (!id) return;
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-lead="${id}"]`)?.focus());
  }, []);

  /** Aplica una acción a la selección (o al lead enfocado) y deja el foco en el siguiente de la lista. */
  const aplicar = useCallback(
    (accion: Accion, ids: string[]) => {
      if (ids.length === 0) return;
      const ultimoIndice = Math.max(...ids.map((id) => visibles.findIndex((l) => l.id === id)));
      const siguiente = visibles.slice(ultimoIndice + 1).find((l) => !ids.includes(l.id)) ?? [...visibles].reverse().find((l) => !ids.includes(l.id));
      setUltimaAccion(accion);
      if (accion === "rescatar") rescatar(ids);
      if (accion === "descartar") descartar(ids);
      if (accion === "restaurar") restaurar(ids);
      setSeleccion(new Set());
      const n = ids.length;
      const plural = n === 1 ? "" : "s";
      const mensaje =
        accion === "rescatar"
          ? `${n} lead${plural} rescatado${plural}: vuelve${n === 1 ? "" : "n"} al recorrido en ${nombreEtapa(poza.hacia)}.`
          : accion === "descartar"
            ? `${n} lead${plural} descartado${plural}.`
            : `${n} lead${plural} devuelto${plural} a la fuga.`;
      // Un aviso por vez: el nuevo reemplaza al anterior y reinicia los 5 s.
      toast.dismiss();
      toast(mensaje, {
        duration: 5000,
        action: accion === "restaurar" ? undefined : { label: "Deshacer", onClick: () => restaurar(ids) },
      });
      enfocar(siguiente?.id);
    },
    [visibles, rescatar, descartar, restaurar, poza.hacia, enfocar],
  );

  const alternarSeleccion = useCallback(
    (id: string, rango: boolean) => {
      setSeleccion((previa) => {
        const nueva = new Set(previa);
        if (rango && ancla.current) {
          const a = visibles.findIndex((l) => l.id === ancla.current);
          const b = visibles.findIndex((l) => l.id === id);
          if (a !== -1 && b !== -1) {
            for (const l of visibles.slice(Math.min(a, b), Math.max(a, b) + 1)) nueva.add(l.id);
            return nueva;
          }
        }
        if (nueva.has(id)) nueva.delete(id);
        else nueva.add(id);
        return nueva;
      });
      ancla.current = id;
    },
    [visibles],
  );

  // Atajos: J/K para moverse dentro de la página (Shift extiende la selección), R rescata, D descarta, Esc limpia la selección.
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      const destino = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || destino.closest("input, textarea, select, [role=slider], [role=dialog], [cmdk-root]")) return;
      const tecla = e.key.toLowerCase();
      const indice = enPagina.findIndex((l) => l.id === enfocado);
      if (tecla === "j" || tecla === "k") {
        e.preventDefault();
        const siguiente = enPagina[Math.max(0, Math.min(enPagina.length - 1, indice === -1 ? 0 : indice + (tecla === "j" ? 1 : -1)))];
        if (!siguiente) return;
        if (e.shiftKey) {
          setSeleccion((s) => new Set([...s, ...(enfocado ? [enfocado] : []), siguiente.id]));
          ancla.current = siguiente.id;
        }
        enfocar(siguiente.id);
        document.querySelector(`[data-lead="${siguiente.id}"]`)?.scrollIntoView({ block: "nearest" });
      } else if ((tecla === "r" || tecla === "d") && filtros.bandeja === "pendientes") {
        const ids = seleccion.size > 0 ? [...seleccion] : enfocado && indice !== -1 ? [enfocado] : [];
        if (ids.length === 0) return;
        e.preventDefault();
        aplicar(tecla === "r" ? "rescatar" : "descartar", ids);
      } else if (e.key === "Escape" && seleccion.size > 0) {
        setSeleccion(new Set());
      }
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [enPagina, enfocado, seleccion, filtros.bandeja, aplicar, enfocar]);

  // Llegada desde ⌘K o desde el recorrido con ?lead=: lo lleva a la vista y le da el foco.
  useEffect(() => {
    if (!filtros.lead) return;
    const id = requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-lead="${filtros.lead}"]`);
      el?.scrollIntoView({ block: "center" });
      el?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [filtros.lead]);

  const cambiarPoza = (id: string) => {
    setSeleccion(new Set());
    actualizar({ poza: id, lead: null });
  };

  const experimento = experimentos.find((e) => e.id === poza.experimentoId);
  const filtrosActivos = filtros.banda !== null || filtros.antiguedad !== null;

  return (
    <div className="flex flex-col gap-8">
      <EncabezadoVista titulo="Rescate de leads" subtitulo="Cuánto vale cada fuga y qué leads con intención conviene rescatar primero." />

      <section aria-label="Fugas" className="vidrio flex flex-col gap-4 rounded-tarjeta p-3 shadow-tarjeta md:rounded-panel md:p-7">
        <Tabs value={filtros.poza} onValueChange={cambiarPoza}>
          <TabsList variant="pill" aria-label="Fugas" className="max-w-full justify-start overflow-x-auto">
            {fugas.map((f) => {
              const pendientes = pendientesPorPoza[f.id] ?? null;
              return (
                <TabsTrigger key={f.id} value={f.id} className="flex-none">
                  {NOMBRE_CORTO_POZA[f.id] ?? causaVisible(f)}
                  {pendientes !== null && (
                    <Badge variant={f.id === filtros.poza ? "pendientes" : "neutro"} className="cifra h-5 px-2">
                      {pendientes}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
          <TabsContent value={filtros.poza} className="flex flex-col gap-4 pt-2">
            <BannerFuga
              fuga={poza}
              valorUsd={valorPoza.valorUsd}
              volumen={valorPoza.volumen}
              esModelo={poza.id === FUGA_MODELO_PERDIDA}
              experimento={experimento ?? null}
              distribucion={enPoza.length > 0 ? distribucion : null}
              filtroBanda={filtros.banda}
              filtroAntiguedad={filtros.antiguedad}
              onFiltrar={(cambios) => {
                setSeleccion(new Set());
                actualizar(cambios);
              }}
              comoSeCalcula={poza.id === FUGA_MODELO_PERDIDA ? <ComoSeCalcula /> : undefined}
            />

            {enPoza.length === 0 ? (
              <Vacio icono={<Inbox />}>Esta fuga mide sesiones anónimas: no hay leads con datos de contacto para rescatar.</Vacio>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <ToggleGroup
                    type="single"
                    variant="segmentado"
                    value={filtros.bandeja}
                    onValueChange={(v) => {
                      if (!v) return;
                      setSeleccion(new Set());
                      actualizar({ bandeja: v as Bandeja });
                    }}
                    aria-label="Bandeja"
                    className="w-full sm:w-auto"
                  >
                    {BANDEJAS.map((b) => (
                      <ToggleGroupItem key={b.id} value={b.id} className="flex-1 gap-1.5 px-2 sm:flex-none sm:px-4">
                        {b.nombre}
                        <span className="cifra text-xs opacity-80">{conteoBandeja[b.id]}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  {visibles.length > 0 && (
                    <p aria-live="polite" className="cifra text-sm text-tinta-cuerpo">
                      Mostrando {formatearEntero(pag.desde + 1)}–{formatearEntero(pag.hasta)} de {formatearEntero(visibles.length)}
                    </p>
                  )}
                </div>

                {visibles.length === 0 ? (
                  <Vacio icono={filtrosActivos ? <SearchX /> : <Inbox />}>
                    {filtros.bandeja === "pendientes"
                      ? `No hay ${filtrosActivos ? "leads con esos filtros" : "leads pendientes"} en esta fuga.`
                      : `Todavía no hay leads ${filtros.bandeja} en esta fuga.`}{" "}
                    {filtrosActivos ? (
                      <button type="button" onClick={() => actualizar({ banda: null, antiguedad: null })} className="text-azul-texto underline underline-offset-2">
                        Quitar filtros
                      </button>
                    ) : filtros.bandeja !== "pendientes" ? (
                      <button type="button" onClick={() => actualizar({ bandeja: "pendientes" })} className="text-azul-texto underline underline-offset-2">
                        Ver pendientes
                      </button>
                    ) : null}
                  </Vacio>
                ) : (
                  <div className="relative mt-2 flex flex-col gap-4">
                    <ul aria-label={`Leads en ${NOMBRE_CORTO_POZA[poza.id] ?? causaVisible(poza)}`} className="overflow-hidden rounded-tarjeta border border-tarjeta-borde bg-tarjeta shadow-tarjeta">
                      <AnimatePresence initial={false} custom={ultimaAccion}>
                        {enPagina.map((l) => (
                          <LeadFeedItem
                            key={l.id}
                            lead={l}
                            estado={estadoDe(l.id)}
                            seleccionado={seleccion.has(l.id)}
                            destacado={l.id === filtros.lead}
                            onSeleccionar={(rango) => alternarSeleccion(l.id, rango)}
                            onAccion={(accion) => aplicar(accion, [l.id])}
                            onEnfocar={() => setEnfocado(l.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>

                    {pag.paginas > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious disabled={pag.pagina === 1} onClick={() => irAPagina(pag.pagina - 1)} />
                          </PaginationItem>
                          {numerosDePagina(pag.pagina, pag.paginas).map((n, i) => (
                            <PaginationItem key={n === "…" ? `salto-${i}` : n}>
                              {n === "…" ? (
                                <PaginationEllipsis />
                              ) : (
                                <PaginationLink isActive={n === pag.pagina} aria-label={`Página ${n}`} onClick={() => irAPagina(n)}>
                                  {n}
                                </PaginationLink>
                              )}
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext disabled={pag.pagina === pag.paginas} onClick={() => irAPagina(pag.pagina + 1)} />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}

                    {seleccion.size > 0 && (
                      <div
                        role="region"
                        aria-label="Acciones para la selección"
                        className="sticky bottom-[calc(var(--alto-barra-movil)+28px)] z-10 mt-3 flex flex-wrap items-center gap-3 rounded-boton bg-activo py-2 pr-2 pl-5 text-sm text-sobre-activo shadow-flotante md:bottom-4"
                      >
                        <span className="cifra flex-1">
                          {seleccion.size} seleccionado{seleccion.size === 1 ? "" : "s"}
                        </span>
                        {filtros.bandeja === "pendientes" ? (
                          <>
                            <button type="button" onClick={() => aplicar("rescatar", [...seleccion])} className="rounded-control bg-coral-relleno px-4 py-1.5 font-semibold text-sobre-relleno">
                              Rescatar {seleccion.size} lead{seleccion.size === 1 ? "" : "s"}
                            </button>
                            <button type="button" onClick={() => aplicar("descartar", [...seleccion])} className="rounded-control px-3 py-1.5 hover:bg-sobre-activo/10">
                              Descartar
                            </button>
                          </>
                        ) : (
                          <button type="button" onClick={() => aplicar("restaurar", [...seleccion])} className="rounded-control px-3 py-1.5 hover:bg-sobre-activo/10">
                            Devolver a la fuga
                          </button>
                        )}
                        <button type="button" onClick={() => setSeleccion(new Set())} className="rounded-control px-3 py-1.5 text-sobre-activo/70 hover:bg-sobre-activo/10">
                          Limpiar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <SiguientePaso desde="/fugas" />
    </div>
  );
}

/** El modelo de pérdida (sliders y fórmula) en un Dialog: se consulta, no ocupa la vista. */
function ComoSeCalcula() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calculator data-icon="inline-start" />
          Cómo se calcula
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto p-5 sm:max-w-4xl md:p-6">
        <DialogHeader>
          <DialogTitle className="font-cifra text-lg font-semibold">Cómo se calcula el valor</DialogTitle>
          <DialogDescription>Cuánto vale lo que se queda en leads sin atender. Mueva los parámetros para ver cómo cambia.</DialogDescription>
        </DialogHeader>
        <LossModel />
      </DialogContent>
    </Dialog>
  );
}

function Vacio({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <Empty className="flex-none py-8">
      <EmptyHeader className="max-w-md">
        <EmptyMedia variant="icon">{icono}</EmptyMedia>
        <EmptyDescription>{children}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
