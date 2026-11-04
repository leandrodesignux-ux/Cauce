# Producto

## En una frase

Cauce muestra la demanda como un recorrido: entra por los canales de adquisición, avanza (o no) en cada etapa, y lo que se escapa cae a pozas que se pueden ver, cuantificar y rescatar.

## Para quién y para qué

| Quién | Pregunta que viene a responder |
|---|---|
| Líder de Growth / PM de Adquisición | ¿En qué transición del journey se pierde más valor esta semana y por qué? |
| CEO / dirección | ¿Las iniciativas en curso están moviendo lo que dijeron que iban a mover, en el plazo que dijeron? |
| Equipo comercial / CX | ¿Qué leads con intención alta se quedaron sin atender y cuáles conviene rescatar primero? |

Principio rector: **medir conversión entre etapas, no un número global difícil de mover.** Cada transición tiene su tasa, su tendencia y su dueño.

## El journey (secuencia fija, de izquierda a derecha)

1. **Descubrimiento** — sesiones por canal: SEO, Paid (Search/DSA), Directo, Referidos, Social.
2. **Exploración** — búsqueda y listado.
3. **Evaluación** — página de producto del espacio o del complejo.
4. **Contacto** — formulario, WhatsApp/chatbot, llamada.
5. **Calificación** — score de intención y nivel de lead (L0 → L2; prioridad P1 / P2+).
6. **Asignación** — el lead llega a un asesor.
7. **Visita** — agendada y luego realizada.
8. **Cierre** — LOI o contrato firmado.

## Fugas (las pozas del río)

Cada fuga cuelga de una transición y tiene causa, volumen, valor estimado en dólares (USD) y, si existe, un experimento asociado. En la interfaz se usan nombres genéricos, sin jerga de marketplace (`NOMBRE_CORTO_POZA`, `CAUSA_VISIBLE` y `NOMBRE_VISIBLE_EXPERIMENTO`).

| Transición | Fuga | Experimento asociado (demo) |
|---|---|---|
| Exploración → Evaluación | **Abandono en el listado:** salen de la página de resultados sin interactuar | Búsqueda guiada en el listado |
| Evaluación → Contacto | **Oferta no disponible:** lo que buscaban ya no estaba disponible | Alternativas cuando no hay disponibilidad |
| Evaluación → Contacto | **Dificultad para contactar:** el formulario de contacto frena el paso | Contacto más simple en desktop |
| Contacto → Calificación | **Conversación incompleta:** terminó sin los datos para calificar | — |
| Calificación → Asignación | **Leads sin atender:** conversaciones con intención que nadie atendió | Seguimiento a leads sin atender |
| Visita → Cierre | **Visita cancelada:** se canceló porque no se confirmó la disponibilidad | Confirmar disponibilidad antes de la visita |

## Vistas

Las tres vistas se leen en orden (1 Recorrido, 2 Rescate, 3 Experimentos) y cada una termina con una tarjeta **Siguiente paso** que lleva a la que sigue (la última vuelve al Recorrido). En la interfaz se habla de **fugas** (no "pozas") y de **leads sin atender** (conversaciones con intención que nadie atendió); los ids, la URL y los datos conservan sus nombres internos.

### `/` — 1 · Recorrido

En orden de lectura:

- **Título** "Recorrido de adquisición" y una línea con el período.
- **Resumen**: tres tarjetas clicables con cifras de los selectores: Valor en riesgo (suma de fugas) → `/fugas`; Leads por rescatar (leads sin atender pendientes, con "N rescatados hoy") → `/fugas?poza=fantasmas`; Experimentos activos (en curso + leyendo) → `/experimentos`.
- **Recorrido**: tres fases (Atraer, Convertir, Cerrar) en columnas desde lg, cada una con sus etapas apiladas. El encabezado de la fase dice qué porcentaje pasa a la siguiente (primera etapa de la fase siguiente / primera de esta; en Cerrar, cierre / visita). Cada tarjeta de etapa: ícono, nombre, volumen, barra de avance, "X % avanza" (Cierre: "X % del total") y el delta contra el período anterior en puntos; con comparar, "Antes: N". Clic abre el panel de la etapa.
- **Interacciones del recorrido** (todas calculadas con los selectores, ninguna en la URL): hover o foco en una etapa muestra "Avanzan N · Se quedan M" con la barra partida azul/coral, marca la etapa siguiente y, en "Dónde se pierde", resalta las fugas de esa transición y atenúa las demás. Hover o foco en una fuga marca sus dos etapas; en el encabezado de una fase, sus etapas; en un experimento, su etapa. Las cifras interpolan al cargar y al cambiar filtros (sin animación con reduced motion).
- **¿Qué pasa si mejora un paso?** (simulador): a la izquierda, **¿Dónde rinde más mejorar?**: las 7 transiciones con "+N cierres por punto" (1 punto = +1 punto porcentual en esa transición, selector `rendimientoPorPunto`), una barra proporcional y la tasa de hoy; se elige con clic o con ↑ ↓ (radiogroup) y por defecto está la de mayor rendimiento. A la derecha, el efecto: "Si {desde} → {hacia} pasa de {tasa} a {tasa nueva}", el slider "Mejora" (de 0.5 a min(10, 100 − tasa) puntos) con atajos +1, +2 y +5, la comparación "Hoy" vs. "Con la mejora" y la cadena **+N personas** (más llegan a {etapa}) → **+N cierres** ({prob} % de quienes llegan termina cerrando) → **+$X USD** en comisión ($1,000 USD por cierre). "Cómo se calcula" abre la fórmula en un popover. "Simular mejora" en una tarjeta de etapa preselecciona su fila.
- **Dónde se pierde**: una tarjeta por fuga con valor, de la más cara a la más barata: nombre, "Entre {etapa} y {etapa}", perdidos, valor en USD, el estado de su experimento (si tiene) y **Ver leads** → `/fugas?poza=…`. Leads sin atender se valúa con el modelo de pérdida.
- **Experimentos**: hasta 3 (el más reciente en lectura primero), con estado y "Busca +X puntos de {etapa} a {etapa}". Hover o foco resaltan la etapa que atacan; clic abre el detalle. Link a todos.
- **Leads sin atender**: los 4 pendientes de mayor score con **Rescatar** real (store + aviso con Deshacer).
- **Siguiente paso** → Rescate ("Ver los leads por rescatar").
- Filtros (en la URL): período, canal, sector y estado como chips. Comparar, tabla y exportar (CSV) en el rail y la barra móvil.

**Panel lateral de etapa/transición**
- Desglose por canal, sector y estado (barras horizontales ordenadas).
- Tendencia semanal de la tasa.
- Fugas de esa transición con link a `/fugas?poza=…`.
- Experimentos que apuntan a esa transición con su estado.

### `/fugas` — 2 · Rescate de leads

- **Título** "Rescate de leads" y una línea.
- **Tabs por fuga** con los pendientes de cada una. Arriba del contenido, un **banner** con el valor estimado de la fuga, "{N} sin atender en 30 días · {etapa} → {etapa}" y, en Leads sin atender, **Cómo se calcula** (modelo de pérdida en un Dialog). Si la fuga tiene leads, el banner muestra los pendientes por intención (Alto / Medio / Bajo) y por antigüedad (≤3 días, 4–14 días, más de 14) en dos barras; cada segmento filtra la lista (`?banda=`, `?antiguedad=`) y "Quitar filtros" los limpia. Fugas sin leads: monto, volumen y el experimento asociado.
- **Feed de leads**, 10 por página (`?pagina=`): nombre, score (Alto ≥70 / Medio 40–69 / Bajo <40), días sin atención y qué busca en la primera línea; el último mensaje en la segunda; **Rescatar lead** / **Descartar**. Teléfono enmascarado, mensajes y espacios vistos en un detalle desplegable ("Ver detalle"). La paginación vuelve a 1 al cambiar fuga, bandeja o filtro, y si una acción vacía la última página pasa a la anterior.
- **Rescate que se entiende**: al rescatar, la fila muestra "Rescatado" con un check y fondo azul, colapsa a los 450 ms y un "+1" vuela hasta el conteo de Rescatados, que hace un bump; el desglose del banner se reacomoda. Al descartar, la fila se corre a la izquierda en gris y colapsa a los 250 ms (bump en Descartados). La selección múltiple sigue la misma secuencia con 40 ms entre filas, y "Deshacer" la cancela. En la home, "Leads sin atender" hace lo mismo (fila azul y salida) y "rescatados hoy" hace bump. Con reduced motion, la fila se quita al instante.
- Bandejas como control segmentado (Pendientes N | Rescatados N | Descartados N) y "Mostrando 1–10 de N".
- Atajos `R` / `D` sobre el elemento enfocado, `J` / `K` para moverse dentro de la página, selección múltiple con `Shift`, `Esc` limpia la selección. Deshacer durante 5 s (aviso).
- **Interacción clave:** al rescatar, el lead sale de la fuga; en `/` suben "rescatados hoy" en el resumen y la tabla de leads sin atender se actualiza.
- **Siguiente paso** → Experimentos ("Ver qué se está probando").

### `/experimentos` — 3 · Experimentos

Cada iniciativa declara, antes de desplegarse, qué espera mover y cuándo se va a poder leer.

- **Tarjetas agrupadas por estado** (En curso, Leyendo, Validado, Refutado y Diseño; sin grupos vacíos), cada grupo con su conteo. "Ver como tabla" (`?vista=tabla`: palanca, transición, hipótesis, despliegue, ventana de lectura, predicho vs. observado, estado) y "Ver como tarjetas" para volver. Las URLs viejas siguen andando: `?vista=timeline` se ve como tarjetas y `?estado=` se ignora.
- Nombres visibles genéricos (Búsqueda guiada en el listado, Alternativas cuando no hay disponibilidad, Contacto más simple en desktop, Páginas de producto por categoría, Páginas de producto optimizadas para SEO, Seguimiento a leads sin atender, Confirmar disponibilidad antes de la visita).
- Clic en un experimento: detalle centrado (Dialog de hasta 760 px; Drawer en móvil) en una columna: el veredicto ("Funcionó: +0.6 puntos contra +0.5 esperados", "No cumplió…" o "Se podrá medir a partir del {fecha}") con la ventana de lectura, Esperado y Observado con sus barras, la conversión semanal de la transición con leyenda, "Cómo se planteó" plegado (hipótesis, palanca, métrica, despliegue y lectura) y el link a la transición en el recorrido. `?exp=`, Esc y la vuelta del foco se mantienen.
- **Siguiente paso** → Recorrido ("Volver al recorrido").

### `/leads/[id]` — Recorrido de un lead

- Línea de tiempo de touchpoints (canal de entrada, páginas vistas, espacios, mensajes, asignación, visita).
- Mini-cauce que marca en qué etapa está o dónde se detuvo.
- Conversación demo resumida con el score de intención y las señales que lo explican (urgencia, superficie, zona, presupuesto).

### Global

- Nav de vistas numerada en el orden de la demo: 1 Recorrido, 2 Rescate, 3 Experimentos. Rail de botones circulares (buscar, filtros, comparar, tabla, exportar, cómo funciona, tema). En móvil, nav fija arriba y barra flotante abajo.
- **Onboarding** animado: un escenario de partículas a pantalla completa, siempre en oscuro, en 3 actos. Acto 1: las partículas forman "{sesiones}" (etiqueta "sesiones"), se apagan y un 3 % forma "{cierres}"; título "{N} llegaron. {N} firmaron.". Acto 2: las apagadas pasan a coral y caen a una poza por fuga (ancho ∝ √valor, partículas ∝ valor) con su nombre y monto (en móvil, solo las 3 mayores), y luego suben a formar "{monto} en riesgo". Acto 3: una fracción (la proporción de Leads sin atender en el valor en riesgo, entre 20 % y 45 %) vuelve en arco y forma "+{contratos}" ("contratos si se rescatan", del modelo de pérdida), con el chip del experimento destacado. Las cifras son las de la home con los filtros por defecto. Autoplay tipo historias con 3 segmentos (clic en uno va a ese acto); pausa con el botón, Espacio, hover sobre las partículas o foco de teclado en un control; ← → cambian de acto. Se abre solo en la primera visita y se marca como visto al cerrarlo por cualquier vía: Saltar, Esc o **Ver mi recorrido** (las partículas explotan, el overlay se desvanece, lleva a `/` si hace falta y el contenido se asienta). Se reabre desde el rail y la barra móvil (Cómo funciona) y desde ⌘K (Ver cómo funciona).
- Paleta de comandos `⌘K` / `Ctrl+K`: saltar a una vista, una etapa, una fuga, un experimento o un lead, abrir el onboarding e iniciar, pausar o reiniciar la demo en vivo.
- **Modo demo en vivo** (todo lo simulado va rotulado): "Activar demo en vivo" (barra superior, barra móvil, ⌘K o `?demo=1`) genera ~1 hora del período cada 1.2 s con un motor determinista (`lib/demoVivo.ts`, semilla fija): sesiones que llegan por canal, sector y estado y bajan por el embudo con las tasas del período, leads sin atender nuevos (`SIM-0001…`) y semanas simuladas para los experimentos en curso o en lectura. Las filas y los leads simulados se suman a los reales en `useDatos`, así todas las vistas se recalculan solas. En la home, **Actividad en vivo** (sesiones por hora y los últimos eventos) y chips "+N" en las etapas; en Rescate, los leads nuevos entran arriba con "Nuevo" (o una pill "{N} leads nuevos · Ver" si se está en otra página); en Experimentos, "Lectura {n} %" en las tarjetas y, en el detalle, una **lectura simulada** que recalcula el observado (`observadoDeSerie`) y el veredicto ("Va en… de… esperados" → "Funcionó" / "No cumplió"). La pastilla "En vivo · simulado" pausa, reinicia o apaga; apagada, todas las cifras vuelven exactamente a las de los datos.
- Sello visible "Prototipo con datos demo" en el rail (en móvil, al pie del contenido).

## Fuera de alcance

Autenticación, backend, conexión a bases reales, envío real de mensajes, multiidioma.
