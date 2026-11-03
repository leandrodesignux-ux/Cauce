"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * Avisos de Cauce: abajo al centro, invertidos en tinta, con la acción subrayada
 * y una barra de latón que se vacía mientras dura (ver .toast-cauce en globals.css).
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
          "--normal-bg": "var(--tinta)",
          "--normal-text": "var(--concreto)",
          "--normal-border": "var(--tinta)",
          "--border-radius": "var(--radio-panel)",
          "--width": "min(30rem, calc(100vw - 32px))",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "toast-cauce shadow-lg! gap-4! py-3! pr-2! pl-4! overflow-hidden",
          title: "text-sm! font-normal!",
          actionButton:
            "bg-transparent! text-(--normal-text)! h-auto! rounded-control! px-2.5! py-1! text-sm! font-semibold! underline underline-offset-2 hover:bg-concreto/10!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
