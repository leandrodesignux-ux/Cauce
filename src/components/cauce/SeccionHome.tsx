import type { ReactNode } from "react";

/** Sección del home: panel vidriado con título, una línea de contexto y una acción opcional a la derecha. */
export function SeccionHome({
  id,
  titulo,
  descripcion,
  accion,
  children,
}: {
  id: string;
  titulo: string;
  descripcion?: ReactNode;
  accion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="vidrio mt-6 rounded-tarjeta p-3 shadow-tarjeta md:rounded-panel md:p-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-1 pt-1 md:mb-6 md:p-0">
        <div className="min-w-0">
          <h2 id={id} className="font-cifra text-lg font-semibold">
            {titulo}
          </h2>
          {descripcion && <p className="text-sm text-pretty text-tinta-cuerpo">{descripcion}</p>}
        </div>
        {accion}
      </div>
      {children}
    </section>
  );
}
