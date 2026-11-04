import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Proveedores } from "@/components/Proveedores";
import { AppShell } from "@/components/shell/AppShell";
import { COLOR } from "@/config/colores";
import { datosCompactos } from "@/lib/datos";
import "./globals.css";

// Una sola familia, variable: se carga el eje de peso completo (400 a 700) para texto, títulos y cifras.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

// En Vercel se usa el dominio de producción; en local, el servidor de desarrollo.
const dominio = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const descripcion =
  "El journey de adquisición de un marketplace B2B de inmuebles comerciales como un río: dónde se pierde la demanda, cuánto vale y qué experimentos la atacan. Prototipo con datos demo.";

export const metadata: Metadata = {
  metadataBase: new URL(dominio ? `https://${dominio}` : "http://localhost:3000"),
  title: { default: "Cauce · De la primera visita al contrato", template: "%s · Cauce" },
  description: descripcion,
  applicationName: "Cauce",
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "Cauce",
    title: "Cauce · De la primera visita al contrato",
    description: descripcion,
  },
  twitter: { card: "summary_large_image" },
};

// Claro por defecto; <ColorDeBarra> lo actualiza al cambiar de tema con el switch.
export const viewport: Viewport = {
  themeColor: COLOR.fondoB,
  // Sin cover, env(safe-area-inset-*) vale 0 y la barra flotante queda bajo el indicador de inicio.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes agrega la clase del tema antes de hidratar: el atributo class difiere a propósito.
    <html
      lang="es-MX"
      suppressHydrationWarning
      className={`${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Proveedores datos={datosCompactos()}>
          <AppShell>{children}</AppShell>
        </Proveedores>
      </body>
    </html>
  );
}
