/** Sello visible "Prototipo · datos demo" en el pie de la navegación. */
export function SelloDemo({ compacto = false }: { compacto?: boolean }) {
  return (
    <p
      title="Prototipo · datos demo"
      className="flex items-center gap-2 rounded-control border border-dashed border-linea-fuerte px-2.5 py-1.5 text-xs text-niebla"
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-laton" />
      <span className={compacto ? "sr-only" : "max-xl:sr-only"}>Prototipo · datos demo</span>
    </p>
  );
}
