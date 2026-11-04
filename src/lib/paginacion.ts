// Paginación del feed de leads (/fugas). Puro: la vista solo pinta lo que sale de acá.

export const POR_PAGINA = 10;

/** Página de la URL: entero ≥ 1, o 1 si falta o no se puede leer. */
export function leerPagina(valor: string | null): number {
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export type Pagina = {
  /** Página efectiva, acotada a [1, paginas]. */
  pagina: number;
  paginas: number;
  /** Índices [desde, hasta) dentro de la lista. */
  desde: number;
  hasta: number;
};

export function paginar(total: number, pedida: number, porPagina = POR_PAGINA): Pagina {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const pagina = Math.min(Math.max(1, pedida), paginas);
  const desde = (pagina - 1) * porPagina;
  return { pagina, paginas, desde, hasta: Math.min(total, desde + porPagina) };
}

/** Números a mostrar: primera, última y vecinas de la actual; "…" donde se salta. */
export function numerosDePagina(pagina: number, paginas: number): (number | "…")[] {
  const set = new Set([1, paginas, pagina - 1, pagina, pagina + 1].filter((n) => n >= 1 && n <= paginas));
  const orden = [...set].sort((a, b) => a - b);
  return orden.flatMap((n, i) => (i > 0 && n - orden[i - 1] > 1 ? (["…", n] as const) : ([n] as const)));
}
