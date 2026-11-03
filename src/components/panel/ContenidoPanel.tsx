"use client";

import { ArrowUpRight, Droplet } from "lucide-react";
import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { useDatos } from "@/components/Proveedores";
import { CANALES, ESTADOS, SECTORES } from "@/config/dimensiones";
import { ETAPAS, NIVELES_LEAD, ORDEN_ETAPAS, PRIORIDADES, TRANSICIONES, nombreEtapa } from "@/config/etapas";
import { ETIQUETA_ESTADO_EXPERIMENTO, TONO_ESTADO_EXPERIMENTO } from "@/config/experimentos";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import type { Seleccion } from "@/hooks/useSeleccion";
import { formatearEntero, formatearMxn, formatearPct, formatearPp, formatearSemanaCorta } from "@/lib/formato";
import {
  type Filtros,
  periodoAnterior,
  serieSemanal,
  sumarDias,
  tasaTransicion,
  valorEnRiesgoPorPoza,
  volumenPorEtapa,
} from "@/lib/selectors";
import type { Transicion } from "@/lib/tipos";
import { Desglose, type GrupoDesglose } from "./Desglose";
import { TendenciaSemanal, type PuntoSerie } from "./TendenciaSemanal";

const SEMANAS = 12;

/** Título y subtítulo del panel según la selección. */
export function encabezadoPanel(s: NonNullable<Seleccion>): { titulo: string; subtitulo: string } {
  if (s.tipo === "etapa") {
    const etapa = ETAPAS.find((e) => e.id === s.etapa)!;
    return { titulo: etapa.nombre, subtitulo: etapa.definicion };
  }
  return { titulo: `${nombreEtapa(s.desde)} → ${nombreEtapa(s.hacia)}`, subtitulo: "Conversión entre etapas" };
}

export function ContenidoPanel({ seleccion, filtros, tabla }: { seleccion: NonNullable<Seleccion>; filtros: Filtros; tabla: boolean }) {
  const { flujo, fugas, experimentos } = useDatos();
  const esEtapa = seleccion.tipo === "etapa";
  const etapa = esEtapa ? seleccion.etapa : seleccion.desde;
  const transicion = useMemo<Transicion | null>(
    () => (seleccion.tipo === "etapa" ? null : { desde: seleccion.desde, hacia: seleccion.hacia }),
    [seleccion],
  );

  const d = useMemo(() => {
    const actual = volumenPorEtapa(flujo, filtros);
    const anterior = volumenPorEtapa(flujo, { ...filtros, periodo: periodoAnterior(filtros.periodo) });
    const semanas = Array.from({ length: SEMANAS }, (_, k) => sumarDias(filtros.periodo.hasta, -7 * (SEMANAS - 1 - k)));

    const serie: PuntoSerie[] = transicion
      ? serieSemanal(flujo, filtros, transicion, SEMANAS).map((p) => ({ semana: p.semana, valor: p.tasa === null ? null : p.tasa * 100 }))
      : semanas.map((semana) => ({ semana, valor: volumenPorEtapa(flujo, { ...filtros, periodo: { desde: semana, hasta: semana } })[etapa] }));

    // Desglose: cada valor de la dimensión dentro de los filtros activos.
    const dimensiones = [
      { clave: "canales", nombre: "Canal", opciones: CANALES, elegidos: filtros.canales },
      { clave: "sectores", nombre: "Sector", opciones: SECTORES, elegidos: filtros.sectores },
      { clave: "estados", nombre: "Estado", opciones: ESTADOS, elegidos: filtros.estados },
    ] as const;
    const grupos: GrupoDesglose[] = dimensiones.map((dim) => {
      const opciones = dim.elegidos?.length ? dim.opciones.filter((o) => (dim.elegidos as readonly string[]).includes(o.id)) : dim.opciones;
      return {
        clave: dim.clave,
        nombre: dim.nombre,
        filas: opciones.map((o) => {
          const v = volumenPorEtapa(flujo, { ...filtros, [dim.clave]: [o.id] });
          if (transicion) {
            return { id: o.id, nombre: o.nombre, valor: tasaTransicion(v, transicion), detalle: `${formatearEntero(v[transicion.desde])} entran` };
          }
          const total = actual[etapa];
          return { id: o.id, nombre: o.nombre, valor: v[etapa], detalle: total ? `${((v[etapa] / total) * 100).toFixed(1)} %` : "—" };
        }),
      };
    });

    const valores = new Map(valorEnRiesgoPorPoza(flujo, fugas, filtros).map((p) => [p.fugaId, p]));
    const fugasAqui = fugas.filter((f) => f.desde === etapa).map((f) => ({ ...f, poza: valores.get(f.id)! }));
    const expAqui = experimentos.filter((e) =>
      transicion ? e.transicion.desde === transicion.desde : e.transicion.desde === etapa || e.transicion.hacia === etapa,
    );
    const marcadores = expAqui
      .filter((e) => semanas.includes(e.despliegue))
      .map((e) => ({ semana: e.despliegue, etiqueta: `Despliegue: ${e.nombre.length > 26 ? `${e.nombre.slice(0, 25)}…` : e.nombre}` }));

    return { actual, anterior, serie, grupos, fugasAqui, expAqui, marcadores };
  }, [flujo, fugas, experimentos, filtros, etapa, transicion]);

  const indice = ORDEN_ETAPAS.indexOf(etapa);
  const cifras: { etiqueta: string; valor: string; tono?: string }[] = [];
  let referencia: number | null = null;
  if (transicion) {
    const tasa = tasaTransicion(d.actual, transicion);
    const previa = tasaTransicion(d.anterior, transicion);
    const delta = tasa !== null && previa !== null ? (tasa - previa) * 100 : null;
    referencia = tasa;
    cifras.push(
      { etiqueta: "Conversión", valor: formatearPct(tasa) },
      { etiqueta: "Vs. período anterior", valor: `${flecha(delta)}${formatearPp(delta)}`, tono: tonoDelta(delta) },
      { etiqueta: "No avanzan", valor: formatearEntero(d.actual[transicion.desde] - d.actual[transicion.hacia]), tono: "text-oxido" },
    );
  } else {
    const v = d.actual[etapa];
    const previo = d.anterior[etapa];
    const cambio = previo > 0 ? ((v - previo) / previo) * 100 : null;
    const entrada = indice > 0 ? tasaTransicion(d.actual, TRANSICIONES[indice - 1]) : null;
    const salida = indice < ORDEN_ETAPAS.length - 1 ? tasaTransicion(d.actual, TRANSICIONES[indice]) : null;
    cifras.push(
      { etiqueta: "Volumen", valor: formatearEntero(v) },
      {
        etiqueta: "Vs. período anterior",
        valor: cambio === null ? "—" : `${flecha(cambio)}${cambio > 0 ? "+" : cambio < 0 ? "−" : ""}${Math.abs(cambio).toFixed(1)} %`,
        tono: tonoDelta(cambio),
      },
      { etiqueta: indice > 0 ? "Conversión de entrada" : "Conversión de salida", valor: formatearPct(indice > 0 ? entrada : salida) },
    );
  }

  const formatoSerie = transicion ? (v: number) => `${v.toFixed(1)} %` : (v: number) => formatearEntero(v);
  const formatoDesglose = transicion ? (v: number) => formatearPct(v) : (v: number) => formatearEntero(v);
  const primero = d.serie.find((p) => p.valor !== null)?.valor;
  const ultimo = [...d.serie].reverse().find((p) => p.valor !== null)?.valor;

  return (
    <div className="flex flex-col gap-8">
      <dl className="grid grid-cols-3 items-end gap-3">
        {cifras.map((c) => (
          <div key={c.etiqueta} className="flex flex-col gap-1">
            <dt className="text-xs text-niebla">{c.etiqueta}</dt>
            <dd className={`cifra whitespace-nowrap text-lg font-semibold ${c.tono ?? ""}`}>{c.valor}</dd>
          </div>
        ))}
      </dl>

      {etapa === "calificacion" && esEtapa && (
        <Seccion titulo="Niveles y prioridades">
          <ul className="flex flex-col gap-1.5 text-sm">
            {[...NIVELES_LEAD, ...PRIORIDADES].map((n) => (
              <li key={n.id} className="flex gap-3">
                <span className="cifra w-10 font-medium">{n.id}</span>
                <span className="text-niebla">{n.definicion}</span>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      <Seccion titulo={transicion ? "Conversión semanal" : "Volumen semanal"} nota="Últimas 12 semanas">
        {tabla ? (
          <table className="w-full text-sm">
            <tbody>
              {d.serie.map((p) => (
                <tr key={p.semana} className="border-b border-linea last:border-0">
                  <th scope="row" className="py-1.5 text-left font-normal">Semana del {formatearSemanaCorta(p.semana)}</th>
                  <td className="cifra py-1.5 text-right">{p.valor === null ? "—" : formatoSerie(p.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <TendenciaSemanal
            puntos={d.serie}
            formato={formatoSerie}
            marcadores={d.marcadores}
            descripcion={`${transicion ? "Conversión" : "Volumen"} semanal: de ${primero == null ? "—" : formatoSerie(primero)} a ${
              ultimo == null ? "—" : formatoSerie(ultimo)
            } en 12 semanas`}
          />
        )}
      </Seccion>

      <Seccion titulo="Desglose" nota={transicion ? "Conversión por segmento" : "Volumen por segmento"}>
        <Desglose
          grupos={d.grupos}
          formato={formatoDesglose}
          referencia={referencia}
          etiquetaReferencia={transicion ? "Conversión del total filtrado" : undefined}
          tabla={tabla}
        />
      </Seccion>

      <Seccion titulo={transicion ? "Fugas de esta transición" : `Fugas al salir de ${nombreEtapa(etapa)}`}>
        {d.fugasAqui.length === 0 ? (
          <Vacio>No hay pozas registradas aquí. El volumen que no avanza se reparte sin una causa atribuida.</Vacio>
        ) : (
          <ul className="flex flex-col divide-y divide-linea rounded-panel border border-linea">
            {d.fugasAqui.map((f) => (
              <li key={f.id}>
                <Link href={`/fugas?poza=${f.id}`} className="group flex items-center gap-3 px-3 py-3 hover:bg-concreto">
                  <Droplet className="size-4 shrink-0 text-oxido" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm">{f.causa}</span>
                    <span className="cifra text-xs text-niebla">
                      {formatearEntero(f.poza.volumen)} perdidos
                      {f.id === FUGA_MODELO_PERDIDA ? " · modelo de pérdida" : ""}
                    </span>
                  </span>
                  <span className="cifra text-sm font-semibold text-laton">{formatearMxn(f.poza.valorMxn)}</span>
                  <ArrowUpRight className="size-4 shrink-0 text-niebla group-hover:text-tinta" aria-hidden />
                  <span className="sr-only">Abrir en Fugas</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <Seccion titulo="Experimentos">
        {d.expAqui.length === 0 ? (
          <Vacio>
            Ningún experimento apunta aquí todavía.{" "}
            <Link href="/experimentos" className="text-cauce underline underline-offset-2">
              Ver el registro de hipótesis
            </Link>
          </Vacio>
        ) : (
          <ul className="flex flex-col gap-3">
            {d.expAqui.map((e) => (
              <li key={e.id}>
                <Link href={`/experimentos?exp=${e.id}`} className="group block rounded-panel border border-linea p-3 hover:border-linea-fuerte hover:bg-concreto">
                  <span className="flex items-start gap-2">
                    <span className="flex-1 text-sm font-medium">{e.nombre}</span>
                    <span className={`shrink-0 rounded-control border px-1.5 text-xs ${TONO_ESTADO_EXPERIMENTO[e.estado]}`}>
                      {ETIQUETA_ESTADO_EXPERIMENTO[e.estado]}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-niebla">{e.hipotesis}</span>
                  <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span className="whitespace-nowrap">
                      <span className="text-niebla">Predicho </span>
                      <span className="cifra font-medium">{formatearPp(e.prediccionPp)}</span>
                    </span>
                    <span className="whitespace-nowrap">
                      <span className="text-niebla">Observado </span>
                      <span className={`cifra font-medium ${e.observadoPp === undefined ? "text-niebla" : tonoDelta(e.observadoPp)}`}>
                        {e.observadoPp === undefined ? "sin lectura" : formatearPp(e.observadoPp)}
                      </span>
                    </span>
                    <span className="whitespace-nowrap text-niebla">Despliegue {formatearSemanaCorta(e.despliegue)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Seccion>
    </div>
  );
}

function Seccion({ titulo, nota, children }: { titulo: string; nota?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">{titulo}</h3>
        {nota && <span className="text-xs text-niebla">{nota}</span>}
      </div>
      {children}
    </section>
  );
}

function Vacio({ children }: { children: ReactNode }) {
  return <p className="rounded-panel border border-dashed border-linea-fuerte px-3 py-4 text-sm text-niebla">{children}</p>;
}

function tonoDelta(v: number | null): string {
  if (v === null || Math.abs(v) < 0.05) return "text-niebla";
  return v > 0 ? "text-cauce" : "text-oxido";
}

function flecha(v: number | null): string {
  if (v === null || Math.abs(v) < 0.05) return "";
  return v > 0 ? "↑ " : "↓ ";
}
