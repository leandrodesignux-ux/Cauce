import type { Metadata } from "next";
import { Geist, Space_Grotesk } from "next/font/google";
import { Proveedores } from "@/components/Proveedores";
import { AppShell } from "@/components/shell/AppShell";
import { datosCompactos } from "@/lib/datos";
import "./globals.css";

// Ambas son variables: se carga el eje de peso completo (Space Grotesk 500/600, Geist 400/500).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Cauce", template: "%s · Cauce" },
  description:
    "Journey de adquisición de la primera visita al contrato, con las fugas a la vista. Prototipo con datos demo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-MX"
      className={`${spaceGrotesk.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Proveedores datos={datosCompactos()}>
          <AppShell>{children}</AppShell>
        </Proveedores>
      </body>
    </html>
  );
}
