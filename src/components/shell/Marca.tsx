/** Isotipo: el cauce que se angosta y una gota que se escapa. */
export function Isotipo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M2 4.5C9 4.5 11.5 9 22 10v4C11.5 15 9 19.5 2 19.5z" fill="var(--cauce)" />
      <path d="M12 8.6C15 9.6 18 9.9 22 10v4c-4 .1-7 .4-10 1.4z" fill="var(--papel)" fillOpacity="0.22" />
      <circle cx="14.5" cy="21" r="1.6" fill="var(--oxido)" />
    </svg>
  );
}

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Isotipo className="size-6 shrink-0" />
      {!compacta && <span className="font-cifra text-lg font-semibold tracking-tight">Cauce</span>}
    </span>
  );
}
