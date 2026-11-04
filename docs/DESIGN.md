# Diseño

## Dirección

Referencia visual obligatoria: [`docs/referencia/cauce-home-referencia.html`](referencia/cauce-home-referencia.html). Si algo de este documento no alcanza para decidir, la referencia manda.

El home es el **Recorrido**: un resumen de tres cifras, las 8 etapas agrupadas en tres fases (Atraer, Convertir, Cerrar), un simulador de mejora, dónde se pierde la demanda, los experimentos y los leads sin atender, en ese orden de lectura. La interfaz es clara y táctil: fondo con un degradé frío, paneles de vidrio, tarjetas sólidas con radios contenidos, el estado activo en índigo (`--activo`) y acciones de ícono en botones circulares. Dos colores con significado fijo: **azul** para lo que avanza y **coral** para lo que se pierde. Todo lo demás es neutro.

## Color

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--fondo-a` · `-b` · `-c` | `#E4E8EF` · `#D3DAE7` · `#C9D1E2` | `#14171E` · `#171B24` · `#1B2030` | Degradé del fondo (155°, fijo) |
| `--panel` | `rgb(255 255 255 / .42)` | `rgb(255 255 255 / .035)` | Paneles, nav, chips y botones vidriados (con `backdrop-filter: blur(18px)`) |
| `--panel-borde` | `rgb(255 255 255 / .75)` | `rgb(255 255 255 / .07)` | Borde de 1 px de lo vidriado |
| `--tarjeta` | `#F8F9FB` | `#20242E` | Tarjetas de fase, tiles, tablas, popovers, sheet |
| `--tarjeta-borde` | `#FFFFFF` | `#2A2F3B` | Borde de tarjetas y tiles |
| `--tinta` | `#111318` | `#EEF0F4` | Títulos h1–h3 y cifras principales |
| `--tinta-cuerpo` | `#363C49` | `#D6DAE2` | Texto de cuerpo (`foreground`), valores de tablas, nombres en tarjetas; secundario sobre vidrio o degradé |
| `--tinta-2` | `#5A6171` | `#A9AFBB` | Secundario, metadata, labels y encabezados de tabla en tarjeta. Solo sobre `tarjeta` o `fondo-a` |
| `--tenue` | `#5F6576` | `#A3AAB8` | Bordes en hover, trazos neutros (nunca texto chico) |
| `--linea` · `--linea-fuerte` | `#DDE2EA` · `#C3CAD7` | `#2C3240` · `#3A4152` | Separadores; bordes de inputs y botones "ir" |
| `--azul` | `#7E95DA` | `#8EA3E6` | Chevrons y bordes de resaltado, contornos |
| `--azul-texto` | `#3651A8` | `#9DB0EE` | Texto en azul: deltas positivos, links, iniciales de avatar |
| `--azul-relleno` | `#3D5BC0` | `#3D5BC0` | Pills sólidas con texto blanco (score alto, días dentro de la ventana) |
| `--azul-suave` | `#E3E8F7` | `#2A3350` | Fondo de íconos de etapa, hover de filas, pills suaves |
| `--coral` | `#E26A61` | `#EE7F76` | Fugas punteadas, borde de íconos de fuga, arcos |
| `--coral-texto` | `#B23A32` | `#F08A80` | Texto en coral: deltas negativos |
| `--coral-relleno` | `#C2453C` | `#C2453C` | Botón Rescatar, pills de más de 3 días sin atención |
| `--coral-suave` | `#F7E2DF` | `#3D2A2D` | Hover de filas de fuga, pills suaves |
| `--neutro-suave` | tinta-2 al 10 % | tinta-2 al 10 % | Pills neutras, hover de botones sutiles |
| `--activo` · `--sobre-activo` | `#34436B` · `#FFFFFF` | `#CFD8F3` · `#0F1014` | Estado activo: índigo profundo en claro, lavanda clara en oscuro (nav, pestañas, segmentos, chips, página actual, barra de selección, avisos) y anillo de foco de las tarjetas clicables |
| `--sobre-relleno` | `#FFFFFF` | `#FFFFFF` | Texto sobre `-relleno` |
| `--tinta-profunda` | `#0F1014` | `#0F1014` | Velo de overlays al 40 % (`bg-black/50`) |

**Reglas de color:**

- `--azul` y `--coral` base: **solo líneas y trazos** (bordes de resaltado, contorno de íconos de fuga, indicadores).
- `-texto`: para letras en ese tono, y siempre sobre `--tarjeta`, `--muted` o su propio `-suave`.
- `-relleno`: para pills y botones sólidos, siempre con texto blanco (`--sobre-relleno`).
- **Nunca texto de color directo sobre el degradé** ni sobre un panel vidriado: ahí solo va `--tinta` o `--tinta-cuerpo`. `--tinta-2` queda para tarjetas y `fondo-a`.
- Tinta en tres pasos: `tinta` (h1–h3 y `.cifra-principal`, en la capa base), `tinta-cuerpo` (el resto del texto: `body` usa `foreground`) y `tinta-2` (secundario).
- Montos en dólares en `--tinta` con peso semibold: el dinero no tiene color propio.
- Deltas: azul si sube, coral si baja, siempre con flecha y signo; nunca el color solo.

`npm run contraste` verifica cada par en claro y oscuro (texto neutro sobre las tres paradas del degradé, sobre los paneles, tarjetas y `-suave`; `-texto` sobre tarjeta y `-suave`; blanco sobre `-relleno`; `sobre-activo` sobre `activo`; semántica de shadcn; `sobre-activo` al 70 % sobre `activo` para el número de la nav y "Limpiar" en la barra de selección; blanco sobre `coral-relleno` para el contador de pendientes en la pestaña activa) y falla por debajo de 4.5:1.

**Semántica de shadcn/ui:** sus tokens apuntan a los de Cauce, nunca al revés: `background` = fondo-b (el `body` pinta el degradé encima), `foreground` y `card-foreground` = tinta-cuerpo, `card` y `popover` = tarjeta, `primary` = activo, `primary-foreground` = sobre-activo, `muted` y `secondary` = tinta-2 al 8 % sobre tarjeta, `muted-foreground` = tinta-2, `accent` = azul-suave, `destructive` = coral-relleno, `border` = linea, `input` = linea-fuerte, `ring` = azul-texto, `chart-1…5` = azul, coral, azul-relleno, coral-relleno, tenue.

**Modo oscuro por switch:** la app arranca en claro (`defaultTheme="light"`, `enableSystem={false}`). El par luna/sol del rail (y el botón de tema de la barra móvil) pone `.dark` en `<html>`; la elección persiste y el `theme-color` acompaña.

## Tipografía

- **Geist** para todo (eje de peso completo): interfaz, cuerpo (14 px), tablas, etiquetas, títulos y cifras. `--fuente-cifra` apunta a Geist.
- Títulos (`font-cifra` / `font-heading`): título de vista 700 (40 px; 30 px en móvil), títulos de sección y panel 600, siempre con `letter-spacing: -0.02em`.
- Cifras: `.cifra` = Geist con `tabular-nums` e interlineado 1.1.
- Escala (rem): 0.75 · 0.875 · 1 · 1.25 · 1.75 · 2.5 · 3.5 = `text-xs` … `text-3xl`. Interlineado de cuerpo 1.45; `.cifra` lo baja a 1.1.
- Tracking por tamaño, nunca uno solo: `text-xs` +0.01em, cuerpo 0, `text-xl` −0.01em, `text-2xl` −0.02em, `text-3xl` −0.025em (va en la escala, no en cada título). Títulos con `text-balance`, párrafos con `text-pretty`.
- Sentence case, sin mayúsculas sostenidas.
- Montos en **dólares**, siempre redondos: `$2.31M USD` (≥1,000,000) y `$128.4K USD` (≥10,000) en resúmenes (`formatearUsdCorto`), `$19,290 USD` en detalle (`formatearUsd`). La única conversión es `MXN_POR_USD = 18` (supuesto del demo, `config/modelo.ts`). Tasas con un decimal (`61.5 %`), deltas en puntos (`↑ 0.2 puntos`; `pp` solo en celdas de tabla).

## Radios, superficies y sombras

| Pieza | Radio | Superficie | Sombra |
|---|---|---|---|
| Panel (secciones del home, de /fugas y /experimentos) | 20 px (`rounded-panel`; 16 px en móvil) | `vidrio` | `shadow-tarjeta` |
| Fase del recorrido, banner de fuga, simulador, feed, tabla con `marco`, resumen | 16 px (`rounded-tarjeta`) | tarjeta (la fase, `tarjeta/60`) | `shadow-tarjeta` |
| Tarjeta de etapa, de fuga y de experimento | 12 px (`rounded-tile`) | tarjeta | `shadow-tarjeta` |
| Filas | 10 px (`rounded-fila`) | transparente; hover en `-suave` | — |
| Botones con texto, toggles, pestañas, nav de vistas, barra de selección | 10 px (`rounded-boton`; el segmento interno, 6 px) | `vidrio`, tarjeta o `activo` | — |
| Badges | 6 px (`rounded-badge`) | según variante | — |
| Botón de ícono circular | círculo de 48 px (`Button size="redondo"`, `BotonRedondo`) | `vidrio` | — |
| Inputs, selects, menús | 8 px (`--radius`, `rounded-control`) | tarjeta | — |
| Popovers, dialog, ⌘K | 16 px (`rounded-2xl`) | popover | `shadow-flotante` |
| Sheet y drawer | 20 px en el borde visible | popover | `shadow-flotante` |
| Avisos | 10 px | activo | `shadow-flotante` |

Quedan redondos (`rounded-full`) solo los botones de ícono circulares, los avatares e íconos en círculo y el checkbox.

`vidrio` es una utilidad propia (`globals.css`): `--panel` + borde `--panel-borde` + `backdrop-filter: blur(var(--vidrio))`.

## Materiales

- `vidrio` (paneles, rail, chips de filtro sobre el degradé): `--panel`, desenfoque de 18 px con saturación al 180 % y el borde superior más claro (`--panel-brillo`), como luz que toca el material.
- `vidrio-denso` (cromo flotante: barra móvil): `--panel-denso`, más opaco y con 28 px de desenfoque, porque el contenido pasa por debajo y tiene que leerse.
- **Nunca vidrio sobre vidrio.** Dentro de un panel, los botones redondos van sólidos (`BotonRedondo superficie="tarjeta"`) y los chips (`Toggle`) son pills de tarjeta. Dentro de la barra móvil, los botones no tienen superficie propia (`superficie="cromo"`).
- Con `prefers-reduced-transparency: reduce`, ambos materiales pasan a `--tarjeta` sin desenfoque. Con `prefers-contrast: more`, el borde pasa a `--linea-fuerte`.
- El cambio de tema funde en 220 ms con View Transitions en vez de saltar de brillo (con reduced motion, o sin soporte, cambia directo).

## Layout

```
┌────┬─────────────────────────────────────────────────────────────────────┐
│ ◖  │ (1 Recorrido) 2 Rescate  3 Experimentos     Período 30 días  Canal … │
│ ⌕  │ Recorrido de adquisición                                             │
│ ☰  │ 5 oct – 1 nov 2026. De la primera visita al contrato…                │
│ ⇄  │ [ Valor en riesgo → ] [ Leads por rescatar → ] [ Experimentos activos → ]│
│ ▦  │ ╭ Recorrido ──────────────────────────────────────────────────────╮ │
│ ⇪  │ │ 01 Atraer   1.6 %   │ 02 Convertir 14.4 % │ 03 Cerrar   10.2 %  │ │
│    │ │ [Descubrimiento]    │ [Contacto]          │ [Visita]            │ │
│    │ │        ⌄            │        ⌄            │        ⌄            │ │
│    │ │ [Exploración]       │ [Calificación]      │ [Cierre]            │ │
│    │ │        ⌄            │        ⌄            │                     │ │
│    │ │ [Evaluación]        │ [Asignación]        │                     │ │
│    │ ╰─────────────────────────────────────────────────────────────────╯ │
│    │ ╭ ¿Qué pasa si mejora un paso? ─ [paso ▾] [puntos ━━●] +N  +$X ───╮ │
│    │ ╭ Dónde se pierde ─ [fuga $] [fuga $] [fuga $] … ─────────────────╮ │
│ ?  │ ╭ Experimentos ─── [exp] [exp] [exp] ──────── Ver todos ──────────╮ │
│ ☾  │ ╭ Leads sin atender ── tabla de 4 con Rescatar ── Ver los N ──────╮ │
│ ☀  │ [ Siguiente paso · 2 Rescate: Ver los leads por rescatar  → ]       │
└────┴─────────────────────────────────────────────────────────────────────┘
```

**Escritorio (≥768 px):** rail izquierdo de 88 px, fijo, con la marca y botones circulares: buscar (⌘K), filtros, comparar con período anterior, ver como tabla y exportar (los cuatro solo en el home); abajo, cómo funciona (reabre el onboarding), el par luna/sol (el modo vigente en `--activo`) y el sello de datos demo. En el home, arriba del contenido, los filtros como chips a la derecha (`Período 30 días`, `Canal Todos`…). **La nav de vistas va debajo del título de cada vista** (`EncabezadoVista`: h1, subtítulo en `tinta-cuerpo` y la nav vidriada a 20 px), numerada (1 Recorrido, 2 Rescate, 3 Experimentos; la activa en `--activo`).

**Recorrido:** desde `lg`, tres columnas (Atraer | Convertir | Cerrar) con las etapas apiladas dentro de cada fase; abajo de `lg`, una sola columna. Las demás secciones del home son grillas de tarjetas de 1, 2 o 3 columnas.

**Móvil (<768 px):** sin rail. La nav de vistas va igual debajo del subtítulo, sin sticky, con scroll horizontal si no entra; los chips del home, arriba del título, también con scroll horizontal (snap, sin barra de scroll). La barra flotante es **compacta y centrada** (buscar, filtros, comparar, cómo funciona y tema en el home; buscar, cómo funciona y tema en el resto), en `vidrio-denso`, con un fundido inferior para que el contenido no choque con ella. Respeta las safe areas (`viewport-fit=cover` + `env(safe-area-inset-*)`). Táctil: sin destello gris al tocar, `touch-action: manipulation` (sin espera de doble toque) y el input de ⌘K a 16 px para que iOS no haga zoom.

## Recorrido (home)

Una sección por idea, en orden de lectura; cada una es un panel `vidrio` (`SeccionHome`: título, una línea y una acción opcional) con tarjetas sólidas adentro.

- **Ícono en círculo** (`ui/icono-circulo.tsx`, `IconoCirculo`): 40 px, `bg-tarjeta` con borde de 1 px `azul-relleno` al 35 % y el ícono en `azul-texto` (trazo 1.7); `tono="coral"`: borde `coral` al 35 % e ícono `coral-texto`. Es el único círculo de ícono de las tarjetas: etapas, resumen, "Dónde se pierde", experimentos del home y siguiente paso.
- **Resumen**: tres tarjetas clicables (`ResumenCauce`) con ícono en círculo, etiqueta en `tinta-2`, cifra de 28 px y una línea de contexto. Valor en riesgo (coral), Leads por rescatar (azul, con rescatados hoy) y Experimentos activos (azul).
- **Recorrido** (`JourneyBoard`): una tarjeta por fase (`bg-tarjeta/60`, borde `tarjeta-borde`, `rounded-tarjeta`, p-5). Encabezado: número "01/02/03" en `cifra` `tinta-2`, nombre en 20 px semibold, descripción en `tinta-2` y, a la derecha, la métrica de la fase ("X % pasa a Convertir"; en Cerrar, "X % llega a Cierre"; selector `tasaDeFase`). La tasa de la fase va en 16 px semibold y la métrica, en 14 px. Adentro, las etapas apiladas con `gap-3` y un chevron hacia abajo entre ellas.
- **Tarjeta de etapa**: p-5, gap 16 px, grilla `[ícono] [nombre + volumen] [simular]`: nombre en 14 px medium (`tinta-cuerpo`), volumen en cifra de 20 px semibold ("Antes: N" debajo con comparar). A todo el ancho, una barra de avance de 4 px (relleno `azul-relleno` = tasa, sobre `azul-suave`) y, debajo, "X % avanza" y el delta. Toda la tarjeta abre el panel de la etapa (el botón del nombre la cubre); el ícono "Simular mejora" queda encima.
- **Resaltado compartido** (estado local de `VistaCauce`, no va en la URL): hover o foco en una etapa la eleva (−2 px, borde azul) y la barra se parte en azul/coral con "Avanzan N · Se quedan M" (selector `avanceDeEtapa`); la etapa siguiente lleva borde azul suave; en "Dónde se pierde" se marcan las fugas de esa transición y las demás bajan a 50 %. Hover o foco en una fuga marca sus etapas `desde` y `hacia` con borde coral punteado; en el encabezado de una fase, sus etapas; en un experimento, su etapa. Las cifras de etapas y resumen interpolan 300 ms al cargar y al cambiar filtros (`useTween`; inmediato con reduced motion).
- **Simulador** (`SimuladorMejora`, "¿Qué pasa si mejora un paso?"): `Select` con las 7 transiciones (por defecto, la de más valor en riesgo) que abre debajo del trigger (`position="popper"`, mismo ancho, máx. 288 px de alto), cada ítem con su tasa actual a la derecha en `cifra` `tinta-2`. `Slider` de 0 a 10 puntos en pasos de 0.5, con tope en (100 − tasa) para que la tasa no pase de 100 %. Antes del resultado, una fila en `bg-muted`: "Hoy pasa {tasa} → con la mejora {tasa + puntos}" y "+N personas más llegan a {etapa}". Después, dos cifras grandes en `azul-texto` ("+N cierres en el período", "+$X USD en comisión") y la fórmula con los valores (`simularMejora`).
- **Dónde se pierde** (`DondeSePierde`): tarjetas por fuga (hover coral) con la gota en `IconoCirculo tono="coral"`, "Entre {etapa} y {etapa}", el valor en cifra de 28 px, los perdidos y **Ver leads** (outline; coral en leads sin atender). El estado del experimento asociado va como `Badge`.
- **Experimentos** (`ExperimentosHome`): hasta 3 tarjetas con ícono en círculo, `Badge` de estado, nombre y "Busca +X puntos de {etapa} a {etapa}".
- **Leads sin atender** (`LeadsSinAtender`): la tabla de 4 sobre tarjeta (`Table marco`), encabezados en `tinta-2`, filas con py-3 y Rescatar en coral.
- **Siguiente paso** (`SiguientePaso`, también al final de Rescate y Experimentos): tarjeta clicable con el ícono de la vista siguiente, "Siguiente paso · N Nombre", la acción en cifra de 20 px, la descripción y una flecha en círculo `activo`.

**Tarjetas clicables** (utilidad `tarjeta-clicable`; `tarjeta-coral` para las de fuga y el resumen de valor): un solo hover (sube 2 px, borde azul o coral, `shadow-flotante`), `scale(0.98)` al presionar y el mismo foco (anillo de 2 px en `--activo`). Etapas, fugas, experimentos, resumen y siguiente paso la usan.

## Rescate (/fugas)

- **Banner de fuga** (`BannerFuga`), arriba del contenido de cada pestaña, sobre tarjeta: a la izquierda "Valor estimado", el monto en cifra de 56 px (40 px en móvil), "{N} sin atender en 30 días · {etapa} → {etapa}" y "Cómo se calcula" (solo en la fuga del modelo de pérdida). A la derecha, si la fuga tiene leads, dos barras apiladas de los pendientes: **Por intención** (Alto `azul-relleno`, Medio `azul`, Bajo `linea-fuerte`) y **Por antigüedad** (≤3 días en `coral`, 4–14 días `azul`, más de 14 `linea-fuerte`). Cada segmento es un botón de 36 px de alto (`aria-pressed`) que pone o quita `banda` o `antiguedad` en la URL; el resto baja a 35 %. Leyenda con conteos debajo y "Quitar filtros" si hay alguno. Fugas sin leads: monto, volumen y el experimento que las ataca, sin barras.
- La vista separa sus bloques con 32 px; el banner va con p-6 y la lista queda 8 px más abajo de la bandeja.
- **Bandeja**: `ToggleGroup variant="segmentado"` "Pendientes N | Rescatados N | Descartados N"; a la derecha, "Mostrando 1–10 de N".
- **Fila de lead** (`LeadFeedItem`): px-5 py-5 (6 px entre las dos líneas), grilla `[checkbox] [contenido] [acciones]`. Línea 1: nombre, score, días y "Sector · Estado"; línea 2: el último mensaje en una línea (ícono de urgencia si aplica). Acciones: "Rescatar lead" (coral, sm), "Descartar" (ghost, sm) y un chevron "Ver detalle" (`aria-expanded`) que despliega teléfono, mensajes y espacios vistos (altura animada con motion, 220 ms; inmediato con reduced motion).
- **Paginación**: `Pagination` de shadcn debajo de la lista, 10 por página: anterior, números (con saltos) y siguiente; la página actual en `--activo`. La página va en `?pagina=` (fallback a 1), vuelve a 1 al cambiar fuga, bandeja o filtro, y si una acción vacía la última página se pasa a la anterior. J/K se mueven dentro de la página. Los atajos siguen (J/K/R/D/Shift/Esc), ya sin la línea que los listaba.

## Experimentos (/experimentos)

Una sola vista de **tarjetas agrupadas por estado**, en este orden: En curso, Leyendo, Validado, Refutado y Diseño (los grupos vacíos no se muestran). Cada grupo lleva un h2 de 16 px con su conteo en `cifra` y la grilla debajo. Arriba a la derecha, `Button variant="outline" size="sm"` "Ver como tabla" / "Ver como tarjetas" (`?vista=tabla`); `?vista=timeline` se ve como tarjetas y `?estado=` se ignora. Sin chips de estado, sin toggle de vistas ni timeline.

**Detalle de experimento**: ≥768 px, `Dialog` centrado de hasta 760 px y 85 dvh (`PanelCentrado`); <768 px, `Drawer`. Encabezado fijo (nombre visible en 20 px semibold, `Badge` de estado, "{etapa} → {etapa}" en `tinta-2` y cerrar), el único con divisor. Debajo, una sola columna con 24 px entre bloques: (1) **veredicto** en una tarjeta `bg-muted` p-5, frase de 18 px semibold en el tono de `tonoObservado` ("Funcionó: +0.6 puntos contra +0.5 esperados", "No cumplió: …", "Se podrá medir a partir del {fecha}") y la ventana de lectura en `tinta-2`; (2) **Esperado** y **Observado** lado a lado (label 14 px `tinta-2`, cifra de 24 px; "—" sin lectura) y las barras debajo, sin repetir cifras; (3) el gráfico de la transición a todo el ancho con su leyenda ("Línea punteada: despliegue · Zona sombreada: ventana de lectura"); (4) **Cómo se planteó** en un `<details>` cerrado, con chevron que rota (hipótesis en `tinta-cuerpo` y palanca, métrica, despliegue y lectura); (5) el link "Ver la transición en el recorrido". Se mantienen `?exp=`, Esc y la vuelta del foco a la tarjeta o fila que lo abrió.

En texto corrido se escribe "puntos" (`formatearPuntos`); "pp" queda para cifras y celdas de tabla.

## Motion

Nada se anima solo. Las animaciones responden a acciones y se deciden por frecuencia: lo que se usa cientos de veces por día no anima.

| Pieza | Animación | Duración y curva |
|---|---|---|
| Paleta ⌘K | **Ninguna** (se abre por teclado, muchas veces por día) | — |
| Botones, toggles, pestañas, filas del board, tiles, avatares, nav | Escala al presionar (`scale(0.97)`; filas grandes 0.99) | `--duracion-presion` (160 ms), `ease-salida` |
| Popovers, menús, selects | Entran desde su trigger (`transform-origin` de Radix); salen más rápido | 150 ms entrar / 100 ms salir, `ease-salida` |
| Tooltips | Retraso de 300 ms solo para el primero; los siguientes abren al instante y sin animación | — |
| Sheet del panel de etapa | Desliza desde la derecha | 300 ms entrar / 200 ms salir, `ease-cajon` |
| Tarjeta clicable (hover) | Sube 2 px, borde y sombra | 160 ms, `ease-salida`; sin desplazamiento con reduced motion |
| Cifras del recorrido y del resumen | Interpolan al cargar y al cambiar filtros | 300 ms ease-out (`useTween`) |
| Barra de avance de una etapa | El relleno escala en X; el resto pasa a coral | 300 ms, `ease-salida` |
| Detalle de un lead | Altura y opacidad | 220 ms, `ease-salida` |
| Lead que sale del feed | Se desliza hacia el lado de la acción y se desvanece | 200 ms, `ease-salida` |
| Barras del desglose | `transform: translateX`, nunca `width` | `--duracion-media`, `ease-salida` |
| Hover de filas, tiles y chips | Solo color | 150–160 ms |

**Onboarding** (la única pieza con coreografía; canvas 2D nativo + `motion/react` para el texto HTML):

- Motor sin React (`particulas.ts`): estado en `Float32Array` (x, y, vx, vy, tx, ty, alpha, talpha) y `Uint8Array` (color: azul, coral o tenue), sin objetos por partícula. 2400 partículas en desktop, 1000 en móvil y 600 si `hardwareConcurrency <= 4`.
- Física: resorte hacia el target (k 0.06–0.09, amortiguación 0.86), ruido de 0.4 px con fase propia y alpha que se acerca a `talpha` al 8 % por cuadro. Se dibuja con `fillRect` de 1.6 px (2 px con DPR 1, DPR máx. 2); el azul suma brillo (`lighter`). Los colores se leen una vez de `--azul`, `--coral` y `--tinta-2` del contenedor `.dark`.
- Formaciones: enjambre (entra por la izquierda), texto (Geist 700 en un canvas aparte, paso de muestreo adaptativo, targets asignados por x para que el morph barra de izquierda a derecha, en caché por cadena y tamaño), caída a pozas (gravedad + montículo elíptico), nube baja, arco balístico y explosión.
- Un solo `requestAnimationFrame`, detenido con la pausa, la pestaña oculta o al cerrar. `ResizeObserver` vuelve a aplicar las formaciones activas sin reiniciar el acto. Volver a un acto lleva las partículas a su estado final en ~0.5 s.
- Título del acto palabra por palabra (90 ms, `y` 24 px, `blur(10px)` → 0, 0.7 s con `--curva-entrada`); el texto entra 0.25 s después. El título viejo sale con opacidad y `blur(6px)` en 0.25 s. Etiquetas de cifras, fugas (80 ms entre una y otra) y chip con blur-rise.
- Ver mi recorrido: explosión radial y fade del overlay en 600 ms, mientras `<main id="contenido">` recibe `data-entrada` y se asienta (escala 1.02 → 1, `blur(6px)` → 0, `--duracion-entrada`).
- Con reduced motion: sin rAF continuo ni autoplay (sin botón de pausa) ni explosión; cada acto se dibuja una sola vez en su estado final y el cambio es un crossfade de 150 ms. Si el canvas falla, el título con las cifras, el texto y los controles se ven igual.

**Curvas propias** (las de CSS son débiles): `--curva-salida` `cubic-bezier(0.23, 1, 0.32, 1)` para entrar y salir, `--curva-movimiento` `cubic-bezier(0.77, 0, 0.175, 1)` para lo que se mueve en pantalla y `--curva-cajon` `cubic-bezier(0.32, 0.72, 0, 1)` para sheets. En Tailwind: `ease-salida`, `ease-movimiento`, `ease-cajon`. Nunca `ease-in` en UI, nunca `transition-all` (siempre propiedades explícitas) y solo se animan `transform` y `opacity` (más colores en hovers).

Con `prefers-reduced-motion` todo aparece en su estado final: la escala al presionar va bajo `motion-safe:`, y una regla global anula las animaciones de tw-animate-css, vaul y sonner, y la barra de tiempo del aviso. Los hovers ya van detrás de `@media (hover: hover)` (lo hace Tailwind v4), así que no quedan pegados en pantallas táctiles.

## Componentes

### Piezas de shadcn/ui

Las primitivas salen de shadcn/ui (`src/components/ui`); colores y variantes se ajustan **dentro** de esos archivos. En las llamadas, `className` es solo layout.

| Necesidad | Componente | Notas |
|---|---|---|
| Acción circular (rail, barra móvil, encabezado de panel) | `Button variant="vidrio" size="redondo"` | `aria-pressed` o `data-activo` la pone en `--activo`. |
| Chip de filtro | `Button variant="filtro" size="lg"` + `DropdownMenu` / `Popover` | Etiqueta en tinta-2, valor en `<b>`. |
| Nav de vistas, bandeja de /fugas, fugas | `ToggleGroup variant="segmentado"` / links con el mismo estilo / `Tabs variant="pill"` | Activo en `--activo`, radio de botón. |
| Alternadores sueltos y chips de /experimentos | `Toggle` / `ToggleGroup variant="outline"` | Sólidos en reposo; activo en `--activo`. |
| Hoja de filtros (móvil) | `Drawer` | El rail abre la misma hoja en un `Popover`. |
| Panel de etapa (Recorrido) | ≥768 px: `Sheet` a la derecha (440 px en ≥1280, 60 % en tablet); <768: `Drawer` | Devuelve el foco a la tarjeta que lo abrió. |
| Detalle de experimento | ≥768 px: `Dialog` centrado de hasta 760 px (`PanelCentrado`); <768: `Drawer` | Encabezado fijo; una columna; devuelve el foco. |
| Paso a simular | `Select` | 7 transiciones. |
| Páginas del feed de Rescate | `Pagination` | Botones (la URL cambia sin navegar), copy en español. |
| Paleta ⌘K | `CommandDialog` | Incluye "Ver cómo funciona". |
| Onboarding (partículas, 3 actos) | `Dialog` a pantalla completa (`fixed inset-0`, sin borde, radio ni sombra) con `.dark` local; fondo `fondo-onboarding` (`--tinta-profunda` + radial de `--azul` al 10 % arriba) | Capas: `<canvas>` (motor en `onboarding/particulas.ts`), progreso de 3 segmentos de 2 px + Saltar, título y texto abajo a la izquierda, controles de ícono + Siguiente / Ver mi recorrido abajo a la derecha, etiquetas HTML de cifras, fugas y chip sobre el lienzo. La zona de formación ocupa el 60 % superior (55 % en móvil). Copy y duraciones en `actos.ts`; autoplay y pausa en `useActos`. |
| Modelo de pérdida en Rescate | `Dialog` ("Cómo se calcula") | Sliders y fórmula sin cambios. |
| Vista de experimentos | Grupos por estado + `Button variant="outline" size="sm"` "Ver como tabla" | Tarjetas por defecto; `?vista=tabla`. |
| Parámetros numéricos | `Slider` | |
| Datos tabulares | `Table` (`marco` = tarjeta de 16 px) | Cifras con `.cifra`, a la derecha. |
| Avisos con deshacer | `sonner` | Abajo al centro, en `--activo`, 5 s, uno por vez. |
| Pills de estado | `Badge` | Ver tabla abajo. |
| Ayuda sobre íconos | `Tooltip` | En todos los botones circulares. |
| Sin resultados | `Empty` | |

**No son shadcn:** las fases y tarjetas del recorrido, el banner de fuga (grillas propias con tokens) y el `RiverChart` (fuera del home; se conserva hasta nuevo aviso).

### Badges

| Variante | Estilo | Uso |
|---|---|---|
| `alto` | azul-relleno + blanco | Score ≥70 |
| `medio` | azul-suave + azul-texto | Score 40–69 |
| `bajo`, `neutro`, `diseno` | neutro-suave + tinta-2 | Score <40, contadores, experimento en diseño |
| `en_curso` | azul-suave + punto | Experimento desplegado |
| `leyendo` | activo | En ventana de lectura |
| `validado` | azul-relleno + ✓ | Hipótesis cumplida |
| `refutado` | coral-suave + coral-texto | Hipótesis no cumplida |
| `critica` | coral-suave + coral-texto | ≤3 días sin atención |
| `atrasado`, `urgente`, `pendientes` | coral-relleno + blanco | >3 días sin atención, urgencia declarada, pendientes en la poza activa |

## Copy

- Español de México, impersonal o "usted". Verbos concretos: "Rescatar", "Descartar", "Comparar con período anterior", "Ver como tabla", "Exportar".
- Vacíos con dirección: "No hay leads pendientes en esta fuga."
- Sin eyebrows decorativos ni flechas pegadas a botones.
