import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORDEN_ETAPAS } from "../config/etapas";
import { type DatosDemo, avanzar, estadoInicial } from "./demoVivo";
import type { EtapaId, SemanaEtapa } from "./tipos";

// Datos chicos con la forma real: dos semanas, tres combinaciones y un embudo decreciente.
function fila(semana: string, canal: SemanaEtapa["canal"], sector: SemanaEtapa["sector"], estado: SemanaEtapa["estado"], escala: number): SemanaEtapa {
  const base = [1000, 620, 240, 17, 12, 8, 3, 1];
  return { semana, canal, sector, estado, volumen: Object.fromEntries(ORDEN_ETAPAS.map((id, i) => [id, base[i] * escala])) as Record<EtapaId, number> };
}

const DATOS: DatosDemo = {
  semanas: ["2026-10-19", "2026-10-26"],
  flujo: [
    fila("2026-10-19", "seo", "oficina", "CDMX", 3),
    fila("2026-10-26", "seo", "oficina", "CDMX", 3),
    fila("2026-10-26", "paid", "industrial", "Jalisco", 2),
    fila("2026-10-26", "directo", "local", "Nuevo León", 1),
  ],
  leads: [
    { id: "L-1", nombre: "Ana R.", sector: "oficina", estado: "CDMX", score: 70, ultimaActividad: "2026-10-30T00:00:00Z" },
    { id: "L-2", nombre: "Luis M.", sector: "industrial", estado: "Jalisco", score: 50, ultimaActividad: "2026-10-30T00:00:00Z" },
  ],
  experimentos: [
    {
      id: "x",
      nombre: "X",
      palanca: "P",
      transicion: { desde: "exploracion", hacia: "evaluacion" },
      hipotesis: "",
      metrica: "",
      prediccionPp: 2,
      despliegue: "2026-10-12",
      ventanaSemanas: [2, 4],
      estado: "en_curso",
    },
  ],
  banco: { mensajes: ["Busco oficina."], zonas: ["Centro"], telefonos: { CDMX: "+52 55" } },
};

function correr(ticks: number) {
  const estados = [estadoInicial()];
  for (let i = 0; i < ticks; i++) estados.push(avanzar(estados[estados.length - 1], DATOS, 1000 + i));
  return estados;
}

const totales = (filas: readonly SemanaEtapa[]) => Object.fromEntries(ORDEN_ETAPAS.map((id) => [id, filas.reduce((s, f) => s + f.volumen[id], 0)])) as Record<EtapaId, number>;

describe("demo en vivo", () => {
  it("es determinista con la misma semilla", () => {
    assert.deepEqual(correr(40).at(-1), correr(40).at(-1));
  });

  it("ningún volumen baja de un tick al siguiente", () => {
    const estados = correr(60);
    for (let i = 1; i < estados.length; i++) {
      const antes = totales(estados[i - 1].filasExtra);
      const ahora = totales(estados[i].filasExtra);
      for (const id of ORDEN_ETAPAS) assert.ok(ahora[id] >= antes[id], `${id} bajó en el tick ${i}`);
    }
  });

  it("el embudo nunca crece hacia abajo", () => {
    for (const e of correr(60))
      for (const f of e.filasExtra)
        for (let k = 1; k < ORDEN_ETAPAS.length; k++) assert.ok(f.volumen[ORDEN_ETAPAS[k]] <= f.volumen[ORDEN_ETAPAS[k - 1]], `${ORDEN_ETAPAS[k]} > ${ORDEN_ETAPAS[k - 1]}`);
  });

  it("acota eventos, serie y semanas de experimentos, y numera los leads simulados", () => {
    const fin = correr(120).at(-1)!;
    assert.ok(fin.eventos.length <= 20);
    assert.ok(fin.serieSesiones.length <= 60);
    assert.ok((fin.puntosExperimento.x ?? []).length <= 8);
    fin.leadsExtra.forEach((l, i) => {
      assert.equal(l.id, `SIM-${String(i + 1).padStart(4, "0")}`);
      assert.equal(l.fugaId, "fantasmas");
    });
  });
});
