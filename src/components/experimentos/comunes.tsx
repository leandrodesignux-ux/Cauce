import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ETIQUETA_ESTADO_EXPERIMENTO } from "@/config/experimentos";
import { formatearPp } from "@/lib/formato";
import type { EstadoExperimento, Experimento } from "@/lib/tipos";

/** Estado del experimento: etiqueta siempre visible; En curso y Validado comparten tono y se distinguen por punto, ícono e intensidad. */
export function ChipEstado({ estado }: { estado: EstadoExperimento }) {
  return (
    <Badge variant={estado}>
      {estado === "en_curso" && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {estado === "validado" && <Check aria-hidden />}
      {ETIQUETA_ESTADO_EXPERIMENTO[estado]}
    </Badge>
  );
}

export function tonoObservado(e: Experimento): string {
  if (e.observadoPp === undefined) return "text-tinta-2";
  if (e.observadoPp >= e.prediccionPp * 0.8) return "text-azul-texto";
  return e.observadoPp > 0 ? "text-tinta" : "text-coral-texto";
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
      <span className="text-tinta-2" aria-hidden>
        →
      </span>
      <span className={`font-semibold ${tonoObservado(e)}`}>{e.observadoPp === undefined ? "—" : formatearPp(e.observadoPp)}</span>
      <span className="font-sans text-xs text-tinta-2">{veredicto}</span>
    </span>
  );
}
