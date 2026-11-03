import { ETAPAS } from "@/config/etapas";
import { formatearEntero, formatearMxn, formatearPct, formatearPp } from "@/lib/formato";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow, TableRowHead } from "@/components/ui/table";
import type { PozaJourney } from "@/lib/journey";

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
  pozas: readonly PozaJourney[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <Table marco className="min-w-[560px]">
        <TableCaption>Volumen y conversión por etapa</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Etapa</TableHead>
            <TableHead className="text-right">Volumen</TableHead>
            {anterior && <TableHead className="text-right">Período anterior</TableHead>}
            <TableHead className="text-right">Conversión desde la etapa anterior</TableHead>
            <TableHead className="text-right">Δ vs. período anterior</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ETAPAS.map((e, i) => {
            const delta = i > 0 ? deltas[i - 1] : null;
            return (
              <TableRow key={e.id}>
                <TableRowHead>{e.nombre}</TableRowHead>
                <TableCell className="cifra text-right">{formatearEntero(volumen[i])}</TableCell>
                {anterior && <TableCell className={`cifra text-right text-tinta-2`}>{formatearEntero(anterior[i])}</TableCell>}
                <TableCell className="cifra text-right">{i > 0 ? formatearPct(tasas[i - 1]) : "—"}</TableCell>
                <TableCell className={`cifra text-right ${tonoDelta(delta)}`}>{i > 0 ? `${flechaDelta(delta)}${formatearPp(delta)}` : "—"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Table marco className="min-w-[560px]">
        <TableCaption>Pozas: lo que se escapa en cada transición</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Poza</TableHead>
            <TableHead>Transición</TableHead>
            <TableHead className="text-right">Perdidos</TableHead>
            <TableHead className="text-right">Valor estimado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pozas.map((p) => (
            <TableRow key={p.id}>
              <TableRowHead>{p.causa}</TableRowHead>
              <TableCell className="text-tinta-2">
                {ETAPAS[p.desde].nombre} → {ETAPAS[p.desde + 1].nombre}
              </TableCell>
              <TableCell className="cifra text-right">{formatearEntero(p.volumen)}</TableCell>
              <TableCell className="cifra text-right text-tinta">{formatearMxn(p.valor)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableRowHead colSpan={3} className="font-medium">
              Valor en riesgo
            </TableRowHead>
            <TableCell className="cifra text-right font-semibold text-tinta">{formatearMxn(pozas.reduce((s, p) => s + p.valor, 0))}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}

export function tonoDelta(delta: number | null): string {
  if (delta === null || Math.abs(delta) < 0.05) return "text-tinta-2";
  return delta > 0 ? "text-azul-texto" : "text-coral-texto";
}

export function flechaDelta(delta: number | null): string {
  if (delta === null || Math.abs(delta) < 0.05) return "";
  return delta > 0 ? "↑ " : "↓ ";
}
