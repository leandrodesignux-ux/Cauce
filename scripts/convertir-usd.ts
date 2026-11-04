// Script de una sola vez (Fase 12): pasa `presupuestoMxn` de src/data/leads.json a `presupuestoUsd`,
// convertido con MXN_POR_USD y redondeado a decenas. El texto libre de `ultimoMensaje` no se toca.
// Uso: npx tsx scripts/convertir-usd.ts  (si ya no hay presupuestoMxn, no hace nada).

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MXN_POR_USD, aUsd } from "../src/config/modelo";

const archivo = join(process.cwd(), "src", "data", "leads.json");
const texto = readFileSync(archivo, "utf8");
let cambios = 0;
const nuevo = texto.replace(/"presupuestoMxn":(null|\d+(?:\.\d+)?)/g, (_, valor: string) => {
  cambios++;
  return `"presupuestoUsd":${valor === "null" ? "null" : Math.round(aUsd(Number(valor)) / 10) * 10}`;
});
writeFileSync(archivo, nuevo);
console.log(`${cambios} presupuestos convertidos a USD (1 USD = ${MXN_POR_USD} MXN, redondeo a decenas).`);
