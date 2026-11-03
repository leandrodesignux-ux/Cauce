import { Droplets } from "lucide-react";
import type { Metadata } from "next";
import { EnConstruccion } from "@/components/EnConstruccion";

export const metadata: Metadata = { title: "Fugas" };

export default function Fugas() {
  return (
    <EnConstruccion
      titulo="Pozas y rescate"
      descripcion="Aquí van a estar el modelo de pérdida, las pozas y el feed de leads para rescatar."
      Icono={Droplets}
    />
  );
}
