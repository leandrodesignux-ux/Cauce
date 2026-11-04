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
2. **Exploración** — búsqueda y Browse Pages.
3. **Evaluación** — ficha de espacio (Spot Detail) o ficha de complejo.
4. **Contacto** — formulario, WhatsApp/chatbot, llamada.
5. **Calificación** — score de intención y nivel de lead (L0 → L2; prioridad P1 / P2+).
6. **Asignación** — el lead llega a un broker.
7. **Visita** — agendada y luego realizada.
8. **Cierre** — LOI o contrato firmado.

## Fugas (las pozas del río)

Cada fuga cuelga de una transición y tiene causa, volumen, valor estimado en MXN y, si existe, un experimento asociado.

| Transición | Fuga | Experimento asociado (demo) |
|---|---|---|
| Exploración → Evaluación | Rebote en Browse Page sin interacción | Búsqueda guiada (quiz en Browse Pages de pago) |
| Evaluación → Contacto | Espacio no disponible: el usuario llega a una ficha muerta | Flujo de spots no disponibles |
| Evaluación → Contacto | Fricción en el panel de contacto (desktop) | Rediseño del panel de contacto |
| Contacto → Calificación | Conversación sin datos mínimos | — |
| Calificación → Asignación | **Fantasmas:** conversaciones con intención que nunca llegaron a un broker | Rescate de fantasmas |
| Visita → Cierre | Visita cancelada por disponibilidad no validada | Validación de disponibilidad en el bot |

## Vistas

Las tres vistas se leen en orden (1 Recorrido, 2 Rescate, 3 Experimentos) y cada una termina con una tarjeta **Siguiente paso** que lleva a la que sigue (la última vuelve al Recorrido). En la interfaz se habla de **fugas** (no "pozas") y de **leads sin atender** (no "fantasmas": conversaciones con intención que nunca llegaron a un broker); los ids, la URL y los datos conservan sus nombres internos.

### `/` — 1 · Recorrido

En orden de lectura:

- **Título** "Recorrido de adquisición" y una línea con el período.
- **Resumen**: tres tarjetas clicables con cifras de los selectores: Valor en riesgo (suma de fugas) → `/fugas`; Leads por rescatar (leads sin atender pendientes, con "N rescatados hoy") → `/fugas?poza=fantasmas`; Experimentos activos (en curso + leyendo) → `/experimentos`.
- **Recorrido**: stepper de 8 tarjetas de etapa agrupadas por fase (Atraer, Convertir, Cerrar) con un chevron entre tarjetas. Cada tarjeta: ícono, nombre, volumen, "X % avanza" (Cierre: "X % del total") y el delta contra el período anterior en puntos. Con "comparar", también "Antes: N". Clic o Enter abre el panel de la etapa (`?etapa=…`) y al cerrar el foco vuelve a la tarjeta. "Ver como tabla" reemplaza el stepper por las tablas.
- **Dónde se pierde**: una tarjeta por fuga con valor, de la más cara a la más barata: nombre, "Entre {etapa} y {etapa}", perdidos, valor en MXN, el estado de su experimento (si tiene) y **Ver leads** → `/fugas?poza=…`. Leads sin atender se valúa con el modelo de pérdida.
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
- **Tabs por fuga** con los pendientes de cada una. Debajo, la causa, las etapas y una línea con el **valor estimado** de la fuga activa; en Leads sin atender, el botón **Cómo se calcula** abre en un Dialog el modelo de pérdida (sliders de leads sin atender, lead → cita, cita → contrato y comisión, con la fórmula paso a paso).
- **Feed de leads**: arriba lo clave (nombre, score Alto ≥70 / Medio 40–69 / Bajo <40, días sin atención, qué busca y **Rescatar lead** / **Descartar**); en una segunda línea más chica, teléfono enmascarado, último mensaje, mensajes, espacios vistos y urgencia.
- Bandejas (pendientes, rescatados, descartados) y filtros por score y antigüedad (ventana crítica de 3 días destacada).
- Atajos `R` / `D` sobre el elemento enfocado, `J` / `K` para moverse, selección múltiple con `Shift`. Deshacer durante 5 s (aviso).
- **Interacción clave:** al rescatar, el lead sale de la fuga; en `/` suben "rescatados hoy" en el resumen y la tabla de leads sin atender se actualiza.
- **Siguiente paso** → Experimentos ("Ver qué se está probando").

### `/experimentos` — 3 · Experimentos

Cada iniciativa declara, antes de desplegarse, qué espera mover y cuándo se va a poder leer.

- Tres vistas: **Tarjetas** (por defecto, grilla de 1/2/3 columnas), **Tabla** (`?vista=tabla`: palanca, transición, hipótesis, despliegue, ventana de lectura, predicho vs. observado, estado) y **Timeline** (`?vista=timeline`: barras hasta el fin de la lectura y línea de "hoy").
- Filtro por estado (Diseño, En curso, Leyendo, Validado, Refutado).
- Clic en un experimento: detalle con hipótesis, métrica, resultado y link a la transición en el recorrido.
- **Siguiente paso** → Recorrido ("Volver al recorrido").

### `/leads/[id]` — Recorrido de un lead

- Línea de tiempo de touchpoints (canal de entrada, páginas vistas, espacios, mensajes, asignación, visita).
- Mini-cauce que marca en qué etapa está o dónde se detuvo.
- Conversación demo resumida con el score de intención y las señales que lo explican (urgencia, superficie, zona, presupuesto).

### Global

- Nav de vistas en pill, numerada en el orden de la demo: 1 Recorrido, 2 Rescate, 3 Experimentos. Rail de botones circulares (buscar, filtros, comparar, tabla, exportar, cómo funciona, tema). En móvil, nav fija arriba y barra flotante abajo.
- **Onboarding** de 3 slides (dónde se pierde la demanda, cada fuga tiene un valor, los experimentos atacan las fugas). Se abre solo en la primera visita y se marca como visto al cerrarlo por cualquier vía (`onboardingVisto` en el store de sesión). Se reabre desde el rail y la barra móvil (Cómo funciona) y desde ⌘K (Ver cómo funciona). ← → cambian de slide; Esc cierra; "Empezar" lleva a `/`.
- Paleta de comandos `⌘K` / `Ctrl+K`: saltar a una vista, una etapa, una fuga, un experimento o un lead, y abrir el onboarding.
- Sello visible "Prototipo con datos demo" en el rail (en móvil, al pie del contenido).

## Fuera de alcance

Autenticación, backend, conexión a bases reales, envío real de mensajes, multiidioma.
