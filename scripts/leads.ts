// Generador de leads demo. Nombres, teléfonos y mensajes son inventados: ninguno corresponde a una persona real.

import { CANALES, SECTORES } from "../src/config/dimensiones";
import { ORDEN_ETAPAS } from "../src/config/etapas";
import { FECHA_CORTE } from "../src/config/modelo";
import { bernoulli, elegir, elegirPonderado, entero, uniforme, type Rng } from "../src/lib/prng";
import type { Estado, EtapaId, Fuga, Lead, Sector, SenalesLead, Touchpoint } from "../src/lib/tipos";
import { PESO_CANAL, PESO_ESTADO, PESO_SECTOR } from "./parametros";

// ---------------------------------------------------------------------------
// Bancos demo

const NOMBRES = [
  "María", "José", "Ana", "Luis", "Laura", "Carlos", "Sofía", "Jorge", "Daniela", "Miguel",
  "Fernanda", "Ricardo", "Valeria", "Alejandro", "Gabriela", "Eduardo", "Paola", "Roberto", "Andrea", "Fernando",
  "Mariana", "Javier", "Lucía", "Sergio", "Camila", "Raúl", "Patricia", "Héctor", "Ximena", "Arturo",
  "Regina", "Manuel", "Natalia", "Óscar", "Renata", "Diego", "Elena", "Rodrigo", "Isabel", "Pablo",
];

const INICIALES = "ABCDEFGHIJLMNOPRSTVZ";

const LADA: Record<Estado, string> = {
  CDMX: "55",
  Edomex: "55",
  "Nuevo León": "81",
  Jalisco: "33",
  Querétaro: "442",
  Puebla: "222",
  Yucatán: "999",
};

const ZONAS: Record<Estado, readonly string[]> = {
  CDMX: ["Polanco", "Reforma", "Santa Fe", "Insurgentes Sur", "Roma Norte", "Del Valle"],
  Edomex: ["Tlalnepantla", "Naucalpan", "Cuautitlán Izcalli", "Toluca"],
  "Nuevo León": ["San Pedro Garza García", "Apodaca", "Escobedo", "Monterrey Centro"],
  Jalisco: ["Zapopan", "El Salto", "Guadalajara Centro", "Tlaquepaque"],
  Querétaro: ["El Marqués", "Juriquilla", "Centro Sur"],
  Puebla: ["Angelópolis", "Cuautlancingo", "Centro Histórico"],
  Yucatán: ["Mérida Norte", "Periférico Poniente", "Umán"],
};

/** Rango de superficie (m²) y precio mensual por m² (MXN) por sector. */
const ESPACIO: Record<Sector, { m2: [number, number]; precioM2: number }> = {
  oficina: { m2: [80, 600], precioM2: 350 },
  industrial: { m2: [1500, 12000], precioM2: 110 },
  bodega: { m2: [300, 3000], precioM2: 120 },
  local: { m2: [40, 250], precioM2: 400 },
  terreno: { m2: [1000, 20000], precioM2: 40 },
  coworking: { m2: [10, 80], precioM2: 600 },
};

// Banco de mensajes: apertura + núcleo por sector + cierre (14 núcleos por sector, 84 en total), para que el feed
// no repita frases a simple vista. {m2}, {zona} y {presupuesto} solo se usan si el lead declaró esa señal.
const APERTURAS = ["", "", "Hola, ", "Buen día, ", "Buenas tardes, ", "Qué tal, ", "Hola, los contacto por el anuncio. ", "Saludos. ", "Hola, buenas noches. "];
const CIERRES = ["", "", "", " Gracias.", " Quedo pendiente.", " ¿Me pueden llamar?", " Saludos.", " Gracias por la información."];

const MENSAJES: Record<Sector, readonly string[]> = {
  oficina: [
    "Busco oficina de unos {m2} m² en {zona}. ¿Qué opciones tienen?",
    "¿La oficina sigue disponible? Nos urge mudarnos este mes.",
    "Somos un equipo de 25 personas y buscamos algo en {zona}.",
    "¿Cuánto es el mantenimiento mensual de la oficina?",
    "Mi presupuesto es de {presupuesto} al mes, ¿hay algo en {zona}?",
    "¿Se puede agendar visita esta semana?",
    "¿Aceptan contrato a 2 años con opción a renovar?",
    "¿La oficina se entrega acondicionada o en obra gris?",
    "¿Cuántos cajones de estacionamiento incluye?",
    "Necesitamos mudarnos antes de fin de mes, ¿qué tienen listo?",
    "¿El edificio tiene certificación LEED?",
    "Me interesa la de {m2} m², ¿el precio es negociable?",
    "¿Se puede dividir el piso en dos oficinas?",
    "Estamos comparando opciones en {zona}, ¿me mandan la ficha técnica?",
  ],
  industrial: [
    "Necesito una nave de {m2} m² cerca de {zona}, con andén.",
    "¿Cuál es la altura libre de la nave?",
    "¿La nave cuenta con subestación eléctrica?",
    "Buscamos nave para operación logística, entrada inmediata.",
    "Presupuesto de {presupuesto} mensuales, ¿qué tienen en {zona}?",
    "¿El parque industrial tiene seguridad las 24 horas?",
    "¿Puedo visitar la nave el jueves?",
    "¿Cuántos andenes tiene y de qué tipo son?",
    "¿El piso soporta racks de carga pesada?",
    "Buscamos algo con patio de maniobras amplio en {zona}.",
    "¿Tiene permisos para manufactura ligera?",
    "¿Cuál es la resistencia del piso por metro cuadrado?",
    "Necesitamos {m2} m² para centro de distribución.",
    "¿Qué tan lejos queda de la autopista?",
  ],
  bodega: [
    "Busco bodega de {m2} m² en {zona}.",
    "¿La bodega tiene acceso para tráiler?",
    "Necesito bodega para inventario, ¿tienen algo disponible ya?",
    "¿Cuál es el plazo mínimo de renta?",
    "Tengo {presupuesto} al mes para la bodega.",
    "¿La bodega tiene oficina incluida?",
    "¿Me pueden mandar más fotos de la bodega?",
    "¿Se puede rentar solo por seis meses?",
    "¿Tiene cortina eléctrica y rampa?",
    "¿Hay vigilancia en la zona de {zona}?",
    "Necesito espacio para almacenar mercancía de temporada.",
    "¿Incluye baño y medio de servicio?",
    "¿Cuánto piden de depósito?",
    "¿La bodega tiene mezzanine?",
  ],
  local: [
    "Busco local comercial de {m2} m² en {zona}.",
    "¿El local tiene uso de suelo para restaurante?",
    "¿Cuánto flujo peatonal tiene la zona?",
    "Queremos abrir sucursal en {zona} el próximo mes.",
    "¿El local se renta con cortina y baño?",
    "Mi presupuesto es de {presupuesto} mensuales.",
    "¿Puedo verlo este sábado?",
    "¿Tiene salida de humo para cocina?",
    "¿El local está en planta baja con vista a la calle?",
    "¿Permiten anuncio luminoso en fachada?",
    "Buscamos algo en esquina dentro de {zona}.",
    "¿Cuánto es la cuota de mantenimiento de la plaza?",
    "¿El local cuenta con estacionamiento para clientes?",
    "¿Hay periodo de gracia para adecuaciones?",
  ],
  terreno: [
    "Me interesa un terreno de {m2} m² en {zona}.",
    "¿El terreno tiene uso de suelo industrial?",
    "¿Está a la venta o solo en renta?",
    "¿Cuenta con servicios de agua y luz?",
    "Buscamos terreno para desarrollar, presupuesto de {presupuesto} al mes.",
    "¿Tiene escrituras en regla?",
    "¿Se puede visitar el terreno esta semana?",
    "¿El terreno es plano o tiene pendiente?",
    "¿Qué frente tiene hacia la avenida?",
    "¿Aceptan esquema de renta a largo plazo?",
    "¿Hay restricciones de construcción en {zona}?",
    "¿Tiene acceso para transporte pesado?",
    "Nos interesa para un patio de maniobras.",
    "¿Me comparten el plano topográfico?",
  ],
  coworking: [
    "Busco espacio para 6 personas en {zona}.",
    "¿Tienen pase diario o solo mensual?",
    "¿Incluye sala de juntas?",
    "Necesito oficina privada desde el lunes.",
    "Presupuesto de {presupuesto} al mes para el equipo.",
    "¿Puedo usar la dirección como domicilio fiscal?",
    "¿Me pueden dar un recorrido mañana?",
    "¿El internet es dedicado o compartido?",
    "Somos tres personas, ¿tienen escritorios fijos?",
    "¿Hay acceso las 24 horas?",
    "¿Incluye café y área de cocina?",
    "¿Cuántas horas de sala de juntas vienen en el plan?",
    "Buscamos algo flexible en {zona} por tres meses.",
    "¿Tienen cabinas para llamadas?",
  ],
};

// ---------------------------------------------------------------------------
// Grupos de leads: cuántos hay en cada poza y qué tan seguido declaran cada señal

type Grupo = {
  fugaId?: string;
  cantidad: number;
  etapas?: Partial<Record<EtapaId, number>>; // solo leads activos: etapa actual ponderada
  prob: { urgencia: number; superficie: number; zona: number; presupuesto: number };
  mensajes: [number, number];
};

const GRUPOS: Grupo[] = [
  { fugaId: "fantasmas", cantidad: 150, prob: { urgencia: 0.35, superficie: 0.75, zona: 0.8, presupuesto: 0.55 }, mensajes: [3, 14] },
  { fugaId: "no-disponible", cantidad: 35, prob: { urgencia: 0.25, superficie: 0.6, zona: 0.7, presupuesto: 0.35 }, mensajes: [1, 3] },
  { fugaId: "sin-datos", cantidad: 45, prob: { urgencia: 0.15, superficie: 0.1, zona: 0.15, presupuesto: 0.05 }, mensajes: [1, 3] },
  { fugaId: "visita-cancelada", cantidad: 30, prob: { urgencia: 0.4, superficie: 0.9, zona: 0.9, presupuesto: 0.7 }, mensajes: [5, 16] },
  {
    cantidad: 140,
    etapas: { contacto: 25, calificacion: 25, asignacion: 25, visita: 15, cierre: 10 },
    prob: { urgencia: 0.3, superficie: 0.85, zona: 0.9, presupuesto: 0.65 },
    mensajes: [2, 16],
  },
];

// ---------------------------------------------------------------------------
// Helpers

const HORA_MS = 3_600_000;
const DIA_MS = 24 * HORA_MS;
const CORTE_MS = Date.parse(`${FECHA_CORTE}T00:00:00Z`);

function formatearMxn(monto: number): string {
  return `$${String(monto).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function telefonoEnmascarado(rng: Rng, estado: Estado): string {
  return `+52 ${LADA[estado]} ••••${String(entero(rng, 0, 9999)).padStart(4, "0")}`;
}

/** Score de intención (0–100) derivado de las señales y la actividad. */
function calcularScore(rng: Rng, s: SenalesLead, urgencia: boolean, mensajes: number, espacios: number): number {
  const puntos =
    15 +
    (urgencia ? 20 : 0) +
    (s.superficieM2 !== null ? 10 : 0) +
    (s.zona !== null ? 10 : 0) +
    (s.presupuestoMxn !== null ? 15 : 0) +
    Math.min(15, mensajes * 1.5) +
    Math.min(10, espacios * 2) +
    uniforme(rng, -6, 6);
  return Math.max(0, Math.min(100, Math.round(puntos)));
}

function elegirMensaje(rng: Rng, sector: Sector, s: SenalesLead): string {
  const posibles = MENSAJES[sector].filter(
    (m) =>
      (!m.includes("{m2}") || s.superficieM2 !== null) &&
      (!m.includes("{zona}") || s.zona !== null) &&
      (!m.includes("{presupuesto}") || s.presupuestoMxn !== null),
  );
  const nucleo = elegir(rng, posibles)
    .replace("{m2}", String(s.superficieM2))
    .replace("{zona}", String(s.zona))
    .replace("{presupuesto}", formatearMxn(s.presupuestoMxn ?? 0));
  const apertura = elegir(rng, APERTURAS);
  // Tras una apertura con coma, la frase sigue en minúscula (respetando ¿ inicial).
  const cuerpo = apertura.endsWith(", ") ? nucleo.replace(/^(¿?)(\p{Lu})/u, (_, signo, letra) => signo + letra.toLowerCase()) : nucleo;
  return `${apertura}${cuerpo}${elegir(rng, CIERRES)}`;
}

/** n instantes ordenados entre inicio y fin, con el primero en inicio y el último en fin. */
function instantes(rng: Rng, inicio: number, fin: number, n: number): number[] {
  if (n === 1) return [fin];
  const medios = Array.from({ length: n - 2 }, () => inicio + Math.round((rng() * (fin - inicio)) / 60_000) * 60_000).sort(
    (a, b) => a - b,
  );
  return [inicio, ...medios, fin];
}

// ---------------------------------------------------------------------------

export function generarLeads(rng: Rng, fugas: readonly Fuga[]): Lead[] {
  const leads: Lead[] = [];

  for (const grupo of GRUPOS) {
    const fuga = grupo.fugaId ? fugas.find((f) => f.id === grupo.fugaId)! : undefined;

    for (let i = 0; i < grupo.cantidad; i++) {
      const canal = elegirPonderado(rng, PESO_CANAL);
      const sector = elegirPonderado(rng, PESO_SECTOR);
      const estado = elegirPonderado(rng, PESO_ESTADO);
      const etapaActual = fuga ? fuga.desde : elegirPonderado(rng, grupo.etapas as Record<EtapaId, number>);

      const { m2, precioM2 } = ESPACIO[sector];
      const superficie = bernoulli(rng, grupo.prob.superficie) ? Math.round(entero(rng, m2[0], m2[1]) / 10) * 10 || 10 : null;
      const zona = bernoulli(rng, grupo.prob.zona) ? elegir(rng, ZONAS[estado]) : null;
      const presupuesto = bernoulli(rng, grupo.prob.presupuesto)
        ? Math.round(((superficie ?? (m2[0] + m2[1]) / 2) * precioM2) / 1000) * 1000
        : null;
      const senales: SenalesLead = { superficieM2: superficie, zona, presupuestoMxn: presupuesto };
      const urgencia = bernoulli(rng, grupo.prob.urgencia);
      const mensajes = entero(rng, grupo.mensajes[0], grupo.mensajes[1]);
      const espaciosVistos = entero(rng, 1, 8);
      const score = calcularScore(rng, senales, urgencia, mensajes, espaciosVistos);

      // Antigüedad: un tercio de los fantasmas cae dentro de la ventana crítica de 3 días.
      const dias =
        grupo.fugaId === "fantasmas" && bernoulli(rng, 0.35) ? entero(rng, 0, 2) : entero(rng, 0, grupo.fugaId ? 60 : 30);
      const ultima = CORTE_MS - dias * DIA_MS + entero(rng, 8, 20) * HORA_MS + entero(rng, 0, 59) * 60_000;
      const creado = ultima - entero(rng, 1, 21) * DIA_MS - entero(rng, 0, 12) * HORA_MS;

      const nombreCanal = CANALES.find((c) => c.id === canal)!.nombre;
      const nombreSector = SECTORES.find((s) => s.id === sector)!.nombre.toLowerCase();
      const alcanzadas = ORDEN_ETAPAS.slice(0, ORDEN_ETAPAS.indexOf(etapaActual) + 1);
      const eventos: Omit<Touchpoint, "fecha">[] = [];
      for (const etapa of alcanzadas) {
        if (etapa === "descubrimiento") eventos.push({ tipo: "sesion", detalle: `Llegó por ${nombreCanal}` });
        if (etapa === "exploracion") eventos.push({ tipo: "busqueda", detalle: `Buscó ${nombreSector} en ${zona ?? estado}` });
        if (etapa === "evaluacion") {
          for (let k = 0; k < Math.min(espaciosVistos, 3); k++) {
            eventos.push({ tipo: "ficha", detalle: `Vio la ficha ${sector.slice(0, 3).toUpperCase()}-${entero(rng, 100, 999)}` });
          }
          if (fuga?.id === "no-disponible") {
            eventos.push({ tipo: "mensaje", detalle: "Preguntó por un espacio que ya no está disponible" });
          }
        }
        if (etapa === "contacto") {
          eventos.push({ tipo: "contacto", detalle: elegir(rng, ["Formulario", "WhatsApp", "WhatsApp", "Llamada"]) });
          eventos.push({ tipo: "mensajes", detalle: `${mensajes} mensajes en la conversación` });
        }
        if (etapa === "calificacion") eventos.push({ tipo: "calificacion", detalle: `Score de intención ${score}` });
        if (etapa === "asignacion") {
          eventos.push({ tipo: "asignacion", detalle: `Asignado a Broker demo ${String(entero(rng, 1, 24)).padStart(2, "0")}` });
        }
        if (etapa === "visita") eventos.push({ tipo: "visita_agendada", detalle: "Visita agendada" });
        if (etapa === "cierre") eventos.push({ tipo: "cierre", detalle: "LOI firmada" });
      }
      // Los activos en Visita quedan con la visita agendada; los que cerraron la hicieron.
      if (etapaActual === "cierre" || fuga?.id === "visita-cancelada") {
        const indice = eventos.findIndex((e) => e.tipo === "visita_agendada") + 1;
        eventos.splice(
          indice,
          0,
          fuga?.id === "visita-cancelada"
            ? { tipo: "visita_cancelada", detalle: "Cancelada: el espacio ya no estaba disponible" }
            : { tipo: "visita_realizada", detalle: "Visita realizada" },
        );
      }
      const fechas = instantes(rng, creado, ultima, eventos.length);

      leads.push({
        id: `L-${String(leads.length + 1).padStart(4, "0")}`,
        nombre: `${elegir(rng, NOMBRES)} ${elegir(rng, [...INICIALES])}.`,
        telefono: telefonoEnmascarado(rng, estado),
        canal,
        sector,
        estado,
        etapaActual,
        ...(fuga ? { fugaId: fuga.id } : {}),
        score,
        urgencia,
        ultimoMensaje: elegirMensaje(rng, sector, senales),
        mensajes,
        espaciosVistos,
        creadoEl: new Date(creado).toISOString(),
        ultimaActividad: new Date(ultima).toISOString(),
        touchpoints: eventos.map((e, k) => ({ fecha: new Date(fechas[k]).toISOString(), ...e })),
        senales,
      });
    }
  }
  return leads;
}
