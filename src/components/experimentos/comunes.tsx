import { ETIQUETA_ESTADO_EXPERIMENTO, TONO_ESTADO_EXPERIMENTO } from "@/config/experimentos";
import { formatearPp } from "@/lib/formato";
import type { EstadoExperimento, Experimento } from "@/lib/tipos";

export function ChipEstado({ estado }: { estado: EstadoExperimento }) {
  return (
    <span className={`inline-flex h-6 shrink-0 items-center rounded-control border px-2 text-xs font-medium ${TONO_ESTADO_EXPERIMENTO[estado]}`}>
      {ETIQUETA_ESTADO_EXPERIMENTO[estado]}
    </span>
  );
}

export function tonoObservado(e: Experimento): string {
  if (e.observadoPp === undefined) return "text-niebla";
  if (e.observadoPp >= e.prediccionPp * 0.8) return "text-cauce";
  return e.observadoPp > 0 ? "text-laton" : "text-oxido";
}

/** Predicho → observado, con veredicto en texto (nunca solo color). */
export function PredichoObservado({ e, compacto = false }: { e: Experimento; compacto?: boolean }) {
  const veredicto =
    e.observadoPp === undefined
      ? "sin lectura"
      : e.observadoPp >= e.prediccionPp * 0.8
        ? "cumple"
        : e.observadoPp > 0
          ? "por debajo"
          : "sin efecto";
  return (
    <span className={`cifra inline-flex flex-wrap items-baseline gap-x-1.5 ${compacto ? "text-xs" : "text-sm"}`}>
      <span>{formatearPp(e.prediccionPp)}</span>
      <span className="text-niebla" aria-hidden>
        →
      </span>
      <span className={`font-semibold ${tonoObservado(e)}`}>{e.observadoPp === undefined ? "—" : formatearPp(e.observadoPp)}</span>
      <span className="font-sans text-xs text-niebla">{veredicto}</span>
    </span>
  );
}
