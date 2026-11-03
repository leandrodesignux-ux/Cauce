/** Reemplaza la URL actual sin recargar (Next sincroniza useSearchParams). Las comas quedan legibles. */
export function reemplazarUrl(pathname: string, params: URLSearchParams): void {
  const qs = params.toString().replace(/%2C/g, ",");
  window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
}
