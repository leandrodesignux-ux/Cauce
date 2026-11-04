// Formatos de DESIGN.md: "$2.31M USD", "$128.4K USD", "$19,290 USD", "23.4 %", "+1.8 pp".

const entero = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 });
const dosDecimales = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const unDecimal = new Intl.NumberFormat("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatearEntero(n: number): string {
  return entero.format(n);
}

/** "$19,290 USD": siempre entero (montos redondos). */
export function formatearUsd(n: number): string {
  return `$${entero.format(Math.round(n))} USD`;
}

/** Resúmenes: "$2.31M USD" (≥1,000,000), "$128.4K USD" (≥10,000); por debajo, el monto completo. */
export function formatearUsdCorto(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${dosDecimales.format(n / 1_000_000)}M USD`;
  if (abs >= 10_000) return `$${unDecimal.format(n / 1_000)}K USD`;
  return formatearUsd(n);
}

/** Tasa 0–1 → "23.4 %". */
export function formatearPct(tasa: number | null): string {
  return tasa === null ? "—" : `${unDecimal.format(tasa * 100)} %`;
}

export function formatearPp(pp: number | null): string {
  if (pp === null) return "—";
  const signo = pp > 0 ? "+" : pp < 0 ? "−" : "±";
  return `${signo}${unDecimal.format(Math.abs(pp))} pp`;
}

/** Puntos porcentuales en texto corrido: "+1.8 puntos" (en celdas de tabla se usa formatearPp). */
export function formatearPuntos(pp: number | null): string {
  return formatearPp(pp).replace(" pp", " puntos");
}

const fechaCorta = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });
const fechaConAnio = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "5 oct – 1 nov 2026": del lunes `desde` al domingo de la semana `hasta`. */
export function formatearRangoSemanas(desde: string, hasta: string): string {
  const inicio = new Date(`${desde}T00:00:00Z`);
  const fin = new Date(Date.parse(`${hasta}T00:00:00Z`) + 6 * 86_400_000);
  return `${fechaCorta.format(inicio).replace(".", "")} – ${fechaConAnio.format(fin).replace(/\./g, "")}`;
}

export function formatearSemana(lunes: string): string {
  return fechaConAnio.format(new Date(`${lunes}T00:00:00Z`)).replace(/\./g, "");
}

/** "17 ago". */
export function formatearSemanaCorta(lunes: string): string {
  return fechaCorta.format(new Date(`${lunes}T00:00:00Z`)).replace(".", "");
}
