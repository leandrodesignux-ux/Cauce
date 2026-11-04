"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Avisos de Cauce: abajo al centro, invertidos (pill activa), con la acción subrayada
 * y una barra coral que se vacía mientras dura (ver .toast-cauce en globals.css).
 * Los colores salen de los tokens, así que siguen al tema sin leerlo.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-center"
      containerAriaLabel="Avisos"
      offset={{ bottom: "var(--offset-aviso)" }}
      mobileOffset={{ bottom: "var(--offset-aviso)" }}
      visibleToasts={1}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--activo)",
          "--normal-text": "var(--sobre-activo)",
          "--normal-border": "var(--activo)",
          "--border-radius": "var(--radio-fila)",
          "--width": "min(30rem, calc(100vw - 32px))",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "toast-cauce shadow-lg! gap-4! py-3! pr-2! pl-4! overflow-hidden",
          title: "text-sm! font-normal!",
          actionButton:
            "bg-transparent! text-(--normal-text)! h-auto! rounded-control! px-3! py-1! text-sm! font-semibold! underline underline-offset-2 hover:bg-sobre-activo/10!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
