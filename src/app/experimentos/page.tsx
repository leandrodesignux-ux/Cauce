import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import { EnConstruccion } from "@/components/EnConstruccion";

export const metadata: Metadata = { title: "Experimentos" };

export default function Experimentos() {
  return (
    <EnConstruccion
      titulo="Registro de hipótesis"
      descripcion="Aquí van a estar la tabla y el timeline de experimentos con su lectura."
      Icono={FlaskConical}
    />
  );
}
