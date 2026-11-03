import type { Metadata } from "next";
import { Suspense } from "react";
import { VistaFugas } from "@/components/fugas/VistaFugas";
import { obtenerLeads } from "@/lib/datos";
import { sinLineaDeTiempo } from "@/lib/leads";

export const metadata: Metadata = {
  title: "Pozas y rescate",
  description: "Modelo de pérdida de los fantasmas y feed de leads con intención para rescatar antes de que se enfríen. Prototipo con datos demo.",
  // El openGraph de la página reemplaza al del layout: se repiten sitio, idioma y descripción.
  openGraph: { type: "website", locale: "es_MX", siteName: "Cauce", title: "Pozas y rescate · Cauce", description: "Modelo de pérdida de los fantasmas y feed de leads con intención para rescatar antes de que se enfríen. Prototipo con datos demo." },
};

export default function Fugas() {
  // Solo los leads que están en una poza: son los que se pueden rescatar.
  const leads = sinLineaDeTiempo(obtenerLeads().filter((l) => l.fugaId));
  return (
    <Suspense>
      <VistaFugas leads={leads} />
    </Suspense>
  );
}
