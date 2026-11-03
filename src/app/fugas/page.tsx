import type { Metadata } from "next";
import { Suspense } from "react";
import { VistaFugas } from "@/components/fugas/VistaFugas";
import { obtenerLeads } from "@/lib/datos";
import { sinLineaDeTiempo } from "@/lib/leads";

export const metadata: Metadata = { title: "Fugas" };

export default function Fugas() {
  // Solo los leads que están en una poza: son los que se pueden rescatar.
  const leads = sinLineaDeTiempo(obtenerLeads().filter((l) => l.fugaId));
  return (
    <Suspense>
      <VistaFugas leads={leads} />
    </Suspense>
  );
}
