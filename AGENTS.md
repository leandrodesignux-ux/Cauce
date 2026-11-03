# Cauce — instrucciones para Codex

Cauce es un dashboard interactivo del journey de adquisición de un marketplace B2B de inmuebles comerciales en México (oficinas, naves industriales, bodegas, locales, terrenos, coworking). Muestra cómo fluye la demanda desde que alguien llega al sitio hasta que firma, dónde se pierde, cuánto vale lo que se pierde y qué experimentos de Growth están intentando cerrar cada fuga.

Antes de cualquier tarea, leé en este orden:

1. `docs/PRODUCT.md` — qué es, para quién, vistas e interacciones.
2. `docs/DESIGN.md` — tokens, layout, componentes y motion.
3. `docs/DATA.md` — modelo de datos y reglas del generador demo.
4. `docs/PROMPTS.md` — la fase en la que estamos y sus criterios de aceptación.

## Reglas no negociables

- **Una fase por vez.** Trabajá solo la fase que te pidieron. Al terminar, listá qué hiciste, qué quedó pendiente y cualquier decisión que tomaste sin que estuviera en los docs.
- **Next.js cambia rápido.** Antes de usar APIs de routing, fonts, metadata o server components, revisá la documentación incluida en `node_modules/next/dist/docs/` y respetá los avisos de deprecación.
- **Datos 100% demo.** Nada de nombres, teléfonos, emails ni conversaciones reales. Todo sale del generador con seed fija (`docs/DATA.md`). Las únicas cifras reales permitidas son las agregadas que figuran en `DATA.md`, y siempre con su etiqueta de origen.
- **Cada número se calcula, no se escribe a mano.** Totales, conversiones y montos en MXN se derivan de los datos o de los parámetros del modelo. Ningún KPI hardcodeado en un componente.
- **Tokens, no valores sueltos.** Colores, tipografía, radios y espaciados salen de `src/styles/tokens.css`. Si necesitás un valor nuevo, agregalo al token y avisalo.
- **El estado vive en la URL cuando es compartible** (filtros, período, etapa seleccionada, vista tabla/flujo). El estado de sesión (leads rescatados, descartados) vive en un store de Zustand persistido en `localStorage`.
- **Accesibilidad mínima obligatoria:** foco visible, navegación por teclado en todas las vistas, `prefers-reduced-motion` respetado, y toda visualización con alternativa en tabla.
- **Nada de dependencias sin justificar.** Stack permitido: Next.js, React, TypeScript, Tailwind CSS v4, Zustand, d3-scale, d3-shape, d3-array, motion (Framer Motion), lucide-react, cmdk, next-themes y lo que pide shadcn/ui (estilo Nova, base radix): radix-ui, class-variance-authority, clsx, tailwind-merge, tw-animate-css; como dev: tsx, shadcn (CLI y `shadcn/tailwind.css`), @types/d3-scale, @types/d3-shape, @types/d3-array. Cualquier otra: preguntá primero.
- **shadcn/ui:** antes de agregar o usar un componente, corré `npx shadcn@4.22.1 docs <componente>`. Los componentes importan `cn` de `@/lib/utils` (clsx + tailwind-merge), no del paquete `cn`. Texto en cauce, latón u óxido: siempre la variante `-texto` (ver DESIGN.md); `npm run contraste` tiene que pasar.
- **Git:** una rama por fase (`fase-N-nombre`), commits chicos, `npm run lint` y `npm run build` sin errores antes de cada commit. Nunca push a `main` salvo que te lo pidan.
- **Copy en español de México para la interfaz** (usted/impersonal, nada de voseo en la UI). Sentence case. Verbos concretos en botones: "Rescatar lead", no "Enviar".
