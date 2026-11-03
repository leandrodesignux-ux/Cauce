// PRNG determinístico y distribuciones para el generador demo.

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deriva un generador independiente, para que cambiar una parte del seed no altere las demás. */
export function derivar(rng: Rng): Rng {
  return mulberry32(Math.floor(rng() * 4294967296));
}

export function uniforme(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function entero(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function bernoulli(rng: Rng, p: number): boolean {
  return rng() < p;
}

export function elegir<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function elegirPonderado<T extends string>(rng: Rng, pesos: Readonly<Record<T, number>>): T {
  const entradas = Object.entries(pesos) as [T, number][];
  const total = entradas.reduce((s, [, p]) => s + p, 0);
  let r = rng() * total;
  for (const [valor, peso] of entradas) {
    r -= peso;
    if (r < 0) return valor;
  }
  return entradas[entradas.length - 1][0];
}

export function normal(rng: Rng, media: number, desvio: number): number {
  const u1 = 1 - rng();
  const u2 = rng();
  return media + desvio * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function poisson(rng: Rng, media: number): number {
  if (media <= 0) return 0;
  if (media >= 30) return Math.max(0, Math.round(normal(rng, media, Math.sqrt(media))));
  const limite = Math.exp(-media);
  let k = 0;
  let p = rng();
  while (p > limite) {
    k++;
    p *= rng();
  }
  return k;
}

export function binomial(rng: Rng, n: number, p: number): number {
  if (n <= 0 || p <= 0) return 0;
  if (p >= 1) return n;
  if (n < 60) {
    let k = 0;
    for (let i = 0; i < n; i++) if (rng() < p) k++;
    return k;
  }
  if (n * p < 30) return Math.min(n, poisson(rng, n * p));
  if (n * (1 - p) < 30) return n - Math.min(n, poisson(rng, n * (1 - p)));
  const k = Math.round(normal(rng, n * p, Math.sqrt(n * p * (1 - p))));
  return Math.min(n, Math.max(0, k));
}
