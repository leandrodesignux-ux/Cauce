# Diseño

## Dirección

El tema es agua que se canaliza y se escapa. El río es lo único con personalidad fuerte; todo lo demás (navegación, tablas, filtros, paneles) es sobrio, plano y disciplinado para que el cauce mande. Nada de grillas de tarjetas idénticas con sombra: la jerarquía se arma con espacio, peso tipográfico y líneas de 1 px.

## Color

Base fría tipo concreto (no crema), un verde de cauce, latón para el dinero y óxido para lo que se pierde.

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--concreto` | `#E9EBE8` | `#18211D` | Fondo de la app |
| `--papel` | `#F7F8F6` | `#1F2A25` | Panel lateral, tablas, popovers |
| `--tinta` | `#142019` | `#E4E9E6` | Texto principal, ejes |
| `--niebla` | `#8A9A93` | `#8A9A93` | Texto secundario, período anterior, líneas guía |
| `--cauce` | `#2E6B52` | `#409673` | Volumen que avanza, acciones primarias, foco |
| `--laton` | `#A9822F` | `#CCA249` | Montos en MXN, valor en riesgo, comisiones |
| `--oxido` | `#B4472F` | `#D1674F` | Fugas, pozas, deltas negativos |
| `--linea` | `#D3D8D4` | `#2E3A34` | Separadores de 1 px |
| `--linea-fuerte` | `#B9C1BC` | `#3C4943` | Bordes de controles, ejes marcados |
| `--sombra-flotante` | `0 8px 24px rgb(20 32 25 / 0.10)` | `0 8px 24px rgb(0 0 0 / 0.40)` | Popovers y panel lateral |

Derivados con `color-mix()` sobre el token base, así siguen al modo oscuro: `--cauce-suave` (cauce al 14 %), `--oxido-suave` (óxido al 12 %). Deltas positivos en `--cauce`, negativos en `--oxido`; nunca el color solo: siempre con signo y flecha.

Modo oscuro (secundario, solo vía `prefers-color-scheme`, sin toggle): cauce, latón y óxido suben +12 de L en HSL. `--niebla` se mantiene porque ya contrasta 5.6:1 sobre el fondo oscuro; las líneas bajan a verdes casi negros para seguir siendo sutiles.

## Tipografía

- **Space Grotesk** (500/600): títulos de vista y todas las cifras grandes, con `font-variant-numeric: tabular-nums`.
- **Geist** (400/500): interfaz, cuerpo, tablas, etiquetas.
- Escala (rem): 0.75 · 0.875 · 1 · 1.25 · 1.75 · 2.5 · 3.5, que reemplaza la escala de Tailwind como `text-xs` · `text-sm` · `text-base` · `text-lg` · `text-xl` · `text-2xl` · `text-3xl`. Todos los tamaños usan interlineado 1.5.
- Cifras y KPIs: utilidad `.cifra` (Space Grotesk, `tabular-nums`, interlineado 1.1). El interlineado no está atado al tamaño: `.cifra` se combina con cualquier `text-*`.
- Etiquetas en sentence case, sin mayúsculas sostenidas ni tracking exagerado. Sin monoespaciada para datos chicos: Geist con cifras tabulares.
- Montos: `$1.29 M MXN` en resúmenes, `$1,287,400 MXN` en detalle. Porcentajes con un decimal en tasas (`23.4 %`), deltas en puntos porcentuales (`+1.8 pp`).

## Espaciado

Escala por defecto de Tailwind (base 4 px: `p-1` = 4 px, `p-2` = 8 px, `p-4` = 16 px…). No se definen tokens propios de espaciado; si hace falta un valor fuera de la escala, se agrega como token en `tokens.css`.

## Layout

Escritorio (≥1280 px):

```
┌────────┬──────────────────────────────────────────────────────────┐
│ Cauce  │ Período ▾  Canal ▾  Sector ▾  Estado ▾      [Comparar] [Tabla] │
│ Fugas  ├──────────────────────────────────────────────────────────┤
│ Exper. │ Valor en riesgo $2.4 M MXN      Rescatados hoy 12          │
│        │                                                          │
│        │ Descub. ══════╗Explor.════╗Evalua.═══╗Contac.══╗ … Cierre  │
│        │        23.4%  ║   41.0%   ║  8.2%    ║  …                  │
│        │               ╿           ╿          ╿                     │
│        │            ( poza )    ( poza )   ( fantasmas )            │
│        │                                                          │
│ Demo   │                                   ┌──── panel lateral ────┐│
└────────┴───────────────────────────────────┴───────────────────────┘
```

- Navegación lateral fija de 200 px, colapsable a íconos.
- El cauce ocupa todo el ancho disponible y ~55 % del alto visible. Las pozas viven en la franja inferior.
- El panel lateral entra desde la derecha (420 px) y empuja el cauce, no lo tapa.
- Contenido alineado a la izquierda; cifras alineadas a la derecha en tablas.

Tablet (768–1279 px): navegación colapsada a íconos, panel lateral como hoja de 60 % del ancho.

Móvil (<768 px): el cauce se vuelve vertical, de arriba hacia abajo; las pozas cuelgan a la derecha de cada transición. Filtros en una hoja inferior. Panel lateral a pantalla completa.

## Radios y bordes (por jerarquía, no uno para todo)

- Controles (botones, inputs, chips): 6 px.
- Panel lateral y popovers: 10 px en el borde visible.
- Regiones de visualización: sin radio, sin borde; las separa el espacio.
- Sombras: solo en popovers y en el panel lateral (`0 8px 24px rgb(20 32 25 / 0.10)`).

## El cauce (componente estrella)

- SVG propio con d3-scale y d3-shape (curvas `curveBasis`). No usar un sankey de librería.
- Ancho del cauce en cada etapa = escala lineal del volumen, con un mínimo visible de 6 px.
- Relleno `--cauce` con un leve degradé de opacidad hacia la derecha (de 100 % a 80 %): el agua pierde fuerza.
- Fugas: hilos de 1–8 px (según volumen) en `--oxido` que bajan desde el borde inferior hacia la poza. La poza es una elipse plana con la cifra en latón.
- Período anterior: contorno en `--niebla`, 1 px, punteado, detrás del río.
- Retorno de rescatados: hilo en `--cauce` que sube desde la poza de fantasmas hasta Asignación.
- Etiquetas de etapa arriba del cauce; tasa de la transición en el hueco entre etapas.

## Motion

Un solo momento orquestado: en la primera carga el agua llena el cauce de izquierda a derecha (1.2 s, ease-out) y recién después caen los hilos de las fugas (0.4 s, escalonado). Nada más se anima solo.

Motion como respuesta a acciones:
- Cambiar filtros: el ancho del cauce interpola en 300 ms.
- Rescatar: la tarjeta sale del feed y el contador sube; en el cauce aparece el hilo de retorno.
- Abrir panel: deslizamiento de 200 ms.

Con `prefers-reduced-motion`: todo aparece en su estado final, sin interpolación.

## Componentes

`AppShell`, `NavRail`, `FilterBar`, `RiverChart`, `StagePanel`, `LeakPool`, `LossModel` (sliders + fórmula), `LeadFeedItem`, `ScoreBadge`, `ExperimentTable`, `ExperimentTimeline`, `CalibrationPlot`, `LeadTimeline`, `MiniRiver`, `CommandPalette`, `Toast`, `DataTable` (alternativa accesible de cada gráfico).

## Copy

- Español de México, impersonal o "usted". Verbos concretos: "Rescatar lead", "Descartar", "Comparar con período anterior", "Ver como tabla".
- Vacíos con dirección: "No hay fantasmas con score alto en este período. Pruebe ampliar a 90 días."
- Sin títulos con una sola palabra resaltada, sin eyebrows decorativos, sin flechas `→` pegadas a botones.
