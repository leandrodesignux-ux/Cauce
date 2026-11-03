import type { Metadata } from "next";
import { Suspense } from "react";
import { VistaExperimentos } from "@/components/experimentos/VistaExperimentos";

export const metadata: Metadata = { title: "Experimentos" };

export default function Experimentos() {
  return (
    <Suspense>
      <VistaExperimentos />
    </Suspense>
  );
}
