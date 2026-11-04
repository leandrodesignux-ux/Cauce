"use client";

import { ArrowRight, Droplets, FlaskConical, UserCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useDatos } from "@/components/Proveedores";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import { useFantasmasPendientes } from "@/hooks/useFantasmasPendientes";
import { formatearEntero, formatearMxnCorto } from "@/lib/formato";
import { type Journey, experimentosActivos } from "@/lib/journey";
import { useRescatadosHoy } from "@/lib/stores";

/** Resumen del home: tres cifras clave, cada una lleva a la vista donde se actúa sobre ella. */
export function ResumenCauce({ journey }: { journey: Journey }) {
  const { experimentos } = useDatos();
  const pendientes = useFantasmasPendientes().length;
  const rescatadosHoy = useRescatadosHoy();
  const activos = experimentosActivos(experimentos);
  const fugas = journey.pozas.filter((p) => p.valor > 0).length;

  return (
    <section aria-label="Resumen" className="grid gap-3 sm:grid-cols-3">
      <Cifra href="/fugas" Icono={Droplets} tono="coral" etiqueta="Valor en riesgo" valor={formatearMxnCorto(journey.valorEnRiesgo)}>
        En {fugas} {fugas === 1 ? "fuga" : "fugas"}
      </Cifra>
      <Cifra href={`/fugas?poza=${FUGA_MODELO_PERDIDA}`} Icono={UserCheck} tono="azul" etiqueta="Leads por rescatar" valor={formatearEntero(pendientes)}>
        <span className="cifra">{formatearEntero(rescatadosHoy)}</span> rescatados hoy
      </Cifra>
      <Cifra href="/experimentos" Icono={FlaskConical} tono="azul" etiqueta="Experimentos activos" valor={formatearEntero(activos)}>
        En curso o en lectura, de {experimentos.length}
      </Cifra>
    </section>
  );
}

function Cifra({
  href,
  Icono,
  tono,
  etiqueta,
  valor,
  children,
}: {
  href: string;
  Icono: LucideIcon;
  tono: "azul" | "coral";
  etiqueta: string;
  valor: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-tarjeta border border-tarjeta-borde bg-tarjeta p-4 shadow-tarjeta motion-safe:transition-[background-color,transform] motion-safe:duration-(--duracion-presion) motion-safe:ease-salida motion-safe:active:scale-[0.98] hover:bg-muted md:p-5"
    >
      <span aria-hidden className={`grid size-11 shrink-0 place-items-center rounded-full ${tono === "azul" ? "bg-azul-suave text-azul-texto" : "bg-coral-suave text-coral-texto"}`}>
        <Icono className="size-5" strokeWidth={1.7} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-tinta-2">{etiqueta}</span>
        <span className="cifra block text-xl font-semibold">{valor}</span>
        <span className="block text-xs text-tinta-2">{children}</span>
      </span>
      <ArrowRight aria-hidden className="size-4 shrink-0 text-tinta-2 motion-safe:transition-transform motion-safe:duration-(--duracion-presion) group-hover:translate-x-0.5" />
    </Link>
  );
}
