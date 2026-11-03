"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableRowHead } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type FilaDesglose = { id: string; nombre: string; valor: number | null; detalle: string };
export type GrupoDesglose = { clave: string; nombre: string; filas: FilaDesglose[] };

/** Desglose por canal, sector y estado: pestañas con barras horizontales ordenadas. */
export function Desglose({
  grupos,
  formato,
  referencia,
  etiquetaReferencia,
  tabla,
}: {
  grupos: GrupoDesglose[];
  formato: (v: number) => string;
  /** Línea vertical de referencia (por ejemplo, la tasa del total filtrado). */
  referencia?: number | null;
  etiquetaReferencia?: string;
  tabla: boolean;
}) {
  const [activo, setActivo] = useState(grupos[0].clave);
  const grupo = grupos.find((g) => g.clave === activo) ?? grupos[0];
  const ordenadas = [...grupo.filas].sort((a, b) => (b.valor ?? -1) - (a.valor ?? -1));
  const max = Math.max(...ordenadas.map((f) => f.valor ?? 0), referencia ?? 0, 1e-9);

  return (
    <Tabs value={grupo.clave} onValueChange={setActivo}>
      <TabsList variant="line" aria-label="Desglose" className="w-full justify-start">
        {grupos.map((g) => (
          <TabsTrigger key={g.clave} value={g.clave} className="flex-none px-3">
            {g.nombre}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={grupo.clave} className="pt-2">
        {tabla ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-0">{grupo.nombre}</TableHead>
                <TableHead className="px-0 text-right">Valor</TableHead>
                <TableHead className="px-0 text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenadas.map((f) => (
                <TableRow key={f.id}>
                  <TableRowHead className="px-0 py-2">{f.nombre}</TableRowHead>
                  <TableCell className="cifra px-0 py-2 text-right">{f.valor === null ? "—" : formato(f.valor)}</TableCell>
                  <TableCell className="cifra px-0 py-2 text-right text-niebla">{f.detalle}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <ul className="flex flex-col gap-3">
            {ordenadas.map((f) => (
              <li key={f.id} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3">
                <span className="truncate text-sm">{f.nombre}</span>
                <span className="relative h-2 rounded-full bg-linea" aria-hidden>
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-cauce motion-safe:transition-[width] motion-safe:duration-(--duracion-media)"
                    style={{ width: `${((f.valor ?? 0) / max) * 100}%` }}
                  />
                  {referencia != null && (
                    <span className="absolute -inset-y-1 w-px bg-tinta" style={{ left: `${(referencia / max) * 100}%` }} />
                  )}
                </span>
                <span className="flex flex-col items-end">
                  <span className="cifra text-sm font-medium">{f.valor === null ? "—" : formato(f.valor)}</span>
                  <span className="cifra text-xs text-niebla">{f.detalle}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
        {referencia != null && etiquetaReferencia && !tabla && (
          <p className="mt-3 flex items-center gap-2 text-xs text-niebla">
            <span aria-hidden className="h-3 w-px bg-tinta" />
            {etiquetaReferencia}
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
