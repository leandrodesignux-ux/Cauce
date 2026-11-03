import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AGENTS.md ya incluye la regla de leer node_modules/next/dist/docs; evita que next dev lo reescriba.
  agentRules: false,
  // El indicador de desarrollo tapa la barra inferior móvil.
  devIndicators: false,
  // Sin Cache Components: los datos son JSON estáticos y los filtros se resuelven en el cliente.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
