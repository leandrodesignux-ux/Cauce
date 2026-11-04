"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Tablas de Cauce: encabezados en tinta-2, cifras alineadas a la derecha con .cifra,
 * caption arriba a la izquierda. `marco` la envuelve en una tarjeta.
 */
function Table({
  className,
  marco = false,
  ...props
}: React.ComponentProps<"table"> & { marco?: boolean }) {
  return (
    <div
      data-slot="table-container"
      data-marco={marco || undefined}
      className="relative w-full overflow-x-auto data-marco:rounded-tarjeta data-marco:border data-marco:border-tarjeta-borde data-marco:bg-tarjeta data-marco:shadow-tarjeta"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-top border-collapse text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b [&_tr]:hover:bg-transparent", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-linea-fuerte font-medium [&>tr]:border-0 [&>tr]:hover:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border motion-safe:transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-accent",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn(
        "h-10 px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-tinta-cuerpo in-data-marco:text-tinta-2 [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

/** Encabezado de fila (`<th scope="row">`) con el aspecto de una celda. */
function TableRowHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-row-head"
      scope="row"
      className={cn("px-3 py-2.5 text-left font-normal", className)}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-2.5 [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("px-3 pt-3 pb-1 text-left text-sm font-medium text-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRowHead,
  TableRow,
  TableCell,
  TableCaption,
}
