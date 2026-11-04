// Motor del modo demo en vivo: puro y determinista (semilla fija). Genera datos simulados con la forma de
// los reales (filas de flujo y leads); las cifras las siguen calculando los selectores.

import { CANALES, ESTADOS, SECTORES } from "../config/dimensiones";
import { ORDEN_ETAPAS, TRANSICIONES } from "../config/etapas";
import { FECHA_CORTE, FUGA_MODELO_PERDIDA } from "../config/modelo";
import type { LeadIndice } from "./datos-cliente";
import type { LeadFeed } from "./leads";
import { entero, mulberry32, uniforme, type Rng } from "./prng";
import { periodoDesdePreset, sumarDias, tasaTransicion, volumenPorEtapa, type Volumen } from "./selectors";
import type { Canal, EtapaId, Experimento, Estado, Sector, SemanaEtapa } from "./tipos";

export const SEMILLA_DEMO = 20_261_101;
/** Duración real de un tick (cada tick representa ~1 hora del período). */
export const MS_POR_TICK = 1200;
/** Cada cuánto se agrega una semana simulada a los experimentos en curso o en lectura. */
export const MS_POR_SEMANA_EXPERIMENTO = 2000;
export const MAX_SEMANAS_EXPERIMENTO = 8;
const MAX_EVENTOS = 20;
const MAX_SERIE = 60;
/** Combinaciones de canal, sector y estado por tick (una: el embudo entero viaja junto y llega a las etapas profundas). */
const GRUPOS_POR_TICK = 1;

/** Lo que el motor necesita de los datos reales. */
export type DatosDemo = {
  flujo: readonly SemanaEtapa[];
  semanas: readonly string[];
  leads: readonly LeadIndice[];
  experimentos: readonly Experimento[];
  /** Valores tomados de los leads reales para combinar en los simulados. */
  banco: BancoDemo;
};

export type BancoDemo = { mensajes: readonly string[]; zonas: readonly string[]; telefonos: Readonly<Partial<Record<Estado, string>>> };

export type TipoEvento = "sesion" | "contacto" | "sin-atender" | "cierre";
export type EventoDemo = { id: string; tipo: TipoEvento; texto: string; tick: number; en: number };

/** Un lead simulado tiene la forma de los del feed (y por lo tanto la de LeadIndice). */
export type LeadSimulado = LeadFeed;

export type EstadoDemo = {
  tick: number;
  filasExtra: SemanaEtapa[];
  leadsExtra: LeadSimulado[];
  eventos: EventoDemo[];
  serieSesiones: number[];
  /** Semanas simuladas por experimento (tasa en %), en orden. */
  puntosExperimento: Record<string, number[]>;
};

export function estadoInicial(): EstadoDemo {
  return { tick: 0, filasExtra: [], leadsExtra: [], eventos: [], serieSesiones: [], puntosExperimento: {} };
}

// ——— Derivados de los datos reales (se calculan una vez por objeto de datos) ———

type Derivados = {
  ultimaSemana: string;
  /** Combinaciones de la última semana con su peso (sesiones en Descubrimiento). */
  grupos: { canal: Canal; sector: Sector; estado: Estado; peso: number }[];
  pesoTotal: number;
  sesionesSemana: number;
  /** Tasas del período por defecto (30 días). */
  tasas: number[];
  /** Tasa base (%) de cada transición en las últimas 6 semanas, para las semanas simuladas de experimentos. */
  base: Map<string, number>;
  nombres: string[];
  iniciales: string[];
};

const cache = new WeakMap<DatosDemo, Derivados>();

function derivados(datos: DatosDemo): Derivados {
  const guardado = cache.get(datos);
  if (guardado) return guardado;
  const ultimaSemana = datos.semanas[datos.semanas.length - 1];
  const grupos: Derivados["grupos"] = [];
  for (const f of datos.flujo) if (f.semana === ultimaSemana && f.volumen.descubrimiento > 0) grupos.push({ canal: f.canal, sector: f.sector, estado: f.estado, peso: f.volumen.descubrimiento });
  const pesoTotal = grupos.reduce((s, g) => s + g.peso, 0);
  const periodo = periodoDesdePreset("30d", ultimaSemana);
  const v = volumenPorEtapa(datos.flujo, { periodo });
  const tasas = TRANSICIONES.map((t) => tasaTransicion(v, t) ?? 0);
  const v6 = volumenPorEtapa(datos.flujo, { periodo: { desde: sumarDias(ultimaSemana, -35), hasta: ultimaSemana } });
  const base = new Map(TRANSICIONES.map((t) => [`${t.desde}-${t.hacia}`, (tasaTransicion(v6, t) ?? 0) * 100]));
  const nombres = [...new Set(datos.leads.map((l) => l.nombre.split(" ")[0]).filter(Boolean))];
  const iniciales = [...new Set(datos.leads.map((l) => l.nombre.split(" ")[1]).filter((x): x is string => !!x && x.endsWith(".")))];
  const d: Derivados = { ultimaSemana, grupos, pesoTotal, sesionesSemana: pesoTotal, tasas, base, nombres, iniciales };
  cache.set(datos, d);
  return d;
}

function elegirGrupo(rng: Rng, d: Derivados) {
  let r = rng() * d.pesoTotal;
  for (const g of d.grupos) {
    r -= g.peso;
    if (r < 0) return g;
  }
  return d.grupos[d.grupos.length - 1];
}

const nombreCanal = (c: Canal) => CANALES.find((x) => x.id === c)?.nombre ?? c;
const nombreSector = (s: Sector) => SECTORES.find((x) => x.id === s)?.nombre ?? s;
const nombreEstado = (e: Estado) => ESTADOS.find((x) => x.id === e)?.nombre ?? e;

/** Generador de un tick: independiente del resto (misma semilla + tick = mismo resultado). */
const rngDelTick = (tick: number) => mulberry32((SEMILLA_DEMO ^ Math.imul(tick + 1, 2_654_435_761)) >>> 0);

/** Fecha simulada de un tick: la fecha de corte más `tick` horas (para ordenar y mostrar los leads simulados). */
function fechaDelTick(tick: number): string {
  return new Date(Date.parse(`${FECHA_CORTE}T00:00:00Z`) + tick * 3_600_000).toISOString();
}

/**
 * Un tick (~1 hora): llegan sesiones (volumen semanal / 168 × ruido 0.8–1.2), repartidas en combinaciones de
 * canal, sector y estado ponderadas por la última semana, y se propagan etapa por etapa con las tasas del
 * período × ruido 0.85–1.15 (redondeo estocástico, para que las etapas profundas también se muevan). Si alguien se queda entre Calificación y Asignación, se crean 0–2 leads sin atender.
 */
export function avanzar(estado: EstadoDemo, datos: DatosDemo, ahora: number): EstadoDemo {
  const d = derivados(datos);
  const tick = estado.tick + 1;
  const rng = rngDelTick(tick);
  if (d.grupos.length === 0) return { ...estado, tick };

  const llegan = Math.round((d.sesionesSemana / 168) * uniforme(rng, 0.8, 1.2));
  const filas = new Map(estado.filasExtra.map((f) => [`${f.canal}|${f.sector}|${f.estado}`, f]));
  const eventos: EventoDemo[] = [];
  const leadsNuevos: LeadSimulado[] = [];
  let contactos = 0;
  let cierres = 0;
  let quedanSinAsignar = 0;
  const grupos: ReturnType<typeof elegirGrupo>[] = [];

  for (let g = 0; g < GRUPOS_POR_TICK; g++) {
    const grupo = elegirGrupo(rng, d);
    grupos.push(grupo);
    const parte = Math.floor(llegan / GRUPOS_POR_TICK) + (g < llegan % GRUPOS_POR_TICK ? 1 : 0);
    const volumen = Object.fromEntries(ORDEN_ETAPAS.map((id) => [id, 0])) as Volumen;
    volumen.descubrimiento = parte;
    TRANSICIONES.forEach((t, i) => {
      const tasa = Math.min(1, d.tasas[i] * uniforme(rng, 0.85, 1.15));
      volumen[t.hacia] = Math.max(0, Math.min(volumen[t.desde], redondearAlAzar(rng, volumen[t.desde] * tasa)));
    });
    contactos += volumen.contacto;
    cierres += volumen.cierre;
    quedanSinAsignar += volumen.calificacion - volumen.asignacion;
    const clave = `${grupo.canal}|${grupo.sector}|${grupo.estado}`;
    const previa = filas.get(clave);
    const suma = Object.fromEntries(ORDEN_ETAPAS.map((id) => [id, (previa?.volumen[id] ?? 0) + volumen[id]])) as Record<EtapaId, number>;
    filas.set(clave, { semana: d.ultimaSemana, canal: grupo.canal, sector: grupo.sector, estado: grupo.estado, volumen: suma });
  }

  const evento = (tipo: TipoEvento, texto: string) => eventos.push({ id: `E-${tick}-${eventos.length}`, tipo, texto, tick, en: ahora });
  const principal = grupos[0];
  if (llegan > 0) evento("sesion", `Nueva sesión desde ${nombreCanal(principal.canal)}`);
  if (contactos > 0) {
    const g = grupos[entero(rng, 0, grupos.length - 1)];
    evento("contacto", `${nombreSimulado(rng, d)} pidió contacto · ${nombreSector(g.sector)}`);
  }
  if (quedanSinAsignar > 0) {
    const cuantos = entero(rng, 0, 2);
    for (let k = 0; k < cuantos; k++) {
      const g = grupos[entero(rng, 0, grupos.length - 1)];
      const lead = leadSimulado(rng, d, datos.banco, estado.leadsExtra.length + leadsNuevos.length + 1, tick, g);
      leadsNuevos.push(lead);
      evento("sin-atender", `Lead sin atender: ${nombreSector(g.sector)} · ${nombreEstado(g.estado)}`);
    }
  }
  if (cierres > 0) {
    const g = grupos[entero(rng, 0, grupos.length - 1)];
    evento("cierre", `Cierre: ${nombreSector(g.sector)} · ${nombreEstado(g.estado)}`);
  }

  // Semanas simuladas de los experimentos en curso o en lectura: ~cada 2 s (máx. 8).
  const puntosExperimento = { ...estado.puntosExperimento };
  const semanaNueva = Math.floor((tick * MS_POR_TICK) / MS_POR_SEMANA_EXPERIMENTO) > Math.floor(((tick - 1) * MS_POR_TICK) / MS_POR_SEMANA_EXPERIMENTO);
  if (semanaNueva)
    for (const e of datos.experimentos) {
      if (e.estado !== "en_curso" && e.estado !== "leyendo") continue;
      const previos = puntosExperimento[e.id] ?? [];
      if (previos.length >= MAX_SEMANAS_EXPERIMENTO) continue;
      const base = d.base.get(`${e.transicion.desde}-${e.transicion.hacia}`) ?? 0;
      const valor = Math.max(0, base + e.prediccionPp * uniforme(rng, 0.4, 1.3) + uniforme(rng, -0.3, 0.3) * Math.max(0.5, e.prediccionPp));
      puntosExperimento[e.id] = [...previos, Math.round(valor * 100) / 100];
    }

  return {
    tick,
    filasExtra: [...filas.values()],
    leadsExtra: [...estado.leadsExtra, ...leadsNuevos],
    eventos: [...eventos.reverse(), ...estado.eventos].slice(0, MAX_EVENTOS),
    serieSesiones: [...estado.serieSesiones, llegan].slice(-MAX_SERIE),
    puntosExperimento,
  };
}

/** Redondeo estocástico: la parte decimal decide si se sube (conserva el valor esperado en volúmenes chicos). */
function redondearAlAzar(rng: Rng, x: number): number {
  const piso = Math.floor(x);
  return piso + (rng() < x - piso ? 1 : 0);
}

function nombreSimulado(rng: Rng, d: Derivados): string {
  const nombre = d.nombres.length ? d.nombres[entero(rng, 0, d.nombres.length - 1)] : "Cliente";
  const inicial = d.iniciales.length ? d.iniciales[entero(rng, 0, d.iniciales.length - 1)] : "D.";
  return `${nombre} ${inicial}`;
}

function leadSimulado(rng: Rng, d: Derivados, banco: BancoDemo, n: number, tick: number, g: { canal: Canal; sector: Sector; estado: Estado }): LeadSimulado {
  const fecha = fechaDelTick(tick);
  const prefijo = banco.telefonos[g.estado] ?? "+52 ••";
  return {
    id: `SIM-${String(n).padStart(4, "0")}`,
    nombre: nombreSimulado(rng, d),
    telefono: `${prefijo} ••••${String(entero(rng, 0, 9999)).padStart(4, "0")}`,
    canal: g.canal,
    sector: g.sector,
    estado: g.estado,
    etapaActual: "calificacion",
    fugaId: FUGA_MODELO_PERDIDA,
    score: entero(rng, 42, 92),
    urgencia: rng() < 0.3,
    ultimoMensaje: banco.mensajes.length ? banco.mensajes[entero(rng, 0, banco.mensajes.length - 1)] : "Me interesa conocer opciones disponibles.",
    mensajes: entero(rng, 2, 9),
    espaciosVistos: entero(rng, 1, 6),
    creadoEl: fecha,
    ultimaActividad: fecha,
    senales: { superficieM2: null, zona: banco.zonas.length ? banco.zonas[entero(rng, 0, banco.zonas.length - 1)] : null, presupuestoUsd: null },
  };
}

export function esSimulado(id: string): boolean {
  return id.startsWith("SIM-");
}
