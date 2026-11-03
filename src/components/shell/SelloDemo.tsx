/** Sello visible "Prototipo con datos demo" en el pie de la navegación. */
export function SelloDemo({ compacto = false }: { compacto?: boolean }) {
  return (
    <p
      title="Prototipo con datos demo"
      className="flex items-center gap-1.5 whitespace-nowrap rounded-control border border-dashed border-linea-fuerte px-2 py-1.5 text-xs text-niebla"
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-laton" />
      <span className={compacto ? "sr-only" : "max-xl:sr-only"}>Prototipo con datos demo</span>
    </p>
  );
}
