// Geometría de los conectores del journey board. Pura: recibe cajas medidas (relativas al board) y
// devuelve los trazos del SVG superpuesto. JourneyBoard mide con ResizeObserver y vuelve a llamar.

export type Caja = { x: number; y: number; ancho: number; alto: number };

export type MedidaEtapa = { id: string; icono: Caja; tarjeta: Caja };
export type MedidaFuga = { id: string; desde: string; icono: Caja };

export type Conectores = {
  /** Espina azul: tramos rectos entre íconos de etapa de la misma tarjeta. */
  espina: string[];
  /** Entre tarjetas: curva (lado a lado) o recta (apiladas), con un punto en cada borde. */
  puentes: { d: string; puntos: [number, number][] }[];
  /** Fugas en coral punteado: caen verticales, separadas de la espina, y se encadenan desde la misma etapa. */
  fugas: string[];
};

/** Separación horizontal entre la espina y la línea de fuga. */
export const SEPARACION_FUGA = 10;

const centro = (c: Caja) => ({ x: c.x + c.ancho / 2, y: c.y + c.alto / 2, r: Math.min(c.ancho, c.alto) / 2 });
const n = (v: number) => Math.round(v * 10) / 10;
const misma = (a: Caja, b: Caja) => a.x === b.x && a.y === b.y && a.ancho === b.ancho && a.alto === b.alto;

export function calcularConectores(etapas: readonly MedidaEtapa[], fugas: readonly MedidaFuga[]): Conectores {
  const espina: string[] = [];
  const puentes: Conectores["puentes"] = [];

  for (let i = 0; i < etapas.length - 1; i++) {
    const a = centro(etapas[i].icono);
    const c = centro(etapas[i + 1].icono);
    const ta = etapas[i].tarjeta;
    const tc = etapas[i + 1].tarjeta;
    if (misma(ta, tc)) {
      espina.push(`M${n(a.x)} ${n(a.y + a.r)}L${n(c.x)} ${n(c.y - c.r)}`);
      continue;
    }
    if (tc.x > ta.x + ta.ancho) {
      // Tarjetas lado a lado: curva horizontal entre los bordes, a la altura de cada ícono.
      const x0 = ta.x + ta.ancho;
      const x1 = tc.x;
      const m = (x0 + x1) / 2;
      puentes.push({
        d: `M${n(x0)} ${n(a.y)}C${n(m)} ${n(a.y)} ${n(m)} ${n(c.y)} ${n(x1)} ${n(c.y)}`,
        puntos: [
          [n(x0), n(a.y)],
          [n(x1), n(c.y)],
        ],
      });
    } else {
      // Tarjetas apiladas (o la siguiente en otra fila): recta del borde inferior al superior.
      const y0 = ta.y + ta.alto;
      const y1 = tc.y;
      puentes.push({
        d: `M${n(a.x)} ${n(y0)}L${n(c.x)} ${n(y1)}`,
        puntos: [
          [n(a.x), n(y0)],
          [n(c.x), n(y1)],
        ],
      });
    }
  }

  const trazos: string[] = [];
  const ultimo = new Map<string, { y: number; h: number }>();
  for (const f of fugas) {
    const origen = etapas.find((e) => e.id === f.desde);
    if (!origen) continue;
    const o = centro(origen.icono);
    const d = centro(f.icono);
    const x = o.x + SEPARACION_FUGA;
    // Entra al ícono de la fuga por su borde: el punto del círculo en esa vertical.
    const dx = Math.abs(x - d.x);
    const entra = dx < d.r ? Math.sqrt(d.r * d.r - dx * dx) : 0;
    const previo = ultimo.get(f.desde);
    // Sale del borde del ícono de la etapa (o del borde inferior de la fuga anterior de la misma etapa).
    const sale = Math.sqrt(Math.max(0, o.r * o.r - SEPARACION_FUGA * SEPARACION_FUGA));
    const y0 = previo ? previo.y + previo.h : o.y + sale;
    trazos.push(`M${n(x)} ${n(y0)}V${n(d.y - entra)}`);
    ultimo.set(f.desde, { y: d.y, h: entra });
  }

  return { espina, puentes, fugas: trazos };
}
