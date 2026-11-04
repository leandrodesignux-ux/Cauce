"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VISTAS, vistaActiva } from "./vistas";

/**
 * Las tres vistas como una pill vidriada, numeradas en el orden de la demo; la activa en color activo.
 * Va debajo del título de cada vista (EncabezadoVista). En móvil, si no entra, se desplaza en horizontal.
 */
export function NavVistas({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Vistas"
      className={`-mx-4 overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] md:mx-0 md:overflow-visible md:px-0 ${className ?? ""}`}
    >
      <ul className="vidrio flex w-max min-w-full gap-1 rounded-boton p-1 md:inline-flex md:min-w-0">
        {VISTAS.map(({ href, numero, nombre }) => {
          const activa = vistaActiva(pathname, href);
          return (
            <li key={href} className="flex shrink-0 grow md:grow-0">
              <Link
                href={href}
                aria-current={activa ? "page" : undefined}
                className={`flex h-10 flex-1 items-center justify-center rounded-[calc(var(--radio-boton)-4px)] px-2 font-medium motion-safe:transition-[color,background-color,transform] motion-safe:duration-(--duracion-presion) motion-safe:ease-salida motion-safe:active:scale-[0.97] md:px-5 ${
                  activa ? "bg-activo text-sobre-activo" : "text-tinta-cuerpo hover:bg-tarjeta hover:text-tinta"
                }`}
              >
                <span aria-hidden className={`cifra mr-1.5 ${activa ? "text-sobre-activo/70" : "text-tinta-cuerpo"}`}>
                  {numero}
                </span>
                {nombre}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
