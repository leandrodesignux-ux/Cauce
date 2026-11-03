# Datos

Todo es demo y determinístico. El script `scripts/seed.ts` (ejecutado con `npm run seed` vía `tsx`) genera JSON en `src/data/` con un PRNG `mulberry32(2026)`. Mismo seed, mismos datos, siempre.

## Cifras reales permitidas (agregadas, con etiqueta de origen)

Provienen del prototipo Ghost y solo se usan como valores iniciales del modelo de pérdida en `/fugas`:

| Parámetro | Valor | Origen |
|---|---|---|
| Fantasmas detectados | 643 | Análisis cruzado 2 feb – 4 may 2026 |
| Lead → cita | 30 % | Supuesto del modelo Ghost |
| Cita → contrato | 10 % | Supuesto del modelo Ghost |
| Comisión promedio | $18,000 MXN | Supuesto del modelo Ghost |

**El monto se calcula siempre desde los parámetros:** `fantasmas × lead→cita × cita→contrato × comisión`. Con los valores iniciales da 643 × 0.30 × 0.10 × 18,000 ≈ **$347,220 MXN**. No copiar el "$1,287,400" del prototipo Ghost: no se desprende de esa fórmula. Si existe un factor adicional (otra comisión, ticket por contrato, horizonte), se agrega como parámetro explícito y visible.

## Dimensiones

```ts
type Canal = "seo" | "paid" | "directo" | "referidos" | "social";
type Sector = "oficina" | "industrial" | "bodega" | "local" | "terreno" | "coworking";
type Estado = "CDMX" | "Edomex" | "Nuevo León" | "Jalisco" | "Querétaro" | "Puebla" | "Yucatán";
type EtapaId = "descubrimiento" | "exploracion" | "evaluacion" | "contacto"
             | "calificacion" | "asignacion" | "visita" | "cierre";
```

Pesos de muestreo (demo): canal seo 42 %, paid 28 %, directo 18 %, referidos 7 %, social 5 %. Sector oficina 34 %, industrial 22 %, local 18 %, bodega 12 %, coworking 8 %, terreno 6 %. Estado CDMX 38 %, Nuevo León 16 %, Jalisco 14 %, Edomex 12 %, Querétaro 10 %, Puebla 6 %, Yucatán 4 %.

## Configuración de etapas

`src/config/etapas.ts` define orden, nombre visible y la definición de cada etapa. Las definiciones de nivel de lead (L0, L1, L2) y prioridad (P1, P2+) quedan como texto configurable con valor `"Definición pendiente de confirmar"` hasta que el equipo las valide; la UI las muestra en el tooltip de Calificación.

## Entidades

```ts
type SemanaEtapa = {        // src/data/flujo.json
  semana: string;           // ISO lunes, 26 semanas hasta 2026-10-26
  canal: Canal; sector: Sector; estado: Estado;
  volumen: Record<EtapaId, number>;
};

type Fuga = {               // src/data/fugas.json
  id: string;
  desde: EtapaId; hacia: EtapaId;
  causa: string;            // p. ej. "Espacio no disponible"
  experimentoId?: string;
};

type Lead = {               // src/data/leads.json (~400 registros)
  id: string;
  nombre: string;           // nombre + inicial, generado ("María R.")
  telefono: string;         // siempre enmascarado: "+52 55 ••••2845"
  canal: Canal; sector: Sector; estado: Estado;
  etapaActual: EtapaId;
  fugaId?: string;          // si está en una poza
  score: number;            // 0–100
  urgencia: boolean;
  ultimoMensaje: string;    // de un banco de ~40 frases demo por sector
  mensajes: number; espaciosVistos: number;
  creadoEl: string; ultimaActividad: string;
  touchpoints: { fecha: string; tipo: string; detalle: string }[];
};

type Experimento = {        // src/data/experimentos.json
  id: string;
  nombre: string;
  palanca: string;
  transicion: { desde: EtapaId; hacia: EtapaId };
  hipotesis: string;        // cuantificada
  metrica: string;
  prediccionPp: number;     // puntos porcentuales esperados
  observadoPp?: number;
  despliegue: string;
  ventanaSemanas: [number, number];
  estado: "diseno" | "en_curso" | "leyendo" | "validado" | "refutado";
};
```

## Tasas demo por transición (media semanal, con ruido ±10 %)

| Transición | Tasa |
|---|---|
| Descubrimiento → Exploración | 62 % |
| Exploración → Evaluación | 38 % |
| Evaluación → Contacto | 6.5 % |
| Contacto → Calificación | 71 % |
| Calificación → Asignación | 64 % |
| Asignación → Visita | 31 % |
| Visita → Cierre | 11 % |

Descubrimiento: ~45,000 sesiones/semana repartidas por los pesos. Industrial y terreno con Evaluación → Contacto más baja y ticket más alto; coworking al revés. Agregar una tendencia leve: Evaluación → Contacto sube 0.4 pp en las 6 semanas posteriores al despliegue del experimento del panel de contacto.

## Experimentos semilla (nombres reales de iniciativas, números demo)

| Nombre | Transición | Estado |
|---|---|---|
| Búsqueda guiada en Browse Pages de pago | Exploración → Evaluación | Leyendo |
| Flujo de spots no disponibles | Evaluación → Contacto | En curso |
| Rediseño del panel de contacto (desktop) | Evaluación → Contacto | Validado |
| Templates de ficha por sector | Evaluación → Contacto | Diseño |
| Ficha de complejo con jerarquía SEO | Descubrimiento → Exploración | En curso |
| Rescate de fantasmas | Calificación → Asignación | En curso |
| Validación de disponibilidad en el bot | Visita → Cierre | Diseño |

## Privacidad

Ningún dato del generador puede parecer una persona real identificable: nombres de una lista genérica, teléfonos con 4 dígitos visibles aleatorios, mensajes escritos para el demo.
