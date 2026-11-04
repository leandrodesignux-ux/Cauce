// Modelo de datos. Fuente: docs/DATA.md. Los campos que no están en DATA.md se marcan como extensión.

export type Canal = "seo" | "paid" | "directo" | "referidos" | "social";
export type Sector = "oficina" | "industrial" | "bodega" | "local" | "terreno" | "coworking";
export type Estado = "CDMX" | "Edomex" | "Nuevo León" | "Jalisco" | "Querétaro" | "Puebla" | "Yucatán";
export type EtapaId =
  | "descubrimiento"
  | "exploracion"
  | "evaluacion"
  | "contacto"
  | "calificacion"
  | "asignacion"
  | "visita"
  | "cierre";

export type Transicion = { desde: EtapaId; hacia: EtapaId };

export type SemanaEtapa = {
  semana: string; // ISO del lunes
  canal: Canal;
  sector: Sector;
  estado: Estado;
  volumen: Record<EtapaId, number>;
};

export type Fuga = {
  id: string;
  desde: EtapaId;
  hacia: EtapaId;
  causa: string;
  experimentoId?: string;
  /** Extensión: fracción de la caída de la transición que se atribuye a esta fuga (0–1). */
  proporcionCaida: number;
};

/** Extensión: señales que explican el score de intención (se muestran en /leads/[id]). */
export type SenalesLead = {
  superficieM2: number | null;
  zona: string | null;
  presupuestoUsd: number | null;
};

export type Touchpoint = { fecha: string; tipo: string; detalle: string };

export type Lead = {
  id: string;
  nombre: string;
  telefono: string;
  canal: Canal;
  sector: Sector;
  estado: Estado;
  etapaActual: EtapaId;
  fugaId?: string;
  score: number;
  urgencia: boolean;
  ultimoMensaje: string;
  mensajes: number;
  espaciosVistos: number;
  creadoEl: string;
  ultimaActividad: string;
  touchpoints: Touchpoint[];
  senales: SenalesLead;
};

export type EstadoExperimento = "diseno" | "en_curso" | "leyendo" | "validado" | "refutado";

export type Experimento = {
  id: string;
  nombre: string;
  palanca: string;
  transicion: Transicion;
  hipotesis: string;
  metrica: string;
  prediccionPp: number;
  observadoPp?: number;
  despliegue: string;
  ventanaSemanas: [number, number];
  estado: EstadoExperimento;
};
