// Generador de datos demo (docs/DATA.md). Determinístico: mulberry32(2026), sin Date.now ni Math.random.
// Uso: npm run seed → escribe src/data/{flujo,fugas,experimentos,leads}.json

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TRANSICIONES, nombreEtapa } from "../src/config/etapas";
import { SEMANAS_DE_DATOS, ULTIMA_SEMANA } from "../src/config/modelo";
import { binomial, derivar, mulberry32, poisson, uniforme, type Rng } from "../src/lib/prng";
import { efectoObservadoPp, semanasEntre, sumarDias } from "../src/lib/selectors";
import type { Canal, EtapaId, Estado, Experimento, Fuga, Sector, SemanaEtapa } from "../src/lib/tipos";
import { generarLeads } from "./leads";
import { PESO_CANAL, PESO_ESTADO, PESO_SECTOR } from "./parametros";

// ---------------------------------------------------------------------------
// Parámetros del generador (demo)

const SESIONES_POR_SEMANA = 45_000;
const RUIDO = 0.1; // ±10 % sobre la tasa de cada celda y semana

/** Tasa media semanal de cada transición, indexada por etapa de origen. */
const TASA_BASE: Record<Exclude<EtapaId, "cierre">, number> = {
  descubrimiento: 0.62,
  exploracion: 0.38,
  evaluacion: 0.065,
  contacto: 0.71,
  calificacion: 0.64,
  asignacion: 0.31,
  visita: 0.11,
};

/** Evaluación → Contacto por sector: industrial y terreno más baja, coworking más alta. */
const MODIFICADOR_CONTACTO_SECTOR: Record<Sector, number> = {
  oficina: 1,
  industrial: 0.75,
  terreno: 0.65,
  bodega: 1,
  local: 1,
  coworking: 1.4,
};

/** Normaliza los modificadores para que la media ponderada siga siendo la tasa base. */
const NORMA_CONTACTO =
  (Object.keys(PESO_SECTOR) as Sector[]).reduce((s, k) => s + PESO_SECTOR[k] * MODIFICADOR_CONTACTO_SECTOR[k], 0) /
  (Object.values(PESO_SECTOR) as number[]).reduce((s, p) => s + p, 0);

const TENDENCIA_PANEL_PP = 0.4;
const SEMANAS_TENDENCIA = 6;

// ---------------------------------------------------------------------------
// Catálogos semilla

const FUGAS: Fuga[] = [
  { id: "rebote-browse", desde: "exploracion", hacia: "evaluacion", causa: "Rebote en Browse Page sin interacción", experimentoId: "busqueda-guiada", proporcionCaida: 0.25 },
  { id: "no-disponible", desde: "evaluacion", hacia: "contacto", causa: "Espacio no disponible", experimentoId: "spots-no-disponibles", proporcionCaida: 0.04 },
  { id: "friccion-contacto", desde: "evaluacion", hacia: "contacto", causa: "Fricción en el panel de contacto (desktop)", experimentoId: "panel-contacto", proporcionCaida: 0.03 },
  { id: "sin-datos", desde: "contacto", hacia: "calificacion", causa: "Conversación sin datos mínimos", proporcionCaida: 0.6 },
  { id: "fantasmas", desde: "calificacion", hacia: "asignacion", causa: "Fantasmas: intención sin broker asignado", experimentoId: "rescate-fantasmas", proporcionCaida: 0.75 },
  { id: "visita-cancelada", desde: "visita", hacia: "cierre", causa: "Visita cancelada por disponibilidad no validada", experimentoId: "validacion-disponibilidad", proporcionCaida: 0.08 },
];

type ExperimentoSemilla = Omit<Experimento, "hipotesis" | "metrica" | "observadoPp">;

const EXPERIMENTOS: ExperimentoSemilla[] = [
  { id: "busqueda-guiada", nombre: "Búsqueda guiada en Browse Pages de pago", palanca: "Producto · Listado", transicion: { desde: "exploracion", hacia: "evaluacion" }, prediccionPp: 2, despliegue: "2026-08-24", ventanaSemanas: [6, 8], estado: "leyendo" },
  { id: "spots-no-disponibles", nombre: "Flujo de spots no disponibles", palanca: "Producto · Página de producto", transicion: { desde: "evaluacion", hacia: "contacto" }, prediccionPp: 0.3, despliegue: "2026-10-05", ventanaSemanas: [6, 8], estado: "en_curso" },
  { id: "panel-contacto", nombre: "Rediseño del panel de contacto (desktop)", palanca: "Producto · Panel de contacto", transicion: { desde: "evaluacion", hacia: "contacto" }, prediccionPp: 0.5, despliegue: "2026-07-06", ventanaSemanas: [6, 8], estado: "validado" },
  { id: "templates-ficha", nombre: "Templates de ficha por sector", palanca: "Contenido · Páginas de producto", transicion: { desde: "evaluacion", hacia: "contacto" }, prediccionPp: 0.4, despliegue: "2026-11-30", ventanaSemanas: [6, 8], estado: "diseno" },
  { id: "ficha-complejo-seo", nombre: "Ficha de complejo con jerarquía SEO", palanca: "SEO · Páginas de producto", transicion: { desde: "descubrimiento", hacia: "exploracion" }, prediccionPp: 1.5, despliegue: "2026-09-21", ventanaSemanas: [8, 12], estado: "en_curso" },
  { id: "rescate-fantasmas", nombre: "Rescate de fantasmas", palanca: "Operación · Asignación", transicion: { desde: "calificacion", hacia: "asignacion" }, prediccionPp: 6, despliegue: "2026-10-12", ventanaSemanas: [4, 6], estado: "en_curso" },
  { id: "validacion-disponibilidad", nombre: "Validación de disponibilidad en el bot", palanca: "Operación · Bot", transicion: { desde: "visita", hacia: "cierre" }, prediccionPp: 2, despliegue: "2026-12-07", ventanaSemanas: [8, 10], estado: "diseno" },
];

// ---------------------------------------------------------------------------
// Flujo semanal

function generarFlujo(rng: Rng): SemanaEtapa[] {
  const panel = EXPERIMENTOS.find((e) => e.id === "panel-contacto")!;
  const totalCanal = Object.values(PESO_CANAL).reduce((s, p) => s + p, 0);
  const totalSector = Object.values(PESO_SECTOR).reduce((s, p) => s + p, 0);
  const totalEstado = Object.values(PESO_ESTADO).reduce((s, p) => s + p, 0);
  const semanas = Array.from({ length: SEMANAS_DE_DATOS }, (_, i) => sumarDias(ULTIMA_SEMANA, -7 * (SEMANAS_DE_DATOS - 1 - i)));

  const filas: SemanaEtapa[] = [];
  for (const semana of semanas) {
    // Semanas completas desde el despliegue del rediseño del panel (0 = semana del despliegue).
    const semanasDesdePanel = semanasEntre(panel.despliegue, semana) - 1;
    const tendencia =
      semanasDesdePanel > 0 ? (TENDENCIA_PANEL_PP / 100) * Math.min(semanasDesdePanel, SEMANAS_TENDENCIA) / SEMANAS_TENDENCIA : 0;

    for (const canal of Object.keys(PESO_CANAL) as Canal[]) {
      for (const sector of Object.keys(PESO_SECTOR) as Sector[]) {
        for (const estado of Object.keys(PESO_ESTADO) as Estado[]) {
          const media =
            SESIONES_POR_SEMANA *
            (PESO_CANAL[canal] / totalCanal) *
            (PESO_SECTOR[sector] / totalSector) *
            (PESO_ESTADO[estado] / totalEstado) *
            uniforme(rng, 1 - RUIDO, 1 + RUIDO);

          const volumen = { descubrimiento: poisson(rng, media) } as Record<EtapaId, number>;
          for (const t of TRANSICIONES) {
            const desde = t.desde as keyof typeof TASA_BASE;
            let tasa = TASA_BASE[desde];
            if (desde === "evaluacion") {
              tasa = ((tasa + tendencia) * MODIFICADOR_CONTACTO_SECTOR[sector]) / NORMA_CONTACTO;
            }
            tasa *= uniforme(rng, 1 - RUIDO, 1 + RUIDO);
            volumen[t.hacia] = binomial(rng, volumen[t.desde], Math.min(1, tasa));
          }
          filas.push({ semana, canal, sector, estado, volumen });
        }
      }
    }
  }
  return filas;
}

// ---------------------------------------------------------------------------
// Experimentos

function formatearPp(pp: number): string {
  return `${pp >= 0 ? "+" : "−"}${Math.abs(pp).toFixed(1)} pp`;
}

function completarExperimentos(flujo: SemanaEtapa[]): Experimento[] {
  return EXPERIMENTOS.map((e) => {
    const transicion = `${nombreEtapa(e.transicion.desde)} → ${nombreEtapa(e.transicion.hacia)}`;
    const conLectura = e.estado === "leyendo" || e.estado === "validado" || e.estado === "refutado";
    const observado = conLectura
      ? efectoObservadoPp(flujo, e.transicion, e.despliegue, e.ventanaSemanas, ULTIMA_SEMANA)
      : null;
    return {
      ...e,
      hipotesis: `${formatearPp(e.prediccionPp)} en ${transicion} entre las semanas ${e.ventanaSemanas[0]} y ${e.ventanaSemanas[1]} después del despliegue`,
      metrica: `Tasa semanal ${transicion}`,
      ...(observado !== null ? { observadoPp: Math.round(observado * 100) / 100 } : {}),
    };
  });
}

// ---------------------------------------------------------------------------
// Escritura

function escribir(dir: string, archivo: string, contenido: string): void {
  writeFileSync(join(dir, archivo), contenido, "utf8");
  console.log(`  ${archivo} (${(Buffer.byteLength(contenido) / 1024).toFixed(0)} KB)`);
}

/** Un registro por línea: diffs legibles sin inflar el archivo. */
function jsonPorLinea(filas: readonly unknown[]): string {
  return `[\n${filas.map((f) => JSON.stringify(f)).join(",\n")}\n]\n`;
}

function json(valor: unknown): string {
  return `${JSON.stringify(valor, null, 2)}\n`;
}

function main(): void {
  const raiz = mulberry32(2026);
  const rngFlujo = derivar(raiz);
  const rngLeads = derivar(raiz);

  for (const e of EXPERIMENTOS) {
    if (new Date(`${e.despliegue}T00:00:00Z`).getUTCDay() !== 1) throw new Error(`${e.id}: el despliegue debe ser lunes`);
  }

  const flujo = generarFlujo(rngFlujo);
  const experimentos = completarExperimentos(flujo);
  const leads = generarLeads(rngLeads, FUGAS);

  const dir = join(process.cwd(), "src", "data");
  mkdirSync(dir, { recursive: true });
  console.log("Escribiendo src/data/:");
  escribir(dir, "flujo.json", jsonPorLinea(flujo));
  escribir(dir, "fugas.json", json(FUGAS));
  escribir(dir, "experimentos.json", json(experimentos));
  escribir(dir, "leads.json", jsonPorLinea(leads));
}

main();
