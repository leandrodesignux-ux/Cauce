import { banda } from "@/lib/leads";

const ESTILO = {
  alto: "border-cauce bg-cauce text-papel",
  medio: "border-laton text-laton",
  bajo: "border-linea-fuerte text-niebla",
} as const;

const NOMBRE = { alto: "Alto", medio: "Medio", bajo: "Bajo" } as const;

/** Score de intención: banda y número, nunca solo color. */
export function ScoreBadge({ score }: { score: number }) {
  const b = banda(score);
  return (
    <span
      title={`Score de intención ${score} de 100`}
      className={`inline-flex h-6 items-center gap-1.5 rounded-control border px-2 text-xs font-medium ${ESTILO[b]}`}
    >
      {NOMBRE[b]}
      <span className="cifra">{score}</span>
    </span>
  );
}
