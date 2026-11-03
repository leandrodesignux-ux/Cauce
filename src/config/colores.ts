/**
 * Copia en hex de los tokens de color de src/styles/tokens.css (modo claro), para contextos que no
 * leen variables CSS: imágenes Open Graph (Satori) y theme-color. Si cambia un token, cambiarlo aquí también.
 */
export const COLOR = {
  concreto: "#E9EBE8",
  papel: "#F7F8F6",
  tinta: "#142019",
  niebla: "#5A6862",
  cauce: "#2E6B52",
  laton: "#A9822F",
  oxido: "#B4472F",
  oxidoSuave: "#F0DDD7",
  linea: "#D3D8D4",
  concretoOscuro: "#18211D",
} as const;
