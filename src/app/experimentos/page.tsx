import type { Metadata } from "next";
import { Suspense } from "react";
import { VistaExperimentos } from "@/components/experimentos/VistaExperimentos";

export const metadata: Metadata = {
  title: "Registro de hipótesis",
  description: "Qué espera mover cada experimento de Growth, cuándo se puede leer y qué pasó de verdad. Prototipo con datos demo.",
  // El openGraph de la página reemplaza al del layout: se repiten sitio, idioma y descripción.
  openGraph: { type: "website", locale: "es_MX", siteName: "Cauce", title: "Registro de hipótesis · Cauce", description: "Qué espera mover cada experimento de Growth, cuándo se puede leer y qué pasó de verdad. Prototipo con datos demo." },
};

export default function Experimentos() {
  return (
    <Suspense>
      <VistaExperimentos />
    </Suspense>
  );
}
