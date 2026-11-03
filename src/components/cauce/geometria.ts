// Geometría del río: funciones puras, sin React. Trabaja en coordenadas de flujo (s = a lo largo del río,
// t = grosor) y las proyecta a x/y según la orientación: horizontal en escritorio, vertical en móvil.

import { scaleSqrt } from "d3-scale";
import { area, curveBasis, line } from "d3-shape";

export type Orientacion = "horizontal" | "vertical";

export type PozaEntrada = {
  id: string;
  /** Índice de la etapa de origen de la transición (0–6). */
  desde: number;
  volumen: number;
  valor: number;
};

export type EntradaGeometria = {
  orientacion: Orientacion;
  ancho: number;
  /** Volumen por etapa, en orden (8 valores). */
  volumen: readonly number[];
  /** Volumen del período anterior, para el contorno punteado. */
  anterior: readonly number[] | null;
  /** Volumen de referencia que ocupa el grosor máximo (el total sin filtros del período). */
  referencia: number;
  pozas: readonly PozaEntrada[];
};

export type EtapaGeo = { s: number; grosor: number; x: number; y: number };
export type TransicionGeo = { desde: number; s: number; x: number; y: number };
export type PozaGeo = PozaEntrada & {
  x: number;
  y: number;
  rx: number;
  ry: number;
  hilo: string;
  grosorHilo: number;
  /** Punto donde el hilo deja el río. */
  origen: { x: number; y: number };
};

export type Geometria = {
  orientacion: Orientacion;
  ancho: number;
  alto: number;
  /** Centro del río en el eje transversal. */
  centro: number;
  grosorMax: number;
  paso: number;
  /** Extremos del río en el eje del flujo. */
  inicio: number;
  fin: number;
  etapas: EtapaGeo[];
  transiciones: TransicionGeo[];
  rio: string;
  rioAnterior: string | null;
  corrientes: string[];
  /** Hasta dónde llegan las corrientes en el eje del flujo (para desvanecerlas). */
  finCorrientes: number;
  pozas: PozaGeo[];
  /** Vertical: borde izquierdo de la columna de pozas. */
  columnaPozas: number;
  /** Horizontal angosto (panel abierto, tablet): rótulos más chicos. */
  compacto: boolean;
};

const GROSOR_MINIMO = 6;

/** Medidas fijas por orientación (px). */
export const MEDIDAS = {
  horizontal: { margen: 64, centro: 232, grosorMax: 232, filaPoza: 444, desfasePoza: 34, alto: 590, separacionPoza: 156 },
  vertical: { margen: 44, paso: 112, columnaEtiquetas: 100, separacionPoza: 88 },
} as const;

/** Tres puntos por etapa para que el spline mantenga el grosor exacto en cada una. */
function puntosRio(s: readonly number[], grosores: readonly number[], paso: number, inicio: number, fin: number): [number, number][] {
  const meseta = paso * 0.16;
  const puntos: [number, number][] = [[inicio, grosores[0]]];
  s.forEach((si, i) => puntos.push([si - meseta, grosores[i]], [si, grosores[i]], [si + meseta, grosores[i]]));
  puntos.push([fin, grosores[grosores.length - 1]]);
  return puntos;
}

function trazoArea(orientacion: Orientacion, centro: number) {
  return orientacion === "horizontal"
    ? area<[number, number]>()
        .x((d) => d[0])
        .y0((d) => centro - d[1] / 2)
        .y1((d) => centro + d[1] / 2)
        .curve(curveBasis)
    : area<[number, number]>()
        .y((d) => d[0])
        .x0((d) => centro - d[1] / 2)
        .x1((d) => centro + d[1] / 2)
        .curve(curveBasis);
}

/** Separa posiciones (ordenadas) para que queden al menos `minimo` entre sí, dentro de [lo, hi]. */
function separar(posiciones: number[], minimo: number, lo: number, hi: number): number[] {
  const p = [...posiciones];
  for (let i = 1; i < p.length; i++) p[i] = Math.max(p[i], p[i - 1] + minimo);
  if (p.length) p[p.length - 1] = Math.min(p[p.length - 1], hi);
  for (let i = p.length - 2; i >= 0; i--) p[i] = Math.min(p[i], p[i + 1] - minimo);
  if (p.length && p[0] < lo) {
    const desplazamiento = lo - p[0];
    for (let i = 0; i < p.length; i++) p[i] += desplazamiento;
  }
  return p;
}

export function calcularGeometria(e: EntradaGeometria): Geometria {
  const { orientacion, ancho } = e;
  const n = e.volumen.length;
  const horizontal = orientacion === "horizontal";

  // Eje del flujo y eje transversal.
  let inicio: number, fin: number, paso: number, centro: number, grosorMax: number, alto: number;
  if (horizontal) {
    const m = MEDIDAS.horizontal;
    paso = (ancho - 2 * (ancho < 1000 ? 52 : m.margen)) / (n - 1);
    inicio = 0;
    fin = ancho;
    centro = m.centro;
    grosorMax = m.grosorMax;
    alto = m.alto;
  } else {
    const m = MEDIDAS.vertical;
    paso = m.paso;
    inicio = 0;
    fin = m.margen * 2 + paso * (n - 1);
    grosorMax = Math.min(96, (ancho - m.columnaEtiquetas) * 0.36);
    centro = m.columnaEtiquetas + grosorMax / 2 + 4;
    alto = fin;
  }
  const margen = horizontal ? (ancho < 1000 ? 52 : MEDIDAS.horizontal.margen) : MEDIDAS.vertical.margen;
  const s = Array.from({ length: n }, (_, i) => margen + i * paso);

  // Raíz cuadrada: el río se angosta visiblemente en todas las etapas aunque el volumen caiga dos órdenes de magnitud.
  const escala = scaleSqrt().domain([0, Math.max(1, e.referencia)]).range([0, grosorMax]).clamp(true);
  const grosor = (v: number) => Math.max(GROSOR_MINIMO, escala(v));
  const grosores = e.volumen.map(grosor);

  const proyectar = (sv: number, tv: number) => (horizontal ? { x: sv, y: tv } : { x: tv, y: sv });

  const trazo = trazoArea(orientacion, centro);
  const rio = trazo(puntosRio(s, grosores, paso, inicio, fin)) ?? "";
  // Período anterior: solo las dos orillas (sin los cierres verticales del área).
  let rioAnterior: string | null = null;
  if (e.anterior && e.anterior[0] > 0) {
    const puntos = puntosRio(s, e.anterior.map(grosor), paso, inicio, fin);
    const orilla = (signo: number) =>
      line<[number, number]>()
        .x((d) => (horizontal ? d[0] : centro + (signo * d[1]) / 2))
        .y((d) => (horizontal ? centro + (signo * d[1]) / 2 : d[0]))
        .curve(curveBasis)(puntos) ?? "";
    rioAnterior = `${orilla(-1)}${orilla(1)}`;
  }

  // Corrientes: líneas finas dentro del agua, solo mientras el río es ancho.
  const corte = grosores.findIndex((g) => g < 30);
  const ultimo = corte === -1 ? n - 1 : Math.max(0, corte - 1);
  const corrientes: string[] = [];
  const finCorrientes = s[ultimo] + paso * 0.45;
  if (ultimo > 0) {
    const tramo = puntosRio(s.slice(0, ultimo + 1), grosores.slice(0, ultimo + 1), paso, inicio, finCorrientes);
    for (const f of [-0.52, -0.18, 0.2, 0.55]) {
      const l = line<[number, number]>()
        .x((d) => (horizontal ? d[0] : centro + (f * d[1]) / 2))
        .y((d) => (horizontal ? centro + (f * d[1]) / 2 : d[0]))
        .curve(curveBasis);
      corrientes.push(l(tramo) ?? "");
    }
  }

  const etapas = s.map((si, i) => ({ s: si, grosor: grosores[i], ...proyectar(si, centro) }));
  const transiciones = s.slice(0, -1).map((si, i) => ({ desde: i, s: si + paso / 2, ...proyectar(si + paso / 2, centro) }));

  // Pozas: cuelgan de su transición; si hay dos en la misma, se reparten dentro del tramo.
  const maxValor = Math.max(1, ...e.pozas.map((p) => p.valor));
  const maxVolumen = Math.max(1, ...e.pozas.map((p) => p.volumen));
  const radio = scaleSqrt().domain([0, maxValor]).range(horizontal ? [22, 58] : [10, 22]);
  const hilo = scaleSqrt().domain([0, maxVolumen]).range([1, 8]);

  const anclas = e.pozas.map((p) => {
    const hermanas = e.pozas.filter((q) => q.desde === p.desde);
    const orden = hermanas.indexOf(p);
    const fraccion = hermanas.length === 1 ? 0.5 : 0.34 + (0.32 * orden) / (hermanas.length - 1);
    return s[p.desde] + paso * fraccion;
  });
  const orden = e.pozas.map((_, i) => i).sort((a, b) => anclas[a] - anclas[b]);

  const pozas: PozaGeo[] = new Array(e.pozas.length);
  if (horizontal) {
    const m = MEDIDAS.horizontal;
    // Una fila, con alturas alternadas: los hilos tienen largos distintos y los rótulos no se pisan.
    const separacion = Math.min(m.separacionPoza, (ancho - m.margen) / e.pozas.length);
    const xs = separar(
      orden.map((i) => anclas[i]),
      separacion,
      m.margen * 0.5 + separacion / 2 - 10,
      ancho - separacion / 2 + 10,
    );
    orden.forEach((i, k) => {
      const p = e.pozas[i];
      const rx = radio(p.valor);
      const ry = Math.max(5, rx * 0.2);
      const x = xs[k];
      const y = m.filaPoza + (k % 2) * m.desfasePoza;
      const ox = anclas[i];
      const medio = (centro + y) / 2;
      pozas[i] = {
        ...p,
        x,
        y,
        rx,
        ry,
        grosorHilo: hilo(p.volumen),
        origen: { x: ox, y: centro },
        hilo: `M${ox},${centro} C${ox},${medio} ${x},${medio} ${x},${y - ry}`,
      };
    });
  } else {
    const m = MEDIDAS.vertical;
    const columna = centro + grosorMax / 2 + 22;
    const ys = separar(
      orden.map((i) => anclas[i]),
      m.separacionPoza,
      margen * 0.5,
      fin - margen * 0.3,
    );
    orden.forEach((i, k) => {
      const p = e.pozas[i];
      const rx = radio(p.valor);
      const ry = Math.max(4, rx * 0.32);
      const x = columna + rx;
      const y = ys[k];
      const oy = anclas[i];
      const medio = (centro + x - rx) / 2;
      pozas[i] = {
        ...p,
        x,
        y,
        rx,
        ry,
        grosorHilo: hilo(p.volumen),
        origen: { x: centro, y: oy },
        hilo: `M${centro},${oy} C${medio},${oy} ${medio},${y} ${x - rx},${y}`,
      };
    });
  }

  const columnaPozas = centro + grosorMax / 2 + 22;
  return { orientacion, ancho, alto, centro, grosorMax, paso, inicio, fin, etapas, transiciones, rio, rioAnterior, corrientes, finCorrientes, pozas, columnaPozas, compacto: horizontal && paso < 120 };
}

/** Parte un texto en renglones de hasta `max` caracteres, sin cortar palabras. */
export function partirTexto(texto: string, max: number): string[] {
  const renglones: string[] = [];
  let actual = "";
  for (const palabra of texto.split(" ")) {
    if (actual && (actual + " " + palabra).length > max) {
      renglones.push(actual);
      actual = palabra;
    } else {
      actual = actual ? `${actual} ${palabra}` : palabra;
    }
  }
  if (actual) renglones.push(actual);
  return renglones;
}
