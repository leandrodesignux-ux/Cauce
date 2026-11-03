"use client";

import { Command } from "cmdk";
import { ArrowRightLeft, CircleDot, Droplet, FlaskConical, RotateCcw, Table2, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { create } from "zustand";
import { SECTORES } from "@/config/dimensiones";
import { ETAPAS, TRANSICIONES, nombreEtapa } from "@/config/etapas";
import { useFiltros } from "@/hooks/useFiltros";
import { useDatos } from "./Proveedores";
import { VISTAS } from "./shell/vistas";
import { ETIQUETA_ESTADO_EXPERIMENTO } from "@/config/experimentos";

type Paleta = { abierta: boolean; abrir: () => void; fijar: (abierta: boolean) => void };

export const usePaleta = create<Paleta>()((set) => ({
  abierta: false,
  abrir: () => set({ abierta: true }),
  fijar: (abierta) => set({ abierta }),
}));

/** Paleta de comandos ⌘K / Ctrl+K: saltar a una vista, etapa, poza, experimento o lead. */
export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { fugas, experimentos, leads } = useDatos();
  const { estado, actualizar, restablecer } = useFiltros();
  const abierta = usePaleta((s) => s.abierta);
  const fijar = usePaleta((s) => s.fijar);

  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        fijar(!usePaleta.getState().abierta);
      }
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [fijar]);

  const ir = (href: string) => {
    fijar(false);
    router.push(href);
  };

  /** Las acciones de filtro aplican al cauce: si no está en /, lleva ahí. */
  const enCauce = (accion: () => void, href: string) => {
    fijar(false);
    if (pathname === "/") accion();
    else router.push(href);
  };

  return (
    <Command.Dialog
      open={abierta}
      onOpenChange={fijar}
      label="Buscar o saltar a"
      loop
      overlayClassName="fixed inset-0 z-40 bg-tinta/30 backdrop-blur-[2px]"
      contentClassName="fixed inset-x-3 top-[12vh] z-50 mx-auto max-w-xl overflow-hidden rounded-panel border border-linea bg-papel shadow-flotante"
    >
      <Command.Input
        placeholder="Buscar vista, etapa, poza, experimento o lead…"
        className="h-12 w-full border-b border-linea bg-transparent px-4 text-base outline-none placeholder:text-niebla"
      />
      <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto overscroll-contain p-2">
        <Command.Empty className="px-3 py-6 text-center text-sm text-niebla">
          Sin resultados. Pruebe con el nombre de una etapa o un lead.
        </Command.Empty>

        <Grupo titulo="Vistas">
          {VISTAS.map(({ href, nombre, descripcion, Icono }) => (
            <Item key={href} valor={`vista ${nombre}`} onSelect={() => ir(href)} icono={<Icono />} detalle={descripcion}>
              {nombre}
            </Item>
          ))}
        </Grupo>

        <Grupo titulo="Acciones en el cauce">
          <Item
            valor="comparar con período anterior"
            onSelect={() => enCauce(() => actualizar((a) => ({ comparar: !a.comparar })), "/?comparar=1")}
            icono={<ArrowRightLeft />}
          >
            {estado.comparar ? "Dejar de comparar con período anterior" : "Comparar con período anterior"}
          </Item>
          <Item
            valor="ver como tabla"
            onSelect={() => enCauce(() => actualizar((a) => ({ tabla: !a.tabla })), "/?vista=tabla")}
            icono={<Table2 />}
          >
            {estado.tabla ? "Ver como flujo" : "Ver como tabla"}
          </Item>
          <Item valor="restablecer filtros" onSelect={() => enCauce(restablecer, "/")} icono={<RotateCcw />}>
            Restablecer filtros
          </Item>
        </Grupo>

        <Grupo titulo="Etapas y transiciones">
          {ETAPAS.map((e) => (
            <Item key={e.id} valor={`etapa ${e.nombre}`} onSelect={() => ir(`/?etapa=${e.id}`)} icono={<CircleDot />} detalle={e.definicion}>
              {e.nombre}
            </Item>
          ))}
          {TRANSICIONES.map((t) => {
            const nombre = `${nombreEtapa(t.desde)} → ${nombreEtapa(t.hacia)}`;
            return (
              <Item key={t.desde} valor={`transición ${nombre}`} onSelect={() => ir(`/?transicion=${t.desde}-${t.hacia}`)} icono={<ArrowRightLeft />}>
                {nombre}
              </Item>
            );
          })}
        </Grupo>

        <Grupo titulo="Pozas">
          {fugas.map((f) => (
            <Item
              key={f.id}
              valor={`poza ${f.causa}`}
              onSelect={() => ir(`/fugas?poza=${f.id}`)}
              icono={<Droplet className="text-oxido" />}
              detalle={`${nombreEtapa(f.desde)} → ${nombreEtapa(f.hacia)}`}
            >
              {f.causa}
            </Item>
          ))}
        </Grupo>

        <Grupo titulo="Experimentos">
          {experimentos.map((e) => (
            <Item
              key={e.id}
              valor={`experimento ${e.nombre}`}
              onSelect={() => ir(`/experimentos?exp=${e.id}`)}
              icono={<FlaskConical />}
              detalle={ETIQUETA_ESTADO_EXPERIMENTO[e.estado]}
            >
              {e.nombre}
            </Item>
          ))}
        </Grupo>

        <Grupo titulo="Leads en pozas">
          {leads
            .filter((l) => l.fugaId)
            .map((l) => (
              <Item
                key={l.id}
                valor={`lead ${l.nombre} ${l.id}`}
                palabras={[l.estado, SECTORES.find((s) => s.id === l.sector)!.nombre]}
                onSelect={() => ir(`/fugas?poza=${l.fugaId}&lead=${l.id}`)}
                icono={<User />}
                detalle={`${SECTORES.find((s) => s.id === l.sector)!.nombre} · ${l.estado} · score ${l.score}`}
              >
                {l.nombre}
              </Item>
            ))}
        </Grupo>
      </Command.List>
    </Command.Dialog>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Command.Group
      heading={titulo}
      className="mb-1 [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-niebla"
    >
      {children}
    </Command.Group>
  );
}

function Item({
  valor,
  palabras,
  onSelect,
  icono,
  detalle,
  children,
}: {
  valor: string;
  palabras?: string[];
  onSelect: () => void;
  icono: ReactNode;
  detalle?: string;
  children: ReactNode;
}) {
  return (
    <Command.Item
      value={valor}
      keywords={palabras}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-control px-2.5 py-2 text-sm data-[selected=true]:bg-cauce-suave data-[selected=true]:text-tinta [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-niebla"
    >
      {icono}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {detalle && <span className="max-w-[45%] truncate text-xs text-niebla">{detalle}</span>}
    </Command.Item>
  );
}
