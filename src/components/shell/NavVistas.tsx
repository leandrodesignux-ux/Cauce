"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VISTAS, vistaActiva } from "./vistas";

/** Las tres vistas como una pill vidriada; la activa en pill negra. En móvil ocupa todo el ancho. */
export function NavVistas({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Vistas" className={className}>
      <ul className="vidrio flex gap-1 rounded-full p-1">
        {VISTAS.map(({ href, nombre }) => {
          const activa = vistaActiva(pathname, href);
          return (
            <li key={href} className="flex flex-1 md:flex-none">
              <Link
                href={href}
                aria-current={activa ? "page" : undefined}
                className={`flex h-10 flex-1 items-center justify-center rounded-full px-2 font-medium motion-safe:transition-[color,background-color,transform] motion-safe:duration-(--duracion-presion) motion-safe:ease-salida motion-safe:active:scale-[0.97] md:px-5 ${
                  activa ? "bg-activo text-sobre-activo" : "text-tinta-2 hover:bg-tarjeta hover:text-tinta"
                }`}
              >
                {nombre}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
