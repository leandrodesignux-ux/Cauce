import { Droplets, FlaskConical, Route, type LucideIcon } from "lucide-react";

/** Las tres vistas en el orden de la demo. `numero` se muestra antes del nombre en la nav. */
export const VISTAS: readonly { href: string; numero: number; nombre: string; descripcion: string; Icono: LucideIcon }[] = [
  { href: "/", numero: 1, nombre: "Recorrido", descripcion: "Dónde avanza y dónde se pierde la demanda", Icono: Route },
  { href: "/fugas", numero: 2, nombre: "Rescate", descripcion: "Fugas, su valor y leads por rescatar", Icono: Droplets },
  { href: "/experimentos", numero: 3, nombre: "Experimentos", descripcion: "Qué se está probando y si funciona", Icono: FlaskConical },
];

export function vistaActiva(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
