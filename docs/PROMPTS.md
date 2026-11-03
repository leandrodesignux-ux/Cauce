# Prompts por fase para Codex

Pegá un prompt por vez. Cada fase en su rama; revisá el preview de Vercel antes de mergear.

**Foco (nov 2026):** es una pieza para mostrar. Prioridad: que se vea muy bien y sea interactivo. Al final de cada fase, capturas a 1440 y 390 px.

---

## Fase 0 — Scaffold

> Leé AGENTS.md y los cuatro docs de `docs/`. Creá el proyecto Next.js (App Router, TypeScript, Tailwind v4, ESLint, carpeta `src/`) en la raíz de este repo sin pisar los `.md` existentes. Instalá solo las dependencias permitidas en AGENTS.md más `tsx` como dev dependency. Cargá Space Grotesk y Geist con `next/font`. Creá `src/styles/tokens.css` con todos los tokens de DESIGN.md (claro y oscuro) y conectalo a Tailwind. Agregá el script `seed`. No construyas vistas todavía.

**Listo cuando:** `npm run dev` levanta una página vacía con el fondo `--concreto` y la tipografía correcta; `lint` y `build` pasan.

## Fase 1 — Datos

> Implementá `scripts/seed.ts` según DATA.md: PRNG mulberry32(2026), pesos de muestreo, tasas por transición con ruido, tendencia post-experimento, ~400 leads con touchpoints, fugas y los 7 experimentos semilla. Escribí los JSON en `src/data/`. Creá `src/lib/selectors.ts` con funciones puras: volumen por etapa según filtros, tasa por transición, delta vs. período anterior, serie semanal de una transición, valor en riesgo por poza, y el modelo de pérdida. Agregá tests mínimos con `node:test` para el modelo de pérdida (643 × 0.30 × 0.10 × 18,000 = 347,220).

**Listo cuando:** `npm run seed` dos veces produce archivos idénticos y los tests pasan.

## Fase 2 — Shell y filtros

> Construí `AppShell`, `NavRail` (Cauce, Fugas, Experimentos; colapsable), `FilterBar` y la paleta de comandos ⌘K. Los filtros (período, canal, sector, estado, comparar, vista tabla) se leen y escriben en los search params. Creá el store de Zustand para rescatados y descartados, persistido en localStorage. Respetá layout y breakpoints de DESIGN.md.

**Listo cuando:** cambiar un filtro actualiza la URL, recargar la página conserva el estado, y todo se navega con teclado.

## Fase 3 — El cauce

> Es la pieza central: máximo cuidado visual y de animación, también en móvil. Construí `RiverChart` en SVG con d3-scale y d3-shape como describe DESIGN.md: 8 etapas, ancho proporcional al volumen, tasas entre etapas, hilos de fuga hacia pozas con su monto en latón, contorno del período anterior cuando "comparar" está activo, animación de llenado solo en la primera carga, interpolación de 300 ms al cambiar filtros, y `prefers-reduced-motion`. Versión vertical en móvil. `DataTable` equivalente cuando "Ver como tabla" está activo. La franja superior muestra valor en riesgo y rescatados.

**Listo cuando:** los filtros cambian el río de forma visible y coherente con los selectores, y la tabla muestra exactamente las mismas cifras.

## Fase 4 — Panel de etapa

> Click en una etapa o transición abre `StagePanel` (empuja el contenido, no lo tapa): desglose por canal, sector y estado; tendencia semanal de 12 semanas; fugas de esa transición con link a `/fugas?poza=…`; experimentos asociados con estado. `Esc` cierra y devuelve el foco al elemento que lo abrió. La selección vive en la URL.

## Fase 5 — Fugas y rescate

> El hilo de retorno tiene que verse bien. Construí `/fugas`: `LossModel` con sliders y fórmula paso a paso usando los valores iniciales de DATA.md; tabs por poza; feed de `LeadFeedItem` con score, urgencia, último mensaje y antigüedad; filtros por banda de score y antigüedad con la ventana de 3 días destacada; acciones Rescatar lead / Descartar con atajos R, D, J, K y selección múltiple; toast con Deshacer de 5 s. Al rescatar, el lead se marca en el store y en `/` aparece el hilo de retorno de la poza de fantasmas hacia Asignación.

**Listo cuando:** rescatar 3 leads en `/fugas` y volver a `/` muestra el retorno y el contador en 3.

## Fase 6 — Experimentos

> Construí `/experimentos` con dos vistas conmutables: tabla (todas las columnas de PRODUCT.md) y timeline con línea de hoy. Sin gráfico de calibración. Click en un experimento abre su detalle con link a la transición en el cauce (`/?transicion=…`).

## Fase 7 — Eliminada

Sin `/leads/[id]`. Los leads se ven en el feed de `/fugas` y se buscan desde ⌘K.

## Fase 8 — Pulido y deploy

> Pulido visual, modo oscuro, estados vacíos con dirección, sello "Prototipo con datos demo", metadata y Open Graph de cada vista para que el link se vea bien al compartirlo. Sin Lighthouse.
