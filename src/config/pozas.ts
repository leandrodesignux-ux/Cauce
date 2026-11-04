/** Nombre corto de cada fuga (los ids siguen siendo los de los datos; en la UI se llaman "fugas"). Sin jerga de marketplace. */
export const NOMBRE_CORTO_POZA: Record<string, string> = {
  "rebote-browse": "Abandono en el listado",
  "no-disponible": "Oferta no disponible",
  "friccion-contacto": "Dificultad para contactar",
  "sin-datos": "Conversación incompleta",
  fantasmas: "Leads sin atender",
  "visita-cancelada": "Visita cancelada",
};

/** Causa visible de cada fuga (el texto de los datos usa vocabulario interno). */
const CAUSA_VISIBLE: Record<string, string> = {
  "rebote-browse": "Salen de la página de resultados sin interactuar",
  "no-disponible": "Lo que buscaban ya no estaba disponible",
  "friccion-contacto": "El formulario de contacto frena el paso",
  "sin-datos": "La conversación terminó sin los datos para calificar",
  fantasmas: "Conversaciones con intención que nadie atendió",
  "visita-cancelada": "Se canceló porque no se confirmó la disponibilidad",
};

export function causaVisible(fuga: { id: string; causa: string }): string {
  return CAUSA_VISIBLE[fuga.id] ?? fuga.causa;
}
