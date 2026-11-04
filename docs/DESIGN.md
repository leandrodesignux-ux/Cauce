# Diseño

## Dirección

Referencia visual obligatoria: [`docs/referencia/cauce-home-referencia.html`](referencia/cauce-home-referencia.html). Si algo de este documento no alcanza para decidir, la referencia manda.

El home es un **journey board**: el recorrido del lead en tres tarjetas (Atraer, Convertir, Cerrar) con las etapas en filas, las fugas colgando debajo de su etapa y conectores que dibujan el flujo. La interfaz es clara y táctil: fondo con un degradé frío, paneles de vidrio, tarjetas blancas muy redondeadas, el estado activo como una pill negra y acciones en botones circulares. Dos colores con significado fijo: **azul** para lo que avanza y **coral** para lo que se pierde. Todo lo demás es neutro.

## Color

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--fondo-a` · `-b` · `-c` | `#E4E8EF` · `#D3DAE7` · `#C9D1E2` | `#14171E` · `#171B24` · `#1B2030` | Degradé del fondo (155°, fijo) |
| `--panel` | `rgb(255 255 255 / .42)` | `rgb(255 255 255 / .035)` | Paneles, nav, chips y botones vidriados (con `backdrop-filter: blur(18px)`) |
| `--panel-borde` | `rgb(255 255 255 / .75)` | `rgb(255 255 255 / .07)` | Borde de 1 px de lo vidriado |
| `--tarjeta` | `#F8F9FB` | `#20242E` | Tarjetas de fase, tiles, tablas, popovers, sheet |
| `--tarjeta-borde` | `#FFFFFF` | `#2A2F3B` | Borde de tarjetas y tiles |
| `--tinta` | `#111318` | `#EEF0F4` | Texto principal, cifras |
| `--tinta-2` | `#4B5160` | `#C3C8D2` | Texto secundario, etiquetas, encabezados de tabla |
| `--tenue` | `#5F6576` | `#A3AAB8` | Bordes en hover, trazos neutros (nunca texto chico) |
| `--linea` · `--linea-fuerte` | `#DDE2EA` · `#C3CAD7` | `#2C3240` · `#3A4152` | Separadores; bordes de inputs y botones "ir" |
| `--azul` | `#7E95DA` | `#8EA3E6` | Espina del board, conectores, arcos, bordes de resaltado |
| `--azul-texto` | `#3651A8` | `#9DB0EE` | Texto en azul: deltas positivos, links, iniciales de avatar |
| `--azul-relleno` | `#3D5BC0` | `#3D5BC0` | Pills sólidas con texto blanco (score alto, días dentro de la ventana) |
| `--azul-suave` | `#E3E8F7` | `#2A3350` | Fondo de íconos de etapa, hover de filas, pills suaves |
| `--coral` | `#E26A61` | `#EE7F76` | Fugas punteadas, borde de íconos de fuga, arcos |
| `--coral-texto` | `#B23A32` | `#F08A80` | Texto en coral: deltas negativos |
| `--coral-relleno` | `#C2453C` | `#C2453C` | Botón Rescatar, pills de más de 3 días sin atención |
| `--coral-suave` | `#F7E2DF` | `#3D2A2D` | Hover de filas de fuga, pills suaves |
| `--neutro-suave` | tinta-2 al 10 % | tinta-2 al 10 % | Pills neutras, hover de botones sutiles |
| `--activo` · `--sobre-activo` | `#0F1014` · `#FFFFFF` | `#F2F3F6` · `#0F1014` | Estado activo: pill negra en claro, blanca en oscuro (nav, chips, tile más reciente, toasts) |
| `--sobre-relleno` | `#FFFFFF` | `#FFFFFF` | Texto sobre `-relleno` |
| `--tinta-profunda` | `#0F1014` | `#0F1014` | Velo de overlays al 40 % (`bg-black/50`) |

**Reglas de color:**

- `--azul` y `--coral` base: **solo líneas y trazos** (espina, fugas, conectores, arcos de medidores, bordes de resaltado, contorno de íconos de fuga).
- `-texto`: para letras en ese tono, y siempre sobre `--tarjeta`, `--muted` o su propio `-suave`.
- `-relleno`: para pills y botones sólidos, siempre con texto blanco (`--sobre-relleno`).
- **Nunca texto de color directo sobre el degradé** ni sobre un panel vidriado: ahí solo va `--tinta` o `--tinta-2`.
- Montos en MXN en `--tinta` con peso semibold: el dinero no tiene color propio.
- Deltas: azul si sube, coral si baja, siempre con flecha y signo; nunca el color solo.

`npm run contraste` verifica cada par en claro y oscuro (texto neutro sobre las tres paradas del degradé, sobre los paneles, tarjetas y `-suave`; `-texto` sobre tarjeta y `-suave`; blanco sobre `-relleno`; `sobre-activo` sobre `activo`; semántica de shadcn) y falla por debajo de 4.5:1.

**Semántica de shadcn/ui:** sus tokens apuntan a los de Cauce, nunca al revés: `background` = fondo-b (el `body` pinta el degradé encima), `foreground` = tinta, `card` y `popover` = tarjeta, `primary` = activo, `primary-foreground` = sobre-activo, `muted` y `secondary` = tinta-2 al 8 % sobre tarjeta, `muted-foreground` = tinta-2, `accent` = azul-suave, `destructive` = coral-relleno, `border` = linea, `input` = linea-fuerte, `ring` = azul-texto, `chart-1…5` = azul, coral, azul-relleno, coral-relleno, tenue.

**Modo oscuro por switch:** la app arranca en claro (`defaultTheme="light"`, `enableSystem={false}`). El par luna/sol del rail (y el botón de tema de la barra móvil) pone `.dark` en `<html>`; la elección persiste y el `theme-color` acompaña.

## Tipografía

- **Space Grotesk** (500/600/700): título de vista (700, 40 px; 30 px en móvil), títulos de panel (600, 20 px) y todas las cifras, con `tabular-nums`.
- **Geist** (400/500/600): interfaz, cuerpo (14 px), tablas, etiquetas.
- Escala (rem): 0.75 · 0.875 · 1 · 1.25 · 1.75 · 2.5 · 3.5 = `text-xs` … `text-3xl`. Interlineado de cuerpo 1.45; `.cifra` lo baja a 1.1.
- Sentence case, sin mayúsculas sostenidas.
- Montos: `$2.31 M MXN` en resúmenes, `$352 K` en filas del board, `$1,287,400 MXN` en detalle. Tasas con un decimal (`61.5 %`), deltas en puntos porcentuales (`↑ 0.2 pp`).

## Radios, superficies y sombras

| Pieza | Radio | Superficie | Sombra |
|---|---|---|---|
| Panel (journey, tabla de fantasmas, medidores, secciones de /fugas y /experimentos) | 32 px (`rounded-panel`; 26 px en móvil) | `vidrio` | `shadow-tarjeta` |
| Tarjeta de fase, tabla con `marco` | 26 px (`rounded-tarjeta`) | tarjeta | `shadow-tarjeta` |
| Tile de experimento | 22 px (`rounded-tile`) | tarjeta (o `activo`) | `shadow-tarjeta` |
| Fila de etapa o de fuga | 18 px (`rounded-fila`) | transparente; hover en `-suave` | — |
| Nav de vistas, chips, toggles, pills, botones | `rounded-full` | `vidrio` o `activo` | — |
| Botón de acción | círculo de 48 px (`Button variant="vidrio" size="redondo"`) | `vidrio` | — |
| Inputs, selects | 12 px (`--radius`) | tarjeta | — |
| Popovers, menús, dialog, ⌘K | 20 px (`rounded-2xl`) | popover | `shadow-flotante` |
| Sheet y drawer | 32 px en el borde visible | popover | `shadow-flotante` |
| Avisos | 18 px | activo | `shadow-flotante` |

`vidrio` es una utilidad propia (`globals.css`): `--panel` + borde `--panel-borde` + `backdrop-filter: blur(var(--vidrio))`.

## Layout

```
┌────┬─────────────────────────────────────────────────────────────────────┐
│ ◖  │ (Cauce) Fugas  Experimentos           Período 30 días  Canal Todos …  │
│ ⌕  │ Journey de adquisición                                               │
│ ☰  │ 5 oct – 1 nov 2026. De la primera visita al contrato…                │
│ ⇄  │ ╭─ Recorrido del lead ── $2.31 M en riesgo ── (RI)(MR)(PG)… +143 ⇄ ▦ ─╮│
│ ▦  │ │ ╭ Atraer ─────╮   ╭ Convertir ──╮   ╭ Cerrar ─────╮                ││
│ ⇪  │ │ │ ● Descub.   │○─○│ ● Contacto  │○─○│ ● Visita    │                ││
│    │ │ │ │           │   │ ┊ ◌ fuga    │   │ ┊ ◌ fuga    │                ││
│    │ │ │ ● Explor.   │   │ ● Calific.  │   │ ● Cierre    │                ││
│    │ │ │ ┊ ◌ fuga    │   │ ┊ ◌ Fantasmas [Rescatar]      │                ││
│    │ │ ╰─────────────╯   ╰─────────────╯   ╰─────────────╯                ││
│    │ │ Experimentos: [■ leyendo] [ ] [ ] [ ] [ ] [ ]                         ││
│ ☾  │ ╰──────────────────────────────────────────────────────────────────────╯│
│ ☀  │ ╭ Fantasmas por rescatar ──────────╮ ╭ Valor en riesgo ───────────╮    │
└────┴─────────────────────────────────────────────────────────────────────┘
```

**Escritorio (≥768 px):** rail izquierdo de 88 px, fijo, con la marca y botones circulares: buscar (⌘K), filtros, comparar con período anterior, ver como tabla y exportar (los tres últimos solo en el home); abajo, el par luna/sol (el modo vigente en pill negra) y el sello de datos demo. Arriba del contenido: la nav de vistas como pill vidriada (el activo en pill negra) y, en el home, los filtros como chips a la derecha (`Período 30 días`, `Canal Todos`…).

**Board:** tres columnas iguales con 40 px de separación; los experimentos en una fila completa debajo (en ≥1500 px pasan a una cuarta columna). Entre 768 y 1180 px, dos columnas y la fila inferior apilada.

**Móvil (<768 px):** sin rail. Nav de vistas a todo el ancho, chips con scroll horizontal, board en una columna con la etiqueta de fase arriba de cada tarjeta, y una barra flotante abajo (buscar, filtros, comparar, tema) en `vidrio`, a 16 px de los bordes. El contenido deja 96 px abajo para la barra.

## Journey board

- Cada **fila de etapa**: ícono en círculo (`--azul-suave`, trazo `--azul-texto`), nombre en `tinta-2`, volumen en cifra de 20 px, tasa de avance a la etapa siguiente y delta en pp contra el período anterior (Cierre muestra su porcentaje del total), y un círculo "ir". Abre el panel de la etapa.
- Cada **fila de fuga**: indentada 22 px debajo de su etapa de origen, ícono de gota con contorno coral punteado, causa, perdidos y monto. Abre `/fugas?poza=…`. La de Fantasmas trae el botón **Rescatar** (pill coral) que va a la poza.
- **Conectores** (`components/cauce/conectores.ts`, SVG superpuesto sin eventos): espina azul de 2 px entre íconos de etapa de la misma tarjeta; entre tarjetas, una curva (o una recta vertical si están apiladas) con puntos de 4 px en los bordes; fugas en coral punteado (1.5 px, `4 4`) que caen verticales 10 px a la derecha de la espina y se encadenan si hay varias. Se miden con `ResizeObserver` y se recalculan al cambiar tema, filtros o tamaño.
- **Experimentos**: tiles con nombre, estado y la predicción en pp (`prediccionPp`). Hover o foco resaltan la fila de la etapa que atacan (borde azul y fondo `--azul-suave`); clic lleva al detalle. El tile en pill negra es el experimento más reciente en estado "Leyendo".
- **Por rescatar**: avatares con las iniciales de los 7 fantasmas pendientes con mayor score; el badge son los días sin atención (coral si son más de 3). Clic abre el lead en /fugas.

## Medidores

Semicírculos SVG propios (no shadcn) de 22 px de grosor sobre un arco en `--linea`. Valor en riesgo por fase: tres tramos (Atraer en coral-relleno, Convertir en coral, Cerrar en azul) con leyenda en porcentaje. Rescatados hoy: un tramo en azul-relleno sobre los fantasmas del día. Cada medidor lleva `role="img"` y un `aria-label` con las cifras.

## Motion

Nada se anima solo. Las animaciones responden a acciones y se deciden por frecuencia: lo que se usa cientos de veces por día no anima.

| Pieza | Animación | Duración y curva |
|---|---|---|
| Paleta ⌘K | **Ninguna** (se abre por teclado, muchas veces por día) | — |
| Botones, toggles, pestañas, filas del board, tiles, avatares, nav | Escala al presionar (`scale(0.97)`; filas grandes 0.99) | `--duracion-presion` (160 ms), `ease-salida` |
| Popovers, menús, selects | Entran desde su trigger (`transform-origin` de Radix); salen más rápido | 150 ms entrar / 100 ms salir, `ease-salida` |
| Tooltips | Retraso de 300 ms solo para el primero; los siguientes abren al instante y sin animación | — |
| Sheet del panel | Desliza desde la derecha | 300 ms entrar / 200 ms salir, `ease-cajon` |
| Lead que sale del feed | Se desliza hacia el lado de la acción y se desvanece | 200 ms, `ease-salida` |
| Barras del desglose | `transform: translateX`, nunca `width` | `--duracion-media`, `ease-salida` |
| Hover de filas, tiles y chips | Solo color | 150–160 ms |

**Curvas propias** (las de CSS son débiles): `--curva-salida` `cubic-bezier(0.23, 1, 0.32, 1)` para entrar y salir, `--curva-movimiento` `cubic-bezier(0.77, 0, 0.175, 1)` para lo que se mueve en pantalla y `--curva-cajon` `cubic-bezier(0.32, 0.72, 0, 1)` para sheets. En Tailwind: `ease-salida`, `ease-movimiento`, `ease-cajon`. Nunca `ease-in` en UI, nunca `transition-all` (siempre propiedades explícitas) y solo se animan `transform` y `opacity` (más colores en hovers).

Con `prefers-reduced-motion` todo aparece en su estado final: la escala al presionar va bajo `motion-safe:`, y una regla global anula las animaciones de tw-animate-css, vaul y sonner, y la barra de tiempo del aviso. Los hovers ya van detrás de `@media (hover: hover)` (lo hace Tailwind v4), así que no quedan pegados en pantallas táctiles.

## Componentes

### Piezas de shadcn/ui

Las primitivas salen de shadcn/ui (`src/components/ui`); colores y variantes se ajustan **dentro** de esos archivos. En las llamadas, `className` es solo layout.

| Necesidad | Componente | Notas |
|---|---|---|
| Acción circular (rail, barra móvil, encabezado de panel) | `Button variant="vidrio" size="redondo"` | `aria-pressed` o `data-activo` la vuelve pill negra. |
| Chip de filtro | `Button variant="filtro" size="lg"` + `DropdownMenu` / `Popover` | Etiqueta en tinta-2, valor en `<b>`. |
| Nav de vistas, tabla/timeline, pozas | `ToggleGroup variant="segmentado"` / links con el mismo estilo / `Tabs variant="pill"` | Activo en pill negra. |
| Alternadores sueltos y chips de /fugas y /experimentos | `Toggle` / `ToggleGroup variant="outline"` | Pill vidriada; activa en negro. |
| Hoja de filtros (móvil) | `Drawer` | El rail abre la misma hoja en un `Popover`. |
| Panel de etapa y de experimento | ≥768 px: `Sheet` a la derecha (440 px en ≥1280, 60 % en tablet); <768: `Drawer` | Devuelve el foco a la fila que lo abrió. |
| Paleta ⌘K | `CommandDialog` | |
| Parámetros numéricos | `Slider` | |
| Datos tabulares | `Table` (`marco` = tarjeta de 26 px) | Cifras con `.cifra`, a la derecha. |
| Avisos con deshacer | `sonner` | Abajo al centro, pill activa, 5 s, uno por vez. |
| Pills de estado | `Badge` | Ver tabla abajo. |
| Ayuda sobre íconos | `Tooltip` | En todos los botones circulares. |
| Sin resultados | `Empty` | |

**No son shadcn:** el journey board (grillas, filas y el SVG de conectores), los medidores y el `RiverChart` (fuera del home; se conserva hasta nuevo aviso).

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
- Vacíos con dirección: "No hay fantasmas pendientes. Pruebe otra poza."
- Sin eyebrows decorativos ni flechas pegadas a botones.
