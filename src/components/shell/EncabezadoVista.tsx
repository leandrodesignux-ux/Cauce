import type { ReactNode } from "react";
import { NavVistas } from "./NavVistas";

/**
 * Encabezado de cada vista: título, subtítulo y, debajo, la nav de vistas (no sticky).
 * El subtítulo va sobre el degradé: tinta-cuerpo, no tinta-2.
 */
export function EncabezadoVista({ titulo, subtitulo, className }: { titulo: string; subtitulo?: ReactNode; className?: string }) {
  return (
    <header className={className}>
      <h1 className="mt-2 font-cifra text-xl leading-tight font-bold text-balance md:text-2xl">{titulo}</h1>
      {subtitulo && <p className="mt-1.5 max-w-3xl text-pretty text-tinta-cuerpo">{subtitulo}</p>}
      <NavVistas className="mt-5" />
    </header>
  );
}
