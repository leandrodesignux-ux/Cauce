import { experimentos } from "@/lib/datos";
import { TAMANO_OG, imagenExperimentos } from "@/lib/og";

export const alt = "Cauce · Registro de hipótesis: experimentos de Growth en una línea de tiempo";
export const size = TAMANO_OG;
export const contentType = "image/png";

export default function Imagen() {
  return imagenExperimentos(experimentos);
}
