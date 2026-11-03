import type { LucideIcon } from "lucide-react";

/** Estado vacío de una vista que todavía no se construyó. */
export function EnConstruccion({ titulo, descripcion, Icono }: { titulo: string; descripcion: string; Icono: LucideIcon }) {
  return (
    <div className="flex flex-1 flex-col px-4 py-8 md:px-6 xl:px-8">
      <h1 className="font-cifra text-xl font-semibold">{titulo}</h1>
      <div className="mt-8 flex flex-1 flex-col items-center justify-center gap-3 rounded-panel border border-dashed border-linea-fuerte p-10 text-center">
        <Icono className="size-6 text-niebla" aria-hidden />
        <p className="max-w-sm text-sm text-niebla">{descripcion}</p>
      </div>
    </div>
  );
}
