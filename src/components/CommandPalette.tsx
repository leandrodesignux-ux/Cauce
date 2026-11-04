"use client";

import { ArrowRightLeft, CircleDot, CircleHelp, Droplet, FlaskConical, RotateCcw, Table2, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { create } from "zustand";
import { SECTORES } from "@/config/dimensiones";
import { ETAPAS, TRANSICIONES, nombreEtapa } from "@/config/etapas";
import { useFiltros } from "@/hooks/useFiltros";
import { useDatos } from "./Proveedores";
import { VISTAS } from "./shell/vistas";
import { ETIQUETA_ESTADO_EXPERIMENTO } from "@/config/experimentos";
import { causaVisible } from "@/config/pozas";
import { useOnboarding } from "./onboarding/Onboarding";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./ui/command";

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
  // Se abre por atajo o desde la nav, sin DialogTrigger: el foco vuelve a donde estaba.
  const previo = useRef<HTMLElement | null>(null);

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

  /** Las acciones de filtro aplican al recorrido: si no está en /, lleva ahí. */
  const enCauce = (accion: () => void, href: string) => {
    fijar(false);
    if (pathname === "/") accion();
    else router.push(href);
  };

  return (
    <CommandDialog
      open={abierta}
      onOpenChange={fijar}
      title="Buscar o saltar a"
      description="Vistas, etapas, fugas, experimentos y leads."
      className="top-[12vh] sm:max-w-xl"
      onOpenAutoFocus={() => {
        previo.current = document.activeElement as HTMLElement | null;
      }}
      onCloseAutoFocus={(e) => {
        // Si se navegó a otra vista, el elemento ya no está en el DOM: lo resuelve el router.
        if (!previo.current?.isConnected) return;
        e.preventDefault();
        previo.current.focus();
      }}
    >
      <Command loop label="Buscar o saltar a">
        <CommandInput placeholder="Buscar vista, etapa, fuga, experimento o lead…" />
        <CommandList className="max-h-[min(60vh,420px)] overscroll-contain">
          <CommandEmpty>
            Sin resultados. Pruebe con el nombre de una etapa o un lead.
          </CommandEmpty>

          <Grupo titulo="Vistas">
            {VISTAS.map(({ href, nombre, descripcion, Icono }) => (
              <Item key={href} valor={`vista ${nombre}`} onSelect={() => ir(href)} icono={<Icono />} detalle={descripcion}>
                {nombre}
              </Item>
            ))}
          </Grupo>

          <Grupo titulo="Acciones en el recorrido">
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
              {estado.tabla ? "Ver como recorrido" : "Ver como tabla"}
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

          <Grupo titulo="Fugas">
            {fugas.map((f) => (
              <Item
                key={f.id}
                valor={`fuga ${causaVisible(f)}`}
                onSelect={() => ir(`/fugas?poza=${f.id}`)}
                icono={<Droplet className="text-coral-texto" />}
                detalle={`${nombreEtapa(f.desde)} → ${nombreEtapa(f.hacia)}`}
              >
                {causaVisible(f)}
              </Item>
            ))}
          </Grupo>

          <Grupo titulo="Ayuda">
            <Item
              valor="ver cómo funciona"
              palabras={["como funciona", "ayuda", "tutorial", "onboarding"]}
              onSelect={() => {
                fijar(false);
                useOnboarding.getState().abrir();
              }}
              icono={<CircleHelp />}
            >
              Ver cómo funciona
            </Item>
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

          <Grupo titulo="Leads en fugas">
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
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <CommandGroup heading={titulo}>{children}</CommandGroup>
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
    <CommandItem value={valor} keywords={palabras} onSelect={onSelect}>
      <span className="flex text-muted-foreground" aria-hidden>
        {icono}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {detalle && <span className="max-w-[45%] truncate text-xs text-muted-foreground">{detalle}</span>}
    </CommandItem>
  );
}
