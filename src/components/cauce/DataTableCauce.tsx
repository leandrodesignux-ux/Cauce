import { ETAPAS } from "@/config/etapas";
import { formatearEntero, formatearMxn, formatearPct, formatearPp } from "@/lib/formato";
import type { PozaRio } from "./RiverChart";

/** Alternativa accesible del río: exactamente las mismas cifras, en tablas. */
export function DataTableCauce({
  volumen,
  anterior,
  tasas,
  deltas,
  pozas,
}: {
  volumen: readonly number[];
  anterior: readonly number[] | null;
  tasas: readonly (number | null)[];
  deltas: readonly (number | null)[];
  pozas: readonly PozaRio[];
}) {
  const th = "px-3 py-2.5 text-left text-xs font-medium text-niebla";
  const thNum = `${th} text-right`;
  const td = "px-3 py-2.5";
  const tdNum = `${td} cifra text-right`;

  return (
    <div className="flex flex-col gap-8">
      <div className="overflow-x-auto rounded-panel border border-linea bg-papel">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <caption className="px-3 pb-1 pt-3 text-left font-medium">Volumen y conversión por etapa</caption>
          <thead>
            <tr className="border-b border-linea">
              <th scope="col" className={th}>Etapa</th>
              <th scope="col" className={thNum}>Volumen</th>
              {anterior && <th scope="col" className={thNum}>Período anterior</th>}
              <th scope="col" className={thNum}>Conversión desde la etapa anterior</th>
              <th scope="col" className={thNum}>Δ vs. período anterior</th>
            </tr>
          </thead>
          <tbody>
            {ETAPAS.map((e, i) => {
              const delta = i > 0 ? deltas[i - 1] : null;
              return (
                <tr key={e.id} className="border-b border-linea last:border-0">
                  <th scope="row" className={`${td} text-left font-normal`}>{e.nombre}</th>
                  <td className={tdNum}>{formatearEntero(volumen[i])}</td>
                  {anterior && <td className={`${tdNum} text-niebla`}>{formatearEntero(anterior[i])}</td>}
                  <td className={tdNum}>{i > 0 ? formatearPct(tasas[i - 1]) : "—"}</td>
                  <td className={`${tdNum} ${tonoDelta(delta)}`}>{i > 0 ? `${flechaDelta(delta)}${formatearPp(delta)}` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-panel border border-linea bg-papel">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <caption className="px-3 pb-1 pt-3 text-left font-medium">Pozas: lo que se escapa en cada transición</caption>
          <thead>
            <tr className="border-b border-linea">
              <th scope="col" className={th}>Poza</th>
              <th scope="col" className={th}>Transición</th>
              <th scope="col" className={thNum}>Perdidos</th>
              <th scope="col" className={thNum}>Valor estimado</th>
            </tr>
          </thead>
          <tbody>
            {pozas.map((p) => (
              <tr key={p.id} className="border-b border-linea last:border-0">
                <th scope="row" className={`${td} text-left font-normal`}>{p.causa}</th>
                <td className={`${td} text-niebla`}>
                  {ETAPAS[p.desde].nombre} → {ETAPAS[p.desde + 1].nombre}
                </td>
                <td className={tdNum}>{formatearEntero(p.volumen)}</td>
                <td className={`${tdNum} text-laton-texto`}>{formatearMxn(p.valor)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-linea-fuerte">
              <th scope="row" colSpan={3} className={`${td} text-left font-medium`}>Valor en riesgo</th>
              <td className={`${tdNum} font-semibold text-laton-texto`}>{formatearMxn(pozas.reduce((s, p) => s + p.valor, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export function tonoDelta(delta: number | null): string {
  if (delta === null || Math.abs(delta) < 0.05) return "text-niebla";
  return delta > 0 ? "text-cauce-texto" : "text-oxido-texto";
}

export function flechaDelta(delta: number | null): string {
  if (delta === null || Math.abs(delta) < 0.05) return "";
  return delta > 0 ? "↑ " : "↓ ";
}
