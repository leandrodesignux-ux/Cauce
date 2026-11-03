"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";

export type FilaDesglose = { id: string; nombre: string; valor: number | null; detalle: string };
export type GrupoDesglose = { clave: string; nombre: string; filas: FilaDesglose[] };

/** Desglose por canal, sector y estado: pestañas con barras horizontales ordenadas. */
export function Desglose({
  grupos,
  formato,
  referencia,
  etiquetaReferencia,
  tabla,
}: {
  grupos: GrupoDesglose[];
  formato: (v: number) => string;
  /** Línea vertical de referencia (por ejemplo, la tasa del total filtrado). */
  referencia?: number | null;
  etiquetaReferencia?: string;
  tabla: boolean;
}) {
  const [activo, setActivo] = useState(0);
  const pestanas = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();
  const grupo = grupos[activo];
  const ordenadas = [...grupo.filas].sort((a, b) => (b.valor ?? -1) - (a.valor ?? -1));
  const max = Math.max(...ordenadas.map((f) => f.valor ?? 0), referencia ?? 0, 1e-9);

  const alPresionar = (e: KeyboardEvent) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const siguiente = (activo + delta + grupos.length) % grupos.length;
    setActivo(siguiente);
    pestanas.current[siguiente]?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Desglose" className="flex gap-1 border-b border-linea" onKeyDown={alPresionar}>
        {grupos.map((g, i) => (
          <button
            key={g.clave}
            ref={(el) => {
              pestanas.current[i] = el;
            }}
            role="tab"
            id={`${id}-tab-${i}`}
            aria-selected={i === activo}
            aria-controls={`${id}-panel`}
            tabIndex={i === activo ? 0 : -1}
            onClick={() => setActivo(i)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm motion-safe:transition-colors ${
              i === activo ? "border-cauce font-medium text-tinta" : "border-transparent text-niebla hover:text-tinta"
            }`}
          >
            {g.nombre}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${activo}`} className="pt-4">
        {tabla ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-linea text-xs text-niebla">
                <th scope="col" className="py-2 text-left font-medium">{grupo.nombre}</th>
                <th scope="col" className="py-2 text-right font-medium">Valor</th>
                <th scope="col" className="py-2 text-right font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((f) => (
                <tr key={f.id} className="border-b border-linea last:border-0">
                  <th scope="row" className="py-2 text-left font-normal">{f.nombre}</th>
                  <td className="cifra py-2 text-right">{f.valor === null ? "—" : formato(f.valor)}</td>
                  <td className="cifra py-2 text-right text-niebla">{f.detalle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <ul className="flex flex-col gap-3">
            {ordenadas.map((f) => (
              <li key={f.id} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3">
                <span className="truncate text-sm">{f.nombre}</span>
                <span className="relative h-2 rounded-full bg-linea" aria-hidden>
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-cauce motion-safe:transition-[width] motion-safe:duration-(--duracion-media)"
                    style={{ width: `${((f.valor ?? 0) / max) * 100}%` }}
                  />
                  {referencia != null && (
                    <span className="absolute -inset-y-1 w-px bg-tinta" style={{ left: `${(referencia / max) * 100}%` }} />
                  )}
                </span>
                <span className="flex flex-col items-end">
                  <span className="cifra text-sm font-medium">{f.valor === null ? "—" : formato(f.valor)}</span>
                  <span className="cifra text-xs text-niebla">{f.detalle}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {referencia != null && etiquetaReferencia && !tabla && (
          <p className="mt-3 flex items-center gap-2 text-xs text-niebla">
            <span aria-hidden className="h-3 w-px bg-tinta" />
            {etiquetaReferencia}
          </p>
        )}
      </div>
    </div>
  );
}
