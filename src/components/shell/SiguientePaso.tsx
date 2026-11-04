import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { VISTAS } from "./vistas";

/** Texto del link de cada vista hacia la siguiente, en el orden de la demo (la última vuelve a la primera). */
const ACCION: Record<string, string> = {
  "/": "Ver los leads por rescatar",
  "/fugas": "Ver qué se está probando",
  "/experimentos": "Volver al recorrido",
};

/** Tarjeta al final de cada vista: lleva a la siguiente para que la demo se lea en orden. */
export function SiguientePaso({ desde, className }: { desde: string; className?: string }) {
  const i = VISTAS.findIndex((v) => v.href === desde);
  const siguiente = VISTAS[(i + 1) % VISTAS.length];
  return (
    <nav aria-label="Siguiente paso" className={className}>
      <Link
        href={siguiente.href}
        className="group flex items-center gap-4 rounded-tarjeta border border-tarjeta-borde bg-tarjeta p-5 shadow-tarjeta motion-safe:transition-[background-color,transform] motion-safe:duration-(--duracion-presion) motion-safe:ease-salida motion-safe:active:scale-[0.99] hover:bg-muted md:p-6"
      >
        <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-azul-suave text-azul-texto">
          <siguiente.Icono className="size-5" strokeWidth={1.7} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-tinta-2">
            Siguiente paso · <span className="cifra">{siguiente.numero}</span> {siguiente.nombre}
          </span>
          <span className="block font-cifra text-lg font-semibold">{ACCION[desde]}</span>
          <span className="block text-sm text-tinta-2">{siguiente.descripcion}</span>
        </span>
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-activo text-sobre-activo motion-safe:transition-transform motion-safe:duration-(--duracion-presion) motion-safe:ease-salida group-hover:translate-x-0.5"
        >
          <ArrowRight className="size-4" />
        </span>
      </Link>
    </nav>
  );
}
