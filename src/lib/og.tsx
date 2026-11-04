// Imágenes Open Graph (1200 × 630) generadas en build con next/og. Solo flexbox y SVG inline.

import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { calcularGeometria } from "@/components/cauce/geometria";
import { COLOR } from "@/config/colores";
import { ORDEN_ETAPAS } from "@/config/etapas";
import { datosCompactos, fugas, obtenerLeads } from "./datos";
import { expandirFlujo } from "./datos-cliente";
import {
  modeloPerdida,
  parametrosPerdidaIniciales,
  periodoDesdePreset,
  valorEnRiesgoPorPoza,
  valorEnRiesgoTotal,
  volumenPorEtapa,
} from "./selectors";

export const TAMANO_OG = { width: 1200, height: 630 };

function Marco({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundImage: `linear-gradient(155deg, ${COLOR.fondoA}, ${COLOR.fondoB} 55%, ${COLOR.fondoC})`, color: COLOR.tinta, padding: 64 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <svg width="40" height="40" viewBox="0 0 24 24">
          <path d="M2 4.5C9 4.5 11.5 9 22 10v4C11.5 15 9 19.5 2 19.5z" fill={COLOR.azulRelleno} />
          <circle cx="14.5" cy="21" r="1.6" fill={COLOR.coral} />
        </svg>
        <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>Cauce</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 20,
            color: COLOR.tinta2,
            border: `2px dashed ${COLOR.tinta2}`,
            borderRadius: 8,
            padding: "6px 14px",
          }}
        >
          Prototipo con datos demo
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 44 }}>
        <span style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.05, letterSpacing: -1.5 }}>{titulo}</span>
        <span style={{ fontSize: 26, color: COLOR.tinta2, marginTop: 16, lineHeight: 1.35, maxWidth: 900 }}>{subtitulo}</span>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "flex-end" }}>{children}</div>
    </div>
  );
}

function volumenes30d() {
  const flujo = expandirFlujo(datosCompactos());
  const ultima = flujo.reduce((m, f) => (f.semana > m ? f.semana : m), "");
  const filtros = { periodo: periodoDesdePreset("30d", ultima) };
  return { flujo, filtros, volumen: volumenPorEtapa(flujo, filtros) };
}

/** El río real de los últimos 30 días, con sus hilos de fuga. */
export function imagenCauce() {
  const { flujo, filtros, volumen } = volumenes30d();
  const pozas = valorEnRiesgoPorPoza(flujo, fugas, filtros);
  const geo = calcularGeometria({
    orientacion: "horizontal",
    ancho: 1072,
    volumen: ORDEN_ETAPAS.map((e) => volumen[e]),
    anterior: null,
    referencia: volumen.descubrimiento,
    pozas: fugas.map((f, i) => ({ id: f.id, desde: ORDEN_ETAPAS.indexOf(f.desde), volumen: pozas[i].volumen, valor: pozas[i].valorMxn })),
  });
  // Recorte del río a las pozas, aplastado en vertical para que entre debajo del título.
  const y0 = geo.centro - geo.grosorMax / 2 - 4;
  const y1 = Math.max(...geo.pozas.map((p) => p.y + p.ry + 4));
  return new ImageResponse(
    (
      <Marco titulo="Recorrido de adquisición" subtitulo={`De la primera visita al contrato, con las fugas a la vista: ${formatoM(valorEnRiesgoTotal(pozas))} en riesgo en 30 días.`}>
        <svg width={1072} height={230} viewBox={`0 ${y0} 1072 ${y1 - y0}`} preserveAspectRatio="none">
          {geo.pozas.map((p) => (
            <path key={p.id} d={p.hilo} fill="none" stroke={COLOR.coral} strokeWidth={p.grosorHilo} strokeLinecap="round" />
          ))}
          <path d={geo.rio} fill={COLOR.azulRelleno} />
          {geo.pozas.map((p) => (
            <ellipse key={p.id} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill={COLOR.coralSuave} stroke={COLOR.coral} strokeWidth={2} />
          ))}
        </svg>
      </Marco>
    ),
    TAMANO_OG,
  );
}

/** Rescate de leads: el monto de los leads sin atender (modelo de pérdida) y los leads en fugas. */
export function imagenFugas() {
  const leads = obtenerLeads().filter((l) => l.fugaId);
  const monto = modeloPerdida(parametrosPerdidaIniciales()).montoMxn;
  return new ImageResponse(
    (
      <Marco titulo="Rescate de leads" subtitulo="Cuánto vale cada fuga y qué leads con intención conviene rescatar primero.">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 56, width: "100%" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 24, color: COLOR.tinta2 }}>Valor en riesgo en leads sin atender</span>
            <span style={{ fontSize: 96, fontWeight: 700, color: COLOR.tinta, letterSpacing: -2 }}>{`$${monto.toLocaleString("en-US")} MXN`}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: "auto", alignItems: "flex-end" }}>
            <span style={{ fontSize: 24, color: COLOR.tinta2 }}>Leads en fugas</span>
            <span style={{ fontSize: 72, fontWeight: 700, color: COLOR.azulRelleno }}>{leads.length}</span>
          </div>
        </div>
      </Marco>
    ),
    TAMANO_OG,
  );
}

/** El registro de hipótesis como barras de timeline. */
export function imagenExperimentos(experimentos: { nombre: string; estado: string; despliegue: string; ventanaSemanas: [number, number] }[]) {
  const ordenados = [...experimentos].sort((a, b) => a.despliegue.localeCompare(b.despliegue));
  const inicio = Date.parse(ordenados[0].despliegue);
  const fin = Math.max(...ordenados.map((e) => Date.parse(e.despliegue) + (e.ventanaSemanas[1] + 1) * 7 * 86_400_000));
  const x = (t: number) => ((t - inicio) / (fin - inicio)) * 100;
  const tono: Record<string, string> = { diseno: COLOR.tinta2, en_curso: COLOR.azulRelleno, leyendo: COLOR.tinta, validado: COLOR.azulRelleno, refutado: COLOR.coral };
  return new ImageResponse(
    (
      <Marco titulo="Experimentos" subtitulo="Qué se está probando, cuándo se puede medir y si funcionó.">
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
          {ordenados.map((e) => {
            const d = Date.parse(e.despliegue);
            const l0 = d + e.ventanaSemanas[0] * 7 * 86_400_000;
            const l1 = d + (e.ventanaSemanas[1] + 1) * 7 * 86_400_000;
            return (
              <div key={e.nombre} style={{ display: "flex", position: "relative", height: 18, width: "100%" }}>
                <div style={{ position: "absolute", left: `${x(d)}%`, width: `${x(l0) - x(d)}%`, height: 18, borderRadius: "9px 0 0 9px", background: COLOR.linea, border: `2px solid ${tono[e.estado]}` }} />
                <div style={{ position: "absolute", left: `${x(l0)}%`, width: `${x(l1) - x(l0)}%`, height: 18, borderRadius: "0 9px 9px 0", background: e.estado === "diseno" ? COLOR.linea : tono[e.estado] }} />
              </div>
            );
          })}
        </div>
      </Marco>
    ),
    TAMANO_OG,
  );
}

function formatoM(n: number): string {
  return `$${(n / 1_000_000).toFixed(2)} M MXN`;
}
