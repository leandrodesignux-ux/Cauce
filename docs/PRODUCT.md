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

### `/` — El journey board (home)

Lo primero que se ve es el recorrido completo, no una fila de KPI cards. Referencia visual: `docs/referencia/cauce-home-referencia.html`.

- Título "Journey de adquisición" con el período en el subtítulo.
- Panel **Recorrido del lead**: valor en riesgo del período (suma de pozas en MXN) y cuántas pozas lo forman; la tira **Por rescatar** con los 7 fantasmas pendientes de mayor score (iniciales y días sin atención, en coral si son más de 3; clic abre el lead en `/fugas`, "+N" son los demás pendientes); botones de comparar y de ver como tabla.
- **Tres tarjetas por fase**: Atraer (Descubrimiento, Exploración, Evaluación), Convertir (Contacto, Calificación, Asignación) y Cerrar (Visita, Cierre). Cada etapa es una fila con volumen, tasa de avance a la siguiente y delta en pp contra el período anterior (Cierre: porcentaje del total). Debajo de cada etapa, indentadas, sus fugas con causa, perdidos y monto.
- Conectores: espina azul entre etapas, curvas con puntos entre tarjetas, fugas en coral punteado que caen separadas de la espina.
- Clic en una etapa: abre el panel de la etapa y actualiza la URL (`?etapa=…`). Clic en una fuga: `/fugas?poza=…`. **Rescatar** en Fantasmas: va a la poza de fantasmas.
- **Experimentos**: tiles con estado y la predicción en pp; hover o foco resaltan la etapa que atacan; clic abre el detalle. El tile negro es el experimento más reciente en lectura.
- Filtros (en la URL): período (7d / 30d / 90d / personalizado), canal, sector, estado de la República, como chips arriba a la derecha.
- "Comparar con período anterior": cada etapa muestra también el volumen del período anterior. "Ver como tabla": la misma información en tablas accesibles. "Exportar" (rail): CSV con etapas y pozas con los filtros vigentes.
- **Fila inferior**: tabla **Fantasmas por rescatar** con los 4 de mayor score (intención, días sin atención, qué buscan) y **Rescatar** real (store + aviso con Deshacer); medidores de **valor en riesgo por fase** y **rescatados hoy** sobre los fantasmas del día.

**Panel lateral de etapa/transición**
- Desglose por canal, sector y estado (barras horizontales ordenadas).
- Tendencia semanal de la tasa.
- Fugas de esa transición con link a `/fugas?poza=…`.
- Experimentos que apuntan a esa transición con su estado.

### `/fugas` — Pozas y rescate (heredado de Ghost)

- Encabezado: modelo de pérdida con parámetros editables (sliders): volumen de fantasmas, lead → cita, cita → contrato, comisión promedio. El monto se recalcula en vivo y muestra la fórmula paso a paso.
- Tabs por poza (fantasmas, no disponibles, visitas canceladas…).
- Feed de leads con: nombre demo abreviado, teléfono enmascarado, sector, estado, score de intención (Alto ≥70 / Medio 40–69 / Bajo <40), urgencia, último mensaje, antigüedad, mensajes, espacios vistos.
- Filtros por banda de score y por antigüedad (destacar la ventana crítica de 3 días).
- Acciones: **Rescatar lead** y **Descartar**. Atajos `R` / `D` sobre el elemento enfocado, `J` / `K` para moverse. Selección múltiple con `Shift`.
- **Interacción clave:** al rescatar, el lead sale de la poza: en `/` deja la tira y la tabla de fantasmas y sube el medidor de rescatados hoy. Deshacer disponible durante 5 s (toast).

### `/experimentos` — Registro de hipótesis

Cada iniciativa debe declarar, antes de desplegarse, qué espera mover y cuándo se va a poder leer.

- Columnas: palanca, transición objetivo, hipótesis cuantificada ("+X pp en Evaluación → Contacto"), fecha de despliegue, ventana de lectura (p. ej. 6–8 semanas), predicho vs. observado, estado (Diseño, En curso, Leyendo, Validado, Refutado).
- Vista timeline: barras desde despliegue hasta fin de ventana de lectura, línea de "hoy".
- Gráfico de calibración: dispersión predicho vs. observado con la diagonal ideal. Responde "¿qué tan bien predecimos?".
- Click en experimento: detalle con hipótesis, métrica, resultado y link a la transición en el cauce.

### `/leads/[id]` — Recorrido de un lead

- Línea de tiempo de touchpoints (canal de entrada, páginas vistas, espacios, mensajes, asignación, visita).
- Mini-cauce que marca en qué etapa está o dónde se detuvo.
- Conversación demo resumida con el score de intención y las señales que lo explican (urgencia, superficie, zona, presupuesto).

### Global

- Nav de vistas en pill (Cauce, Fugas, Experimentos) y rail de botones circulares (buscar, filtros, comparar, tabla, exportar, tema). En móvil, barra flotante abajo.
- Paleta de comandos `⌘K` / `Ctrl+K`: saltar a una vista, un lead, un experimento o una etapa.
- Sello visible "Prototipo con datos demo" en el rail (en móvil, al pie del contenido).

## Fuera de alcance

Autenticación, backend, conexión a bases reales, envío real de mensajes, multiidioma.
