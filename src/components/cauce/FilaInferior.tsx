"use client";

import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { useDatos } from "@/components/Proveedores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableRowHead } from "@/components/ui/table";
import { SECTORES } from "@/config/dimensiones";
import { nombreEtapa } from "@/config/etapas";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import { formatearEntero, formatearMxnCompacto } from "@/lib/formato";
import { type Journey, valorPorFase } from "@/lib/journey";
import { DIAS_VENTANA_CRITICA, banda, diasSinActividad } from "@/lib/leads";
import { esHoy, useSesion } from "@/lib/stores";
import { useFantasmasPendientes } from "./TiraFantasmas";

const FILAS = 4;
const ETIQUETA_BANDA = { alto: "Alto", medio: "Medio", bajo: "Bajo" } as const;
const NOMBRE_SECTOR = Object.fromEntries(SECTORES.map((s) => [s.id, s.nombre]));

/** Fila inferior del home: los fantasmas con mayor score para rescatar ahí mismo y los medidores. */
export function FilaInferior({ journey }: { journey: Journey }) {
  return (
    <div className="mt-6 grid gap-6 tablero:grid-cols-[1.35fr_1fr]">
      <TablaFantasmas />
      <Medidores journey={journey} />
    </div>
  );
}

function TablaFantasmas() {
  const { fugas } = useDatos();
  const pendientes = useFantasmasPendientes();
  const { rescatar, restaurar } = useSesion.getState();
  const destino = nombreEtapa(fugas.find((f) => f.id === FUGA_MODELO_PERDIDA)!.hacia);
  const filas = pendientes.slice(0, FILAS);

  const alRescatar = (id: string, nombre: string) => {
    const siguiente = filas[filas.findIndex((l) => l.id === id) + 1]?.id ?? pendientes[FILAS]?.id;
    rescatar([id]);
    // Un aviso por vez: el nuevo reemplaza al anterior y reinicia los 5 s.
    toast.dismiss();
    toast(`${nombre} rescatado: vuelve al cauce en ${destino}.`, {
      duration: 5000,
      action: { label: "Deshacer", onClick: () => restaurar([id]) },
    });
    // La fila sale de la tabla: el foco pasa al Rescatar de la siguiente (o al enlace del encabezado).
    requestAnimationFrame(() =>
      (document.querySelector<HTMLElement>(`[data-rescatar="${siguiente}"]`) ?? document.querySelector<HTMLElement>("[data-ver-fantasmas]"))?.focus(),
    );
  };

  return (
    <section aria-labelledby="t-fantasmas" className="vidrio rounded-tarjeta p-3 shadow-tarjeta md:rounded-panel md:p-7">
      <div className="mb-4 flex flex-wrap items-center gap-4 px-1 pt-1 md:mb-6 md:p-0">
        <h2 id="t-fantasmas" className="font-cifra text-lg font-semibold">
          Fantasmas por rescatar
        </h2>
        <Button asChild variant="filtro" size="lg" className="md:ml-auto">
          <Link href={`/fugas?poza=${FUGA_MODELO_PERDIDA}`} data-ver-fantasmas>
            Ver los {formatearEntero(pendientes.length)}
          </Link>
        </Button>
      </div>
      {filas.length === 0 ? (
        <p className="px-1 py-6 text-sm text-tinta-2">No quedan fantasmas pendientes. Los rescatados se pueden revisar en Fugas.</p>
      ) : (
        <Table>
          <TableHeader className="max-md:hidden">
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Intención</TableHead>
              <TableHead>Sin atención</TableHead>
              <TableHead>Busca</TableHead>
              <TableHead>
                <span className="sr-only">Acción</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((l) => {
              const dias = diasSinActividad(l);
              const b = banda(l.score);
              return (
                <TableRow key={l.id} className="max-md:grid max-md:grid-cols-[1fr_auto] max-md:items-center max-md:gap-x-3 max-md:gap-y-2 max-md:py-3">
                  <TableRowHead className="font-medium whitespace-nowrap max-md:p-0">{l.nombre}</TableRowHead>
                  <TableCell className="max-md:p-0 max-md:text-right">
                    <Badge variant={b}>
                      {ETIQUETA_BANDA[b]} <span className="cifra">{l.score}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="max-md:p-0">
                    <Badge variant={dias > DIAS_VENTANA_CRITICA ? "atrasado" : "critica"} className="cifra">
                      {dias} {dias === 1 ? "día" : "días"}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-tinta-2 max-md:hidden">
                    {NOMBRE_SECTOR[l.sector]} · {l.estado}
                  </TableCell>
                  <TableCell className="max-md:p-0 max-md:text-right md:text-right">
                    <Button variant="coral" size="sm" data-rescatar={l.id} aria-label={`Rescatar a ${l.nombre}`} onClick={() => alRescatar(l.id, l.nombre)}>
                      Rescatar
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

const TONO_FASE = { atraer: "stroke-coral-relleno", convertir: "stroke-coral", cerrar: "stroke-azul" } as const;
const MUESTRA_FASE = { atraer: "bg-coral-relleno", convertir: "bg-coral", cerrar: "bg-azul" } as const;

function Medidores({ journey }: { journey: Journey }) {
  const { leads } = useDatos();
  const rescatados = useSesion((s) => s.rescatados);
  const pendientes = useFantasmasPendientes().length;
  const fases = useMemo(() => valorPorFase(journey.pozas), [journey.pozas]);
  const hoy = useMemo(
    () => leads.filter((l) => l.fugaId === FUGA_MODELO_PERDIDA && rescatados[l.id] && esHoy(rescatados[l.id])).length,
    [leads, rescatados],
  );
  // Los fantasmas del día: los que siguen pendientes más los que ya se rescataron hoy.
  const delDia = pendientes + hoy;
  const pozas = journey.pozas.filter((p) => p.valor > 0).length;
  const pct = (p: number) => `${Math.round(p * 100)} %`;

  return (
    <section aria-labelledby="t-valor" className="vidrio rounded-tarjeta p-3 shadow-tarjeta md:rounded-panel md:p-7">
      <h2 id="t-valor" className="mb-4 px-1 pt-1 font-cifra text-lg font-semibold md:mb-6 md:p-0">
        Valor en riesgo
      </h2>
      <div className="grid grid-cols-2 items-start gap-4">
        <div className="text-center">
          <Medidor
            etiqueta={`Valor en riesgo por fase: ${fases.map((f) => `${f.nombre} ${formatearMxnCompacto(f.valor)}`).join(", ")}`}
            tramos={fases.map((f) => ({ proporcion: f.proporcion, clase: TONO_FASE[f.fase] }))}
          />
          <p className="cifra text-xl font-semibold">{formatearMxnCompacto(journey.valorEnRiesgo)}</p>
          <p className="text-xs text-tinta-2">
            MXN en {pozas} {pozas === 1 ? "poza" : "pozas"}
          </p>
          <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2.5 text-xs text-tinta-2">
            {fases.map((f) => (
              <li key={f.fase} className="inline-flex items-center gap-1.5">
                <span aria-hidden className={`size-2.5 rounded-[3px] ${MUESTRA_FASE[f.fase]}`} />
                {f.nombre} <span className="cifra">{pct(f.proporcion)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-center">
          <Medidor
            etiqueta={`Rescatados hoy: ${hoy} de ${delDia} fantasmas`}
            tramos={[{ proporcion: delDia > 0 ? hoy / delDia : 0, clase: "stroke-azul-relleno" }]}
          />
          <p className="cifra text-xl font-semibold">
            {formatearEntero(hoy)} <span className="text-base text-tinta-2">de {formatearEntero(delDia)}</span>
          </p>
          <p className="text-xs text-tinta-2">Fantasmas rescatados hoy</p>
        </div>
      </div>
    </section>
  );
}

/** Semicírculo: arco base en --linea y tramos consecutivos (proporciones 0–1) separados por una pequeña pausa. */
function Medidor({ etiqueta, tramos }: { etiqueta: string; tramos: { proporcion: number; clase: string }[] }) {
  const R = 80;
  const arco = (desde: number, hasta: number) => {
    const a0 = Math.PI * (1 - desde);
    const a1 = Math.PI * (1 - hasta);
    const p = (a: number) => `${(100 + R * Math.cos(a)).toFixed(2)} ${(100 - R * Math.sin(a)).toFixed(2)}`;
    return `M${p(a0)}A${R} ${R} 0 0 1 ${p(a1)}`;
  };
  const PAUSA = 0.005;
  const segmentos = tramos.map((t, i) => {
    const inicio = tramos.slice(0, i).reduce((s, x) => s + x.proporcion, 0);
    const desde = inicio + (i > 0 ? PAUSA : 0);
    return { ...t, desde, hasta: Math.max(desde, inicio + t.proporcion) };
  });

  return (
    <svg viewBox="0 0 200 110" role="img" aria-label={etiqueta} className="mx-auto h-auto w-full max-w-60">
      <path d="M20 100a80 80 0 0 1 160 0" fill="none" className="stroke-linea" strokeWidth={22} />
      {segmentos
        .filter((s) => s.hasta - s.desde > 0.0005)
        .map((s) => (
          <path key={s.clase} d={arco(s.desde, s.hasta)} fill="none" className={s.clase} strokeWidth={22} />
        ))}
    </svg>
  );
}
