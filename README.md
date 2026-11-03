# Cauce

Dashboard interactivo del journey de adquisición: de la primera visita al contrato, con las fugas a la vista y los experimentos que las atacan.

Prototipo con datos demo. Construido con Next.js + TypeScript + Tailwind, desplegado en Vercel.

## Correr local

```bash
npm install
npm run seed   # regenera src/data/*.json con la seed fija (genera datos desde la Fase 1)
npm run dev
```

## Deploy

1. Repo en GitHub (`cauce`), rama `main` protegida.
2. Vercel → Add New Project → importar el repo. Framework: Next.js. Sin variables de entorno.
3. Cada PR genera un preview deploy; `main` es producción.

## Docs

- `AGENTS.md` — reglas para el agente (Codex las lee automáticamente).
- `docs/PRODUCT.md` · `docs/DESIGN.md` · `docs/DATA.md` · `docs/PROMPTS.md`
