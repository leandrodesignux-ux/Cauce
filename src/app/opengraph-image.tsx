import { TAMANO_OG, imagenCauce } from "@/lib/og";

export const alt = "Cauce · Recorrido de adquisición: dónde avanza y dónde se pierde la demanda, con el valor de cada fuga en MXN";
export const size = TAMANO_OG;
export const contentType = "image/png";

export default function Imagen() {
  return imagenCauce();
}
