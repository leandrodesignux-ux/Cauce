/** Nombre corto de cada fuga (los ids siguen siendo los de los datos; en la UI se llaman "fugas"). */
export const NOMBRE_CORTO_POZA: Record<string, string> = {
  "rebote-browse": "Rebote en Browse Pages",
  "no-disponible": "Espacio no disponible",
  "friccion-contacto": "Fricción en contacto",
  "sin-datos": "Sin datos mínimos",
  fantasmas: "Leads sin atender",
  "visita-cancelada": "Visita cancelada",
};

/** Causa visible cuando el texto de los datos usa vocabulario interno ("Fantasmas"). */
const CAUSA_VISIBLE: Record<string, string> = {
  fantasmas: "Leads sin atender: conversaciones con intención que nunca llegaron a un broker",
};

export function causaVisible(fuga: { id: string; causa: string }): string {
  return CAUSA_VISIBLE[fuga.id] ?? fuga.causa;
}
