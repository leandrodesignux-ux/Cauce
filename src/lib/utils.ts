import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Une clases condicionales y resuelve conflictos de Tailwind (convención de shadcn/ui). */
export function cn(...entradas: ClassValue[]): string {
  return twMerge(clsx(entradas));
}
