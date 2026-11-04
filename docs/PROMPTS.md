# Prompts por fase para Codex

Pegá un prompt por vez. Cada fase en su rama; revisá el preview de Vercel antes de mergear.

**Foco (nov 2026):** es una pieza para mostrar. Prioridad: que se vea muy bien y sea interactivo. Al final de cada fase, capturas a 1440 y 390 px.

---

## Fase 0 — Scaffold

> Leé AGENTS.md y los cuatro docs de `docs/`. Creá el proyecto Next.js (App Router, TypeScript, Tailwind v4, ESLint, carpeta `src/`) en la raíz de este repo sin pisar los `.md` existentes. Instalá solo las dependencias permitidas en AGENTS.md más `tsx` como dev dependency. Cargá Space Grotesk y Geist con `next/font` (desde la Fase 10, solo Geist). Creá `src/styles/tokens.css` con todos los tokens de DESIGN.md (claro y oscuro) y conectalo a Tailwind. Agregá el script `seed`. No construyas vistas todavía.

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

## Fase 9 — Simplificación y onboarding

> Simplificá la lectura sin tocar URLs, search params, ids de datos, el store `cauce-sesion` ni la lógica de selectores. Onboarding de 3 slides en un `Dialog` (primera visita; se reabre desde el rail, la barra móvil y ⌘K; ← → y Esc; marca `onboardingVisto` en el mismo persist). Nav numerada 1 Recorrido, 2 Rescate, 3 Experimentos (los href no cambian), con una tarjeta Siguiente paso al final de cada vista. Vocabulario visible: fuga en vez de poza, leads sin atender en vez de fantasmas, puntos en vez de pp en texto corrido. Home: resumen de 3 cifras, stepper de 8 etapas por fase (sin SVG de conectores), dónde se pierde, hasta 3 experimentos, leads sin atender y siguiente paso. Rescate: el modelo de pérdida pasa a un Dialog (Cómo se calcula) y el feed muestra arriba solo lo clave. Experimentos: vista Tarjetas por defecto (Tarjetas | Tabla | Timeline).

**Listo cuando:** lint, build, test y contraste en verde; a 1440 y 390, y con teclado, el onboarding se abre en la primera visita y se reabre desde el rail y ⌘K, una etapa abre su panel y devuelve el foco, rescatar 3 leads en /fugas deja "3 rescatados hoy" en el resumen de /, y los links de Siguiente paso recorren las tres vistas.

## Fase 10 — Pulido visual e interacción

> Sin cambiar ids, search params existentes ni la lógica de los selectores actuales. Tokens: `--activo` índigo (`#34436b` / `#cfd8f3`), radios contenidos (panel 20, tarjeta 16, tile 12, fila 10, control 8, `--radio-boton` 10, `--radio-badge` 6; redondos solo los botones de ícono circulares, puntos, avatares y checkbox) y todo en Geist (títulos con −0.02em). Recorrido: tres fases en columnas desde lg con la métrica "X % pasa a…" (`tasaDeFase`), tarjetas de etapa apiladas con barra de avance, resaltado compartido entre etapas, fugas, fases y experimentos ("Avanzan N · Se quedan M" con `avanceDeEtapa`), cifras que interpolan con `useTween` y el simulador "¿Qué pasa si mejora un paso?" (`simularMejora`, con "Simular mejora" en cada etapa). Rescate: `BannerFuga` con valor y barras por intención y antigüedad que filtran, bandeja segmentada con "Mostrando 1–10 de N", filas con detalle desplegable y `Pagination` de 10 (`?pagina=`), sin la línea de atajos. Experimentos: detalle centrado en `Dialog` (Drawer en móvil). Hover y foco comunes para toda tarjeta clicable (`tarjeta-clicable`).

**Listo cuando:** lint, build, test y contraste en verde; a 1440 y 390, en claro y oscuro, y con teclado: hover/foco en etapa, fuga, fase y experimento resaltan lo correcto; el simulador responde con dos transiciones; en Rescate se filtra desde las barras del banner, se pagina, y rescatar en la página 2 actualiza el conteo y la paginación; el detalle de experimento se abre centrado, Esc lo cierra y el foco vuelve.

## Fase 11 — Onboarding animado

> El onboarding de 3 slides pasa a un escenario único de 3 actos sin dependencias nuevas (motion, d3-shape, d3-scale). Se mantienen `useOnboarding`, `onboardingVisto` / `marcarOnboarding`, la apertura en la primera visita y desde el rail, la barra móvil y ⌘K, la vuelta del foco y Esc. Archivos: `onboarding/EscenaCauce.tsx` (SVG persistente), `onboarding/actos.ts` (copy y duraciones de 5, 5 y 5.5 s) y `onboarding/useActos.ts` (autoplay, pausa y navegación). Cifras de `calcularJourney` con los filtros por defecto, `experimentoDestacado` y `FUGA_MODELO_PERDIDA`. Motion con los valores de craft.md (entradas `[0.22, 1, 0.36, 1]`, estado `[0.4, 0, 0.2, 1]`, blur-rise, palabra por palabra y count-up), un solo loop para los puntos, `aria-live` con el título del acto y `role="img"` con las cifras reales. "Ver mi recorrido" asienta `#contenido` con `data-entrada`.

**Listo cuando:** lint, build, test y contraste en verde; a 1440 y 390, en claro y oscuro: se abre en la primera visita, el autoplay recorre los 3 actos, Espacio pausa, ← → y los segmentos navegan, "Ver mi recorrido" desde /fugas lleva a / y marca visto, se reabre desde el rail y ⌘K, con reduced motion cada acto queda estático, y las cifras de los actos 1 y 2 coinciden con las de la home.

## Fase 11b — Rediseño del onboarding: escenario de partículas

> Se elimina `EscenaCauce.tsx` (espina, nodos, pozas SVG, chip y contadores). El onboarding pasa a pantalla completa en oscuro (`.dark` local sobre `--tinta-profunda`) con un motor de partículas en canvas 2D sin dependencias (`onboarding/particulas.ts`: typed arrays, resorte + ruido, formaciones de enjambre, texto, caída a pozas y explosión, un solo rAF y `ResizeObserver`). Sin cambios de lógica en `useActos`, el store, la apertura, Esc, Saltar, el foco de vuelta ni el asentado de `<main>`. Copy y duraciones nuevas en `actos.ts` (6.5, 6.5 y 7 s). Cifras: `calcularJourney` con los filtros por defecto (llegaron, firmaron, pozas con valor > 0 y valor en riesgo), `modeloPerdida(parametrosPerdidaIniciales())` (contratos y fantasmas) y `experimentoDestacado`. Pares de contraste sobre `--tinta-profunda` en `scripts/contraste.ts`.

**Listo cuando:** lint, build, test y contraste en verde; a 1440 y 390: los 3 actos completos en autoplay, la pausa (botón, Espacio y hover), ← → hacia adelante y atrás, el redimensionado a mitad de un acto, "Ver mi recorrido" desde /fugas y reduced motion; 179,874, 43 y el valor en riesgo coinciden con la home, y se mantiene a ≥50 fps con CPU 4× más lenta.

## Fase 12 — Pulido de tipografía, moneda, copy genérico y jerarquía

> El onboarding no se toca (solo el formato de sus cifras y el nombre corto del experimento, que pasa a la config). Tinta en tres pasos (`tinta`, `tinta-cuerpo` nuevo y `tinta-2`, que solo va sobre tarjeta o `fondo-a`), con pares nuevos en `contraste.ts`. Montos en dólares redondos: `MXN_POR_USD = 18`, `comisionUsd` (1,000), `presupuestoUsd` (script de una vez), identificadores `*Mxn` → `*Usd`, `formatearUsd` y `formatearUsdCorto`. Copy genérico para fugas (`NOMBRE_CORTO_POZA`, `CAUSA_VISIBLE`) y experimentos (`NOMBRE_VISIBLE_EXPERIMENTO`, `NOMBRE_CORTO_EXPERIMENTO`), aplicado al cargar los datos; sin "Browse", "spot", "ficha", "broker" ni "fantasma" en la UI. La nav de vistas pasa debajo del título (`EncabezadoVista`). Recorrido con más aire, `IconoCirculo` y un simulador con fila explicativa y tope de 100 %. Rescate con más aire. Experimentos agrupados por estado con "Ver como tabla" (sin timeline). Detalle de experimento en una columna.

**Listo cuando:** lint, build, test y contraste en verde; grep sin "MXN", "pesos", "Browse", "spot", "fantasma" ni "broker" en la UI; a 1440 y 390, en claro y oscuro: las 3 vistas con la nav debajo del título, el simulador en Descubrimiento, Evaluación y Visita (el dropdown abre debajo del trigger y la fila explicativa cuadra con el resultado), Experimentos agrupado y en tabla, y el detalle validado y uno sin lectura.
