"use client";

import { Bump } from "@/components/Bump";
import { IconoCirculo } from "@/components/ui/icono-circulo";
import { ArrowRight, Droplets, FlaskConical, UserCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { type ReactNode, useMemo } from "react";
import { useDatos } from "@/components/Proveedores";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import { useFantasmasPendientes } from "@/hooks/useFantasmasPendientes";
import { useTween } from "@/hooks/useTween";
import { formatearEntero, formatearUsdCorto } from "@/lib/formato";
import { type Journey, experimentosActivos } from "@/lib/journey";
import { useRescatadosHoy } from "@/lib/stores";

/** Resumen del home: tres cifras clave, cada una lleva a la vista donde se actúa sobre ella. Al cambiar filtros, interpolan 300 ms. */
export function ResumenCauce({ journey }: { journey: Journey }) {
  const { experimentos } = useDatos();
  const pendientes = useFantasmasPendientes().length;
  const rescatadosHoy = useRescatadosHoy();
  const activos = experimentosActivos(experimentos);
  const fugas = journey.pozas.filter((p) => p.valor > 0).length;
  const reducir = useReducedMotion() ?? false;
  const objetivo = useMemo(() => [journey.valorEnRiesgo, pendientes], [journey.valorEnRiesgo, pendientes]);
  const [valor, porRescatar] = useTween(objetivo, 300, reducir);

  return (
    <section aria-label="Resumen" className="grid gap-3 sm:grid-cols-3">
      <Cifra href="/fugas" Icono={Droplets} tono="coral" etiqueta="Valor en riesgo" valor={formatearUsdCorto(Math.round(valor))}>
        En {fugas} {fugas === 1 ? "fuga" : "fugas"}
      </Cifra>
      <Cifra href={`/fugas?poza=${FUGA_MODELO_PERDIDA}`} Icono={UserCheck} tono="azul" etiqueta="Leads por rescatar" valor={formatearEntero(Math.round(porRescatar))}>
        <Bump clave={rescatadosHoy}>
          <span className="cifra">{formatearEntero(rescatadosHoy)}</span>
        </Bump>{" "}
        rescatados hoy
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
      className={`tarjeta-clicable group flex items-center gap-4 rounded-tarjeta border border-tarjeta-borde bg-tarjeta p-4 shadow-tarjeta md:p-5 ${tono === "coral" ? "tarjeta-coral" : ""}`}
    >
      <IconoCirculo Icono={Icono} tono={tono} />
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-tinta-2">{etiqueta}</span>
        <span className="cifra block text-xl font-semibold">{valor}</span>
        <span className="block text-xs text-tinta-2">{children}</span>
      </span>
      <ArrowRight aria-hidden className="size-4 shrink-0 text-tinta-2 motion-safe:transition-transform motion-safe:duration-(--duracion-presion) group-hover:translate-x-0.5" />
    </Link>
  );
}
