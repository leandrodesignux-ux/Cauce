/**
 * Copia en hex de los tokens de color de src/styles/tokens.css (modo claro), para contextos que no
 * leen variables CSS: imágenes Open Graph (Satori) y theme-color. Si cambia un token, cambiarlo aquí también.
 */
export const COLOR = {
  fondoA: "#E4E8EF",
  fondoB: "#D3DAE7",
  fondoC: "#C9D1E2",
  tarjeta: "#F8F9FB",
  tinta: "#111318",
  tinta2: "#4B5160",
  azul: "#7E95DA",
  azulRelleno: "#3D5BC0",
  coral: "#E26A61",
  coralRelleno: "#C2453C",
  coralSuave: "#F7E2DF",
  linea: "#DDE2EA",
  fondoOscuro: "#171B24",
} as const;
