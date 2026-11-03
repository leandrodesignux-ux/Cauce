"use client";

import { Keyboard } from "lucide-react";
import Link from "next/link";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { useDatos } from "@/components/Proveedores";
import { nombreEtapa } from "@/config/etapas";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import { NOMBRE_CORTO_POZA } from "@/config/pozas";
import { formatearEntero, formatearMxn } from "@/lib/formato";
import { type Banda, type LeadFeed, type RangoAntiguedad, banda, diasSinActividad, rangoAntiguedad } from "@/lib/leads";
import { periodoDesdePreset, valorEnRiesgoPorPoza } from "@/lib/selectors";
import { useRescatadosHoy, useSesion } from "@/lib/stores";
import { LeadFeedItem, type Accion, type EstadoLead } from "./LeadFeedItem";
import { LossModel } from "./LossModel";
import { Toast, type DatosToast } from "./Toast";
import { type Bandeja, useFiltrosFugas } from "./useFiltrosFugas";

const BANDAS: { id: Banda; nombre: string }[] = [
  { id: "alto", nombre: "Alto ≥70" },
  { id: "medio", nombre: "Medio 40–69" },
  { id: "bajo", nombre: "Bajo <40" },
];
const RANGOS: { id: RangoAntiguedad; nombre: string }[] = [
  { id: "critica", nombre: "≤3 días · ventana crítica" },
  { id: "reciente", nombre: "4–14 días" },
  { id: "antigua", nombre: "Más de 14 días" },
];
const BANDEJAS: { id: Bandeja; nombre: string }[] = [
  { id: "pendientes", nombre: "Pendientes" },
  { id: "rescatados", nombre: "Rescatados" },
  { id: "descartados", nombre: "Descartados" },
];
const ESTADO_DE_BANDEJA: Record<Bandeja, EstadoLead> = { pendientes: "pendiente", rescatados: "rescatado", descartados: "descartado" };

export function VistaFugas({ leads }: { leads: LeadFeed[] }) {
  const { flujo, fugas, experimentos, ultimaSemana } = useDatos();
  const { filtros, actualizar } = useFiltrosFugas(
    useMemo(() => fugas.map((f) => f.id), [fugas]),
    FUGA_MODELO_PERDIDA,
  );
  const rescatados = useSesion((s) => s.rescatados);
  const descartados = useSesion((s) => s.descartados);
  const { rescatar, descartar, restaurar } = useSesion.getState();
  const rescatadosHoy = useRescatadosHoy();

  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [enfocado, setEnfocado] = useState<string | null>(null);
  const [ultimaAccion, setUltimaAccion] = useState<Accion>("rescatar");
  const [toast, setToast] = useState<DatosToast | null>(null);
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

  const cerrarToast = useCallback(() => setToast(null), []);

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
          ? `${n} lead${plural} rescatado${plural}: vuelve${n === 1 ? "" : "n"} al cauce en ${nombreEtapa(poza.hacia)}.`
          : accion === "descartar"
            ? `${n} lead${plural} descartado${plural}.`
            : `${n} lead${plural} devuelto${plural} a la poza.`;
      setToast({ id: Date.now(), mensaje, accion: accion === "restaurar" ? undefined : { etiqueta: "Deshacer", alHacer: () => restaurar(ids) } });
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

  // Atajos: J/K para moverse (Shift extiende la selección), R rescata, D descarta, Esc limpia la selección.
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      const destino = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || destino.closest("input, textarea, select, [role=dialog], [cmdk-root]")) return;
      const tecla = e.key.toLowerCase();
      const indice = visibles.findIndex((l) => l.id === enfocado);
      if (tecla === "j" || tecla === "k") {
        e.preventDefault();
        const siguiente = visibles[Math.max(0, Math.min(visibles.length - 1, indice === -1 ? 0 : indice + (tecla === "j" ? 1 : -1)))];
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
  }, [visibles, enfocado, seleccion, filtros.bandeja, aplicar, enfocar]);

  // Llegada desde ⌘K o desde el cauce con ?lead=: lo lleva a la vista y le da el foco.
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
    <div className="flex flex-col gap-8 px-4 py-6 md:px-6 xl:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-cifra text-2xl font-semibold">Pozas y rescate</h1>
          <p className="mt-1 max-w-xl text-sm text-niebla">
            Lo que se escapa del cauce, cuánto vale y qué leads con intención conviene rescatar primero.
          </p>
        </div>
        <dl className="flex gap-8">
          <div>
            <dt className="text-sm text-niebla">Rescatados hoy</dt>
            <dd className="cifra text-2xl font-semibold text-cauce">{formatearEntero(rescatadosHoy)}</dd>
          </div>
          <div>
            <dt className="text-sm text-niebla">Pendientes en pozas</dt>
            <dd className="cifra text-2xl font-semibold">{formatearEntero(Object.values(pendientesPorPoza).reduce((s, n) => s + n, 0))}</dd>
          </div>
        </dl>
      </header>

      <LossModel />

      <section aria-label="Pozas" className="flex flex-col gap-4">
        <Pestanas
          pozas={fugas.map((f) => ({ id: f.id, nombre: NOMBRE_CORTO_POZA[f.id] ?? f.causa, pendientes: pendientesPorPoza[f.id] ?? null }))}
          activa={filtros.poza}
          onCambiar={cambiarPoza}
        />

        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <p className="text-sm">
            <span className="font-medium">{poza.causa}</span>
            <span className="text-niebla">
              {" "}
              · {nombreEtapa(poza.desde)} → {nombreEtapa(poza.hacia)}
            </span>
          </p>
          <p className="cifra text-sm text-niebla">
            Últimos 30 días: {formatearEntero(valorPoza.volumen)} perdidos ·{" "}
            <span className="font-semibold text-laton">{formatearMxn(valorPoza.valorMxn)}</span>
          </p>
        </div>

        {enPoza.length === 0 ? (
          <Vacio>
            Esta poza mide sesiones anónimas: no hay leads con datos de contacto para rescatar.
            {experimento && (
              <>
                {" "}
                El experimento{" "}
                <Link href={`/experimentos?exp=${experimento.id}`} className="text-cauce underline underline-offset-2">
                  {experimento.nombre}
                </Link>{" "}
                ataca esta fuga.
              </>
            )}
          </Vacio>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <GrupoChips etiqueta="Bandeja">
                {BANDEJAS.map((b) => (
                  <Chip key={b.id} activo={filtros.bandeja === b.id} onClick={() => actualizar({ bandeja: b.id })}>
                    {b.nombre}
                    <span className="cifra text-xs opacity-70">{enPoza.filter((l) => estadoDe(l.id) === ESTADO_DE_BANDEJA[b.id]).length}</span>
                  </Chip>
                ))}
              </GrupoChips>
              <div className="flex flex-wrap gap-x-6 gap-y-3">
                <GrupoChips etiqueta="Score">
                  {BANDAS.map((b) => (
                    <Chip key={b.id} activo={filtros.banda === b.id} onClick={() => actualizar({ banda: filtros.banda === b.id ? null : b.id })}>
                      {b.nombre}
                    </Chip>
                  ))}
                </GrupoChips>
                <GrupoChips etiqueta="Antigüedad">
                  {RANGOS.map((r) => (
                    <Chip
                      key={r.id}
                      activo={filtros.antiguedad === r.id}
                      destacado={r.id === "critica"}
                      onClick={() => actualizar({ antiguedad: filtros.antiguedad === r.id ? null : r.id })}
                    >
                      {r.nombre}
                    </Chip>
                  ))}
                </GrupoChips>
              </div>
            </div>

            <p className="hidden items-center gap-2 text-xs text-niebla md:flex">
              <Keyboard className="size-3.5" aria-hidden />
              <Tecla>J</Tecla>
              <Tecla>K</Tecla> para moverse · <Tecla>R</Tecla> rescatar · <Tecla>D</Tecla> descartar · <Tecla>Shift</Tecla> para seleccionar
              varios · <Tecla>Esc</Tecla> limpia la selección
            </p>

            {visibles.length === 0 ? (
              <Vacio>
                {filtros.bandeja === "pendientes"
                  ? `No hay ${filtrosActivos ? "leads con esos filtros" : "leads pendientes"} en esta poza.`
                  : `Todavía no hay leads ${filtros.bandeja} en esta poza.`}{" "}
                {filtrosActivos ? (
                  <button type="button" onClick={() => actualizar({ banda: null, antiguedad: null })} className="text-cauce underline underline-offset-2">
                    Quitar filtros de score y antigüedad
                  </button>
                ) : filtros.bandeja !== "pendientes" ? (
                  <button type="button" onClick={() => actualizar({ bandeja: "pendientes" })} className="text-cauce underline underline-offset-2">
                    Ver pendientes
                  </button>
                ) : null}
              </Vacio>
            ) : (
              <div className="relative">
                <ul aria-label={`Leads en ${NOMBRE_CORTO_POZA[poza.id] ?? poza.causa}`} className="overflow-hidden rounded-panel border border-linea bg-papel">
                  <AnimatePresence initial={false} custom={ultimaAccion}>
                    {visibles.map((l) => (
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

                {seleccion.size > 0 && (
                  <div
                    role="region"
                    aria-label="Acciones para la selección"
                    className="sticky bottom-[calc(var(--alto-barra-movil)+12px)] z-10 mt-3 flex flex-wrap items-center gap-3 rounded-panel bg-tinta px-4 py-3 text-sm text-concreto shadow-flotante md:bottom-4"
                  >
                    <span className="cifra flex-1">
                      {seleccion.size} seleccionado{seleccion.size === 1 ? "" : "s"}
                    </span>
                    {filtros.bandeja === "pendientes" ? (
                      <>
                        <button type="button" onClick={() => aplicar("rescatar", [...seleccion])} className="rounded-control bg-cauce px-3 py-1.5 font-medium text-papel">
                          Rescatar {seleccion.size} lead{seleccion.size === 1 ? "" : "s"}
                        </button>
                        <button type="button" onClick={() => aplicar("descartar", [...seleccion])} className="rounded-control px-3 py-1.5 hover:bg-concreto/10">
                          Descartar
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => aplicar("restaurar", [...seleccion])} className="rounded-control px-3 py-1.5 hover:bg-concreto/10">
                        Devolver a la poza
                      </button>
                    )}
                    <button type="button" onClick={() => setSeleccion(new Set())} className="rounded-control px-3 py-1.5 text-concreto/70 hover:bg-concreto/10">
                      Limpiar
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      <Toast toast={toast} onCerrar={cerrarToast} />
    </div>
  );
}

function Pestanas({
  pozas,
  activa,
  onCambiar,
}: {
  pozas: { id: string; nombre: string; pendientes: number | null }[];
  activa: string;
  onCambiar: (id: string) => void;
}) {
  const alPresionar = (e: ReactKeyboardEvent) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const i = pozas.findIndex((p) => p.id === activa);
    const siguiente = pozas[(i + delta + pozas.length) % pozas.length];
    onCambiar(siguiente.id);
    requestAnimationFrame(() => document.getElementById(`pestana-${siguiente.id}`)?.focus());
  };
  return (
    <div role="tablist" aria-label="Pozas" onKeyDown={alPresionar} className="-mx-4 flex gap-1 overflow-x-auto border-b border-linea px-4 md:mx-0 md:px-0">
      {pozas.map((p) => (
        <button
          key={p.id}
          id={`pestana-${p.id}`}
          role="tab"
          aria-selected={p.id === activa}
          tabIndex={p.id === activa ? 0 : -1}
          onClick={() => onCambiar(p.id)}
          className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm motion-safe:transition-colors ${
            p.id === activa ? "border-oxido font-medium text-tinta" : "border-transparent text-niebla hover:text-tinta"
          }`}
        >
          {p.nombre}
          {p.pendientes !== null && (
            <span className={`cifra rounded-full px-1.5 text-xs ${p.id === activa ? "bg-oxido-suave text-oxido" : "bg-linea text-niebla"}`}>{p.pendientes}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function GrupoChips({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={etiqueta} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs text-niebla">{etiqueta}</span>
      {children}
    </div>
  );
}

function Chip({ activo, destacado, onClick, children }: { activo: boolean; destacado?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-control border px-3 text-sm motion-safe:transition-colors ${
        activo
          ? destacado
            ? "border-laton bg-laton text-papel"
            : "border-cauce bg-cauce-suave text-cauce"
          : destacado
            ? "border-laton text-laton hover:bg-laton/10"
            : "border-linea-fuerte hover:border-niebla hover:bg-papel"
      }`}
    >
      {children}
    </button>
  );
}

function Tecla({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-linea px-1 font-sans text-[length:var(--texto-xs)]">{children}</kbd>;
}

function Vacio({ children }: { children: ReactNode }) {
  return <p className="rounded-panel border border-dashed border-linea-fuerte px-4 py-8 text-center text-sm text-niebla">{children}</p>;
}
