import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // AGENTS.md ya incluye la regla de leer node_modules/next/dist/docs; evita que next dev lo reescriba.
  agentRules: false,
  cacheComponents: true,
  partialPrefetching: true,
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
