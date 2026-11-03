/** Isotipo: el cauce que avanza en azul y, debajo, la fuga punteada en coral. */
export function Isotipo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <path d="M4 8c6 0 8 6 12 6s6-6 12-6v6c-6 0-8 6-12 6S10 14 4 14z" fill="var(--azul-relleno)" />
      <path d="M4 20c6 0 8 4 12 4s6-4 12-4" stroke="var(--coral)" strokeWidth="2" strokeDasharray="3 3" />
    </svg>
  );
}

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Isotipo className="size-7 shrink-0" />
      {!compacta && <span className="font-cifra text-lg font-semibold tracking-tight">Cauce</span>}
    </span>
  );
}
