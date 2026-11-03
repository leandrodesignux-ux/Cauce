import { Badge } from "@/components/ui/badge";
import { banda } from "@/lib/leads";

const NOMBRE = { alto: "Alto", medio: "Medio", bajo: "Bajo" } as const;

/** Score de intención: banda y número, nunca solo color. */
export function ScoreBadge({ score }: { score: number }) {
  const b = banda(score);
  return (
    <Badge variant={b} title={`Score de intención ${score} de 100`}>
      {NOMBRE[b]}
      <span className="cifra">{score}</span>
    </Badge>
  );
}
