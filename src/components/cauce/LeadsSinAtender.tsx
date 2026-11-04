"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useDatos } from "@/components/Proveedores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableRowHead } from "@/components/ui/table";
import { SECTORES } from "@/config/dimensiones";
import { nombreEtapa } from "@/config/etapas";
import { FUGA_MODELO_PERDIDA } from "@/config/modelo";
import { useFantasmasPendientes } from "@/hooks/useFantasmasPendientes";
import { formatearEntero } from "@/lib/formato";
import { DIAS_VENTANA_CRITICA, banda, diasSinActividad } from "@/lib/leads";
import { useSesion } from "@/lib/stores";
import { SeccionHome } from "./SeccionHome";

const FILAS = 4;
const ETIQUETA_BANDA = { alto: "Alto", medio: "Medio", bajo: "Bajo" } as const;
const NOMBRE_SECTOR = Object.fromEntries(SECTORES.map((s) => [s.id, s.nombre]));

/**
 * Leads sin atender: los 4 pendientes con mayor score de la fuga del modelo de pérdida, con Rescatar real
 * (store + aviso con Deshacer). El foco pasa al Rescatar de la fila siguiente.
 */
export function LeadsSinAtender() {
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
    toast(`${nombre} rescatado: vuelve al recorrido en ${destino}.`, {
      duration: 5000,
      action: { label: "Deshacer", onClick: () => restaurar([id]) },
    });
    // La fila sale de la tabla: el foco pasa al Rescatar de la siguiente (o al enlace del encabezado).
    requestAnimationFrame(() =>
      (document.querySelector<HTMLElement>(`[data-rescatar="${siguiente}"]`) ?? document.querySelector<HTMLElement>("[data-ver-fantasmas]"))?.focus(),
    );
  };

  return (
    <SeccionHome
      id="t-sin-atender"
      titulo="Leads sin atender"
      descripcion="Conversaciones con intención que nunca llegaron a un broker. Los de mayor score, primero."
      accion={
        <Button asChild variant="outline" size="lg">
          <Link href={`/fugas?poza=${FUGA_MODELO_PERDIDA}`} data-ver-fantasmas>
            Ver los {formatearEntero(pendientes.length)}
          </Link>
        </Button>
      }
    >
      {filas.length === 0 ? (
        <p className="px-1 py-6 text-sm text-tinta-2">No quedan leads sin atender. Los rescatados se pueden revisar en Rescate.</p>
      ) : (
        <Table marco>
          <TableHeader className="max-md:hidden">
            <TableRow>
              <TableHead className="pl-5">Lead</TableHead>
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
                <TableRow key={l.id} className="max-md:grid max-md:grid-cols-[1fr_auto] max-md:items-center max-md:gap-x-3 max-md:gap-y-2 max-md:px-4 max-md:py-3">
                  <TableRowHead className="font-medium whitespace-nowrap max-md:p-0 md:py-3 md:pl-5">{l.nombre}</TableRowHead>
                  <TableCell className="max-md:p-0 max-md:text-right md:py-3">
                    <Badge variant={b}>
                      {ETIQUETA_BANDA[b]} <span className="cifra">{l.score}</span>
                    </Badge>
                  </TableCell>
                  <TableCell className="max-md:p-0 md:py-3">
                    <Badge variant={dias > DIAS_VENTANA_CRITICA ? "atrasado" : "critica"} className="cifra">
                      {dias} {dias === 1 ? "día" : "días"}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-tinta-2 max-md:hidden md:py-3">
                    {NOMBRE_SECTOR[l.sector]} · {l.estado}
                  </TableCell>
                  <TableCell className="max-md:p-0 max-md:text-right md:py-3 md:pr-5 md:text-right">
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
    </SeccionHome>
  );
}
