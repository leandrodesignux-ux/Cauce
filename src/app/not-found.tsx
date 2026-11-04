import type { Metadata } from "next";
import Link from "next/link";
import { Isotipo } from "@/components/shell/Marca";

export const metadata: Metadata = { title: "Página no encontrada" };

export default function NoEncontrada() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <Isotipo className="size-12" />
      <h1 className="font-cifra text-xl font-semibold">Esta página se fue por una fuga</h1>
      <p className="max-w-sm text-sm text-tinta-cuerpo">La dirección no existe en el prototipo. Vuelva al recorrido o busque una vista, una etapa o un lead con ⌘K.</p>
      <Link href="/" className="mt-2 inline-flex h-9 items-center rounded-control border border-azul bg-azul-relleno px-4 text-sm font-medium text-sobre-relleno">
        Volver al recorrido
      </Link>
    </div>
  );
}
