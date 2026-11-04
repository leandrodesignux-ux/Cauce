// Contraste WCAG de cada par texto/fondo, en modo claro y oscuro, leído de src/styles/tokens.css.
// Uso: npm run contraste → sale con código 1 si algún par queda por debajo de 4.5:1.

import { readFileSync } from "node:fs";
import { join } from "node:path";

type Rgba = [number, number, number, number]; // 0–255 y alfa 0–1

const MINIMO = 4.5;
const css = readFileSync(join(process.cwd(), "src", "styles", "tokens.css"), "utf8")
  .replace(/\r\n/g, "\n")
  .replace(/\/\*[\s\S]*?\*\//g, "");

function bloque(selector: string): Record<string, string> {
  // Solo un bloque que empieza tras otro bloque (o al inicio): ".dark {" no debe coincidir con ":root,\n.dark {".
  const escapado = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hallado = new RegExp(`(?:^|\\})\\s*(${escapado}) \\{`).exec(css);
  const inicio = hallado ? hallado.index + hallado[0].indexOf(hallado[1]) : -1;
  if (inicio === -1) throw new Error(`No encontré ${selector} en tokens.css`);
  const cuerpo = css.slice(css.indexOf("{", inicio) + 1, css.indexOf("\n}", inicio));
  const vars: Record<string, string> = {};
  for (const [, nombre, valor] of cuerpo.matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[nombre] = valor.trim();
  return vars;
}

const semantica = bloque(":root,\n.dark");
const claro = { ...bloque(":root"), ...semantica };
const oscuro = { ...claro, ...bloque(".dark"), ...semantica };

function hex(valor: string): Rgba {
  const h = valor.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
}

/** Resuelve un valor de color: hex, rgb(r g b / a), var(--x), transparent o color-mix(in srgb, A p%, B). */
function resolver(valor: string, vars: Record<string, string>): Rgba {
  valor = valor.trim();
  if (valor === "transparent") return [0, 0, 0, 0];
  if (valor.startsWith("#")) return hex(valor);
  const rgb = valor.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+))?\s*\)$/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] === undefined ? 1 : Number(rgb[4])];
  const ref = valor.match(/^var\(--([\w-]+)\)$/);
  if (ref) return resolver(vars[ref[1]], vars);
  const mezcla = valor.match(/^color-mix\(in srgb,\s*(.+?)\s+(\d+(?:\.\d+)?)%,\s*(.+)\)$/);
  if (mezcla) {
    const a = resolver(mezcla[1], vars);
    const b = resolver(mezcla[3], vars);
    const p = Number(mezcla[2]) / 100;
    // Mezcla con alfa premultiplicado, como el navegador.
    const alfa = a[3] * p + b[3] * (1 - p);
    if (alfa === 0) return [0, 0, 0, 0];
    const canal = (i: number) => (a[i] * a[3] * p + b[i] * b[3] * (1 - p)) / alfa;
    return [canal(0), canal(1), canal(2), alfa];
  }
  throw new Error(`No sé resolver el color: ${valor}`);
}

function sobre(arriba: Rgba, abajo: Rgba): Rgba {
  const a = arriba[3];
  return [0, 1, 2].map((i) => arriba[i] * a + abajo[i] * (1 - a)).concat(1) as Rgba;
}

function luminancia([r, g, b]: Rgba): number {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contraste(a: Rgba, b: Rgba): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** Fondo: un token o una pila de capas translúcidas sobre un token opaco ("panel/fondo-c"). */
function fondo(spec: string, vars: Record<string, string>): Rgba {
  const capas = spec.split("/").map((t) => {
    const [token, pct] = t.split("@");
    const c = resolver(`var(--${token})`, vars);
    if (pct) c[3] = (c[3] * Number(pct)) / 100;
    return c;
  });
  return capas.reduceRight((abajo, arriba) => sobre(arriba, abajo));
}

// Texto neutro: va sobre cualquier superficie, incluido el degradé y los paneles vidriados.
const TEXTOS_NEUTROS = ["tinta", "tinta-2"];
const FONDOS_NEUTROS = [
  "fondo-a",
  "fondo-b",
  "fondo-c", // degradé
  "panel/fondo-a",
  "panel/fondo-c", // paneles vidriados sobre los extremos del degradé
  "panel-denso/fondo-a",
  "panel-denso/fondo-c", // cromo flotante (nav fija, barra móvil)
  "tarjeta",
  "muted",
  "neutro-suave/tarjeta",
  "azul-suave/tarjeta",
  "coral-suave/tarjeta", // filas en hover y pills suaves
];
// Texto de color (-texto): solo sobre tarjeta o sobre un -suave, nunca sobre el degradé.
const TEXTOS_COLOR = ["azul-texto", "coral-texto"];
const FONDOS_COLOR = ["tarjeta", "muted", "azul-suave/tarjeta", "coral-suave/tarjeta"];

const pares: [texto: string, fondo: string][] = [
  ...TEXTOS_NEUTROS.flatMap((t) => FONDOS_NEUTROS.map((f) => [t, f] as [string, string])),
  ...TEXTOS_COLOR.flatMap((t) => FONDOS_COLOR.map((f) => [t, f] as [string, string])),
  // Pills: -relleno con texto blanco, activo invertido. Las suaves ya están arriba (-texto sobre -suave/tarjeta).
  ["sobre-relleno", "azul-relleno"],
  ["sobre-relleno", "coral-relleno"],
  ["sobre-activo", "activo"],
  // Avatares de fantasmas: iniciales en azul-texto sobre azul-suave.
  ["azul-texto", "azul-suave"],
  // Semántica de shadcn.
  ["foreground", "background"],
  ["card-foreground", "card"],
  ["popover-foreground", "popover"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["muted-foreground", "muted"],
  ["muted-foreground", "background"],
  ["accent-foreground", "accent/background"],
  ["sidebar-foreground", "sidebar"],
  ["sidebar-primary-foreground", "sidebar-primary"],
  // Fase 10, color activo índigo: pestaña, segmento, nav y aviso; el número de la nav y "Limpiar" van al 70 %.
  ["sobre-activo", "activo"],
  ["sobre-activo@70", "activo"],
  // Contador de pendientes dentro de una pestaña activa y botón Rescatar dentro de la barra de selección.
  ["sobre-relleno", "coral-relleno"],
  // Badges y botones sobre la tabla en tarjeta (Leads sin atender): días, score y Rescatar.
  ["coral-texto", "coral-suave/tarjeta"],
  ["azul-texto", "azul-suave/tarjeta"],
];

/** Texto, opcionalmente con alfa ("sobre-activo@70"), ya compuesto sobre el fondo. */
function texto(spec: string, abajo: Rgba, vars: Record<string, string>): Rgba {
  const [token, pct] = spec.split("@");
  const color = resolver(`var(--${token})`, vars);
  if (pct) color[3] = Number(pct) / 100;
  return sobre(color, abajo);
}

// Onboarding (Fase 11b): contenedor con .dark sobre --tinta-profunda, con el radial de --azul al 10 % arriba.
// Solo en oscuro (el onboarding siempre lo es). Títulos, texto, etiquetas, montos de fugas, chip y controles.
const FONDOS_ONBOARDING = ["tinta-profunda", "azul@10/tinta-profunda"];
const paresOnboarding: [texto: string, fondo: string][] = [
  ...["tinta", "tinta-2", "coral-texto", "azul-texto"].flatMap((t) => FONDOS_ONBOARDING.map((f) => [t, f] as [string, string])),
  ["tinta-2", "tarjeta"], // chip del experimento
  ["primary-foreground", "primary"], // Siguiente / Ver mi recorrido
];

let fallas = 0;
for (const [modo, vars] of [
  ["claro", claro],
  ["oscuro", oscuro],
] as const) {
  console.log(`\nModo ${modo}`);
  for (const [t, f] of pares) {
    const abajo = fondo(f, vars);
    const r = contraste(texto(t, abajo, vars), abajo);
    const ok = r >= MINIMO;
    if (!ok) fallas++;
    console.log(`  ${ok ? "ok   " : "FALLA"} ${r.toFixed(2).padStart(5)}:1  ${t.padEnd(26)} sobre ${f}`);
  }
}

console.log("\nOnboarding (oscuro, sobre tinta profunda)");
for (const [t, f] of paresOnboarding) {
  const abajo = fondo(f, oscuro);
  const r = contraste(texto(t, abajo, oscuro), abajo);
  const ok = r >= MINIMO;
  if (!ok) fallas++;
  console.log(`  ${ok ? "ok   " : "FALLA"} ${r.toFixed(2).padStart(5)}:1  ${t.padEnd(26)} sobre ${f}`);
}

console.log(fallas === 0 ? `\nTodos los pares cumplen ${MINIMO}:1.` : `\n${fallas} par(es) por debajo de ${MINIMO}:1.`);
process.exit(fallas === 0 ? 0 : 1);
