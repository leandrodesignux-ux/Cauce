"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { FilterBar } from "@/components/filtros/FilterBar";
import { useDatos } from "@/components/Proveedores";
import { ETAPAS, ORDEN_ETAPAS, TRANSICIONES } from "@/config/etapas";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import { NOMBRE_CORTO_POZA } from "@/config/pozas";
import { useFiltros } from "@/hooks/useFiltros";
import { useSeleccion } from "@/hooks/useSeleccion";
import { formatearEntero, formatearMxn, formatearMxnCorto, formatearPct, formatearPp, formatearRangoSemanas } from "@/lib/formato";
import {
  periodoAnterior,
  semanasEntre,
  serieSemanal,
  sumarDias,
  tasaTransicion,
  valorEnRiesgoPorPoza,
  valorEnRiesgoTotal,
  volumenPorEtapa,
} from "@/lib/selectors";
import { ContenidoPanel, encabezadoPanel } from "@/components/panel/ContenidoPanel";
import { StagePanel } from "@/components/panel/StagePanel";
import { useMedia } from "@/hooks/useMedia";
import { useInterfaz, useRescatadosHoy, useSesion } from "@/lib/stores";
import { DataTableCauce } from "./DataTableCauce";
import { RiverChart, type Activo, type PozaRio } from "./RiverChart";
import type { ContenidoTooltip } from "./TooltipCauce";

const SEMANAS_SERIE = 12;

export function VistaCauce() {
  const router = useRouter();
  const { flujo, fugas, leads } = useDatos();
  const rescatados = useSesion((s) => s.rescatados);
  const retornos = useMemo(() => {
    const porPoza = new Map<string, number>();
    for (const l of leads) if (l.fugaId && rescatados[l.id]) porPoza.set(l.fugaId, (porPoza.get(l.fugaId) ?? 0) + 1);
    return [...porPoza].map(([fugaId, cantidad]) => ({ fugaId, cantidad }));
  }, [leads, rescatados]);
  const { estado, filtros, restablecer } = useFiltros();
  const { seleccion, seleccionar } = useSeleccion();
  const rescatadosHoy = useRescatadosHoy();
  const escritorio = useMedia("(min-width: 1280px)", true);
  const tactil = useMedia("(hover: none)");
  const accion = tactil ? "Toque" : "Clic o Enter";
  const fijarPanelAbierto = useInterfaz((s) => s.fijarPanelAbierto);

  // En escritorio el panel empuja el río: la nav se compacta para dejarle lugar.
  useEffect(() => {
    fijarPanelAbierto(escritorio && seleccion !== null);
    return () => fijarPanelAbierto(false);
  }, [escritorio, seleccion, fijarPanelAbierto]);

  const anteriorFiltros = useMemo(() => ({ ...filtros, periodo: periodoAnterior(filtros.periodo) }), [filtros]);

  const datos = useMemo(() => {
    const v = volumenPorEtapa(flujo, filtros);
    const a = volumenPorEtapa(flujo, anteriorFiltros);
    const referencia = volumenPorEtapa(flujo, { periodo: filtros.periodo }).descubrimiento;
    const tasas = TRANSICIONES.map((t) => tasaTransicion(v, t));
    const tasasAnteriores = TRANSICIONES.map((t) => tasaTransicion(a, t));
    const deltas = tasas.map((t, i) => (t !== null && tasasAnteriores[i] !== null ? (t - tasasAnteriores[i]!) * 100 : null));
    const valores = valorEnRiesgoPorPoza(flujo, fugas, filtros);
    const pozas: PozaRio[] = fugas.map((f, i) => ({
      id: f.id,
      desde: ORDEN_ETAPAS.indexOf(f.desde),
      volumen: valores[i].volumen,
      valor: valores[i].valorMxn,
      nombre: NOMBRE_CORTO_POZA[f.id] ?? f.causa,
      causa: f.causa,
    }));
    return {
      volumen: ORDEN_ETAPAS.map((id) => v[id]),
      anterior: ORDEN_ETAPAS.map((id) => a[id]),
      referencia,
      tasas,
      tasasAnteriores,
      deltas,
      pozas,
      valorEnRiesgo: valorEnRiesgoTotal(valores),
    };
  }, [flujo, fugas, filtros, anteriorFiltros]);

  const semanas = semanasEntre(estado.periodo.desde, estado.periodo.hasta);

  const describir = useCallback(
    (a: Activo): ContenidoTooltip => {
      if (a.tipo === "poza") {
        const p = datos.pozas.find((x) => x.id === a.id)!;
        return {
          titulo: p.causa,
          subtitulo: `${ETAPAS[p.desde].nombre} → ${ETAPAS[p.desde + 1].nombre}`,
          filas: [
            { etiqueta: "Perdidos en el período", valor: formatearEntero(p.volumen) },
            { etiqueta: "Valor estimado", valor: formatearMxn(p.valor), tono: "laton" },
          ],
          pie:
            p.id === FUGA_MODELO_PERDIDA
              ? `Valuado con el modelo de pérdida (643 fantasmas). ${tactil ? "Toque" : "Clic"} para abrir en Fugas.`
              : `${tactil ? "Toque" : "Clic"} para abrir la poza en Fugas.`,
        };
      }
      if (a.tipo === "etapa") {
        const etapa = ETAPAS[a.indice];
        const actual = datos.volumen[a.indice];
        const previo = datos.anterior[a.indice];
        const cambio = previo > 0 ? ((actual - previo) / previo) * 100 : null;
        const serie = Array.from({ length: SEMANAS_SERIE }, (_, k) => {
          const semana = sumarDias(filtros.periodo.hasta, -7 * (SEMANAS_SERIE - 1 - k));
          return volumenPorEtapa(flujo, { ...filtros, periodo: { desde: semana, hasta: semana } })[etapa.id];
        });
        return {
          titulo: etapa.nombre,
          subtitulo: etapa.definicion,
          filas: [
            { etiqueta: "Volumen", valor: formatearEntero(actual) },
            { etiqueta: "Período anterior", valor: formatearEntero(previo), tono: "niebla" },
            {
              etiqueta: "Cambio",
              valor: cambio === null ? "—" : `${cambio > 0 ? "↑ +" : cambio < 0 ? "↓ −" : ""}${Math.abs(cambio).toFixed(1)} %`,
              tono: cambio === null || Math.abs(cambio) < 0.05 ? "niebla" : cambio > 0 ? "cauce" : "oxido",
            },
          ],
          serie: { valores: serie, etiqueta: "Volumen semanal, últimas 12 semanas" },
          pie: `${accion} para ver el detalle de la etapa.`,
        };
      }
      const t = TRANSICIONES[a.indice];
      const delta = datos.deltas[a.indice];
      const perdidos = datos.volumen[a.indice] - datos.volumen[a.indice + 1];
      return {
        titulo: `${ETAPAS[a.indice].nombre} → ${ETAPAS[a.indice + 1].nombre}`,
        filas: [
          { etiqueta: "Conversión", valor: formatearPct(datos.tasas[a.indice]) },
          { etiqueta: "Período anterior", valor: formatearPct(datos.tasasAnteriores[a.indice]), tono: "niebla" },
          {
            etiqueta: "Delta",
            valor: `${delta === null || Math.abs(delta) < 0.05 ? "" : delta > 0 ? "↑ " : "↓ "}${formatearPp(delta)}`,
            tono: delta === null || Math.abs(delta) < 0.05 ? "niebla" : delta > 0 ? "cauce" : "oxido",
          },
          { etiqueta: "No avanzan", valor: formatearEntero(perdidos), tono: "oxido" },
        ],
        serie: {
          valores: serieSemanal(flujo, filtros, t, SEMANAS_SERIE).map((p) => (p.tasa === null ? null : p.tasa * 100)),
          etiqueta: "Conversión semanal, últimas 12 semanas",
        },
        pie: `${accion} para ver el detalle de la transición.`,
      };
    },
    [datos, flujo, filtros, accion, tactil],
  );

  const seleccionIndice = useMemo(() => {
    if (!seleccion) return null;
    return seleccion.tipo === "etapa"
      ? { tipo: "etapa" as const, indice: ORDEN_ETAPAS.indexOf(seleccion.etapa) }
      : { tipo: "transicion" as const, indice: ORDEN_ETAPAS.indexOf(seleccion.desde) };
  }, [seleccion]);

  const alSeleccionar = useCallback(
    (s: { tipo: "etapa" | "transicion"; indice: number } | null) => {
      if (!s) return seleccionar(null);
      if (s.tipo === "etapa") return seleccionar({ tipo: "etapa", etapa: ORDEN_ETAPAS[s.indice] });
      const t = TRANSICIONES[s.indice];
      seleccionar({ tipo: "transicion", desde: t.desde, hacia: t.hacia });
    },
    [seleccionar],
  );

  /** Cierra el panel y devuelve el foco al elemento del río que lo abrió. */
  const cerrarPanel = useCallback(() => {
    if (!seleccion) return;
    const clave =
      seleccion.tipo === "etapa"
        ? `etapa:${ORDEN_ETAPAS.indexOf(seleccion.etapa)}`
        : `transicion:${ORDEN_ETAPAS.indexOf(seleccion.desde)}`;
    seleccionar(null);
    requestAnimationFrame(() => document.querySelector<SVGElement>(`[data-clave="${clave}"]`)?.focus());
  }, [seleccion, seleccionar]);

  const encabezado = seleccion ? encabezadoPanel(seleccion) : null;

  return (
    <div className="flex flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="sr-only">El cauce: journey de adquisición</h1>
        <div className="border-b border-linea px-4 py-3 md:px-6 xl:px-8">
          <FilterBar />
        </div>
  
        <section aria-label="Contexto del período" className="flex flex-wrap items-end gap-x-10 gap-y-4 px-4 pt-6 md:px-6 xl:px-8">
          <Cifra etiqueta="Valor en riesgo" valor={formatearMxnCorto(datos.valorEnRiesgo)} tono="text-laton-texto" />
          <Cifra etiqueta="Rescatados hoy" valor={formatearEntero(rescatadosHoy)} tono="text-cauce-texto" />
          <p className="hidden text-sm text-niebla md:ml-auto md:block">
            {formatearRangoSemanas(estado.periodo.desde, estado.periodo.hasta)} · {semanas} {semanas === 1 ? "semana" : "semanas"}
          </p>
        </section>
  
        <section aria-label={estado.tabla ? "Cauce en tabla" : "Cauce"} className="px-4 pb-10 pt-8 md:px-6 xl:px-8">
          {datos.volumen[0] === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-panel border border-dashed border-linea-fuerte px-6 py-16 text-center">
              <p className="font-cifra text-lg font-semibold">El cauce está seco con estos filtros</p>
              <p className="max-w-md text-sm text-niebla">
                No hay sesiones para esta combinación de canal, sector y estado en el período. Pruebe ampliar a 90 días o quitar un filtro.
              </p>
              <button
                type="button"
                onClick={restablecer}
                className="mt-2 inline-flex h-9 items-center rounded-control border border-cauce bg-cauce px-4 text-sm font-medium text-sobre-cauce"
              >
                Restablecer filtros
              </button>
            </div>
          ) : estado.tabla ? (
            <DataTableCauce
              volumen={datos.volumen}
              anterior={estado.comparar ? datos.anterior : null}
              tasas={datos.tasas}
              deltas={datos.deltas}
              pozas={datos.pozas}
            />
          ) : (
            <>
              <RiverChart
                volumen={datos.volumen}
                anterior={estado.comparar ? datos.anterior : null}
                referencia={datos.referencia}
                tasas={datos.tasas}
                deltas={datos.deltas}
                pozas={datos.pozas}
                seleccion={seleccionIndice}
                onSeleccionar={alSeleccionar}
                onAbrirPoza={(id) => router.push(`/fugas?poza=${id}`)}
                describir={describir}
                retornos={retornos}
              />
              <Leyenda comparar={estado.comparar} retorno={retornos.length > 0} />
            </>
          )}
        </section>
      </div>
      <StagePanel
        abierto={seleccion !== null}
        clave={seleccion ? `${seleccion.tipo}:${seleccion.tipo === "etapa" ? seleccion.etapa : seleccion.desde}` : null}
        titulo={encabezado?.titulo ?? ""}
        subtitulo={encabezado?.subtitulo}
        onCerrar={cerrarPanel}
      >
        {seleccion && <ContenidoPanel seleccion={seleccion} filtros={filtros} tabla={estado.tabla} />}
      </StagePanel>
    </div>
  );
}

function Cifra({ etiqueta, valor, tono }: { etiqueta: string; valor: string; tono: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-niebla">{etiqueta}</span>
      <span className={`cifra text-2xl font-semibold ${tono}`}>{valor}</span>
    </div>
  );
}

function Leyenda({ comparar, retorno }: { comparar: boolean; retorno: boolean }) {
  return (
    <ul aria-label="Leyenda" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-linea pt-4 text-xs text-niebla">
      <li className="flex items-center gap-2">
        <span aria-hidden className="h-2.5 w-6 rounded-full bg-cauce" />
        Volumen que avanza (ancho según el volumen, escala de raíz cuadrada)
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden className="h-4 w-0.5 rounded-full bg-oxido" />
        Fuga hacia una poza
      </li>
      <li className="flex items-center gap-2">
        <span aria-hidden className="cifra font-semibold text-laton-texto">$</span>
        Valor estimado en MXN
      </li>
      {retorno && (
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-1 w-6 rounded-full bg-cauce" />
          Leads rescatados que vuelven al cauce
        </li>
      )}
      {comparar && (
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-0 w-6 border-t border-dashed border-niebla" />
          Período anterior
        </li>
      )}
      <li className="md:ml-auto">
        <span className="hidden [@media(hover:hover)]:inline">Pase el cursor o use Tab para ver el detalle; Enter abre el panel.</span>
        <span className="[@media(hover:hover)]:hidden">Toque una etapa o una tasa para ver el detalle.</span>
      </li>
    </ul>
  );
}
