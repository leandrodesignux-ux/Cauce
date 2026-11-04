"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VISTAS, vistaActiva } from "./vistas";

/**
 * Las tres vistas como una pill vidriada, numeradas en el orden de la demo; la activa en color activo. En móvil ocupa todo el ancho y queda
 * fija arriba (`denso`: material más opaco, el contenido pasa por debajo) para no perder la ubicación al bajar.
 */
export function NavVistas({ className, denso = false }: { className?: string; denso?: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Vistas" className={className}>
      <ul className={`flex gap-1 rounded-boton p-1 ${denso ? "vidrio-denso shadow-tarjeta" : "vidrio"}`}>
        {VISTAS.map(({ href, numero, nombre }) => {
          const activa = vistaActiva(pathname, href);
          return (
            <li key={href} className="flex flex-1 md:flex-none">
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
