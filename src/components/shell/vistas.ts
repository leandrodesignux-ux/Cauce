import { Droplets, FlaskConical, Waves, type LucideIcon } from "lucide-react";

export const VISTAS: readonly { href: string; nombre: string; descripcion: string; Icono: LucideIcon }[] = [
  { href: "/", nombre: "Cauce", descripcion: "El journey completo, de la visita al contrato", Icono: Waves },
  { href: "/fugas", nombre: "Fugas", descripcion: "Pozas, modelo de pérdida y rescate de leads", Icono: Droplets },
  { href: "/experimentos", nombre: "Experimentos", descripcion: "Registro de hipótesis y su lectura", Icono: FlaskConical },
];

export function vistaActiva(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
