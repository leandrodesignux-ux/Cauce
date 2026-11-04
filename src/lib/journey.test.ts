import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORDEN_ETAPAS } from "../config/etapas";
import { formatearMxnCompacto, formatearPuntos } from "./formato";
import { csvJourney, experimentoDestacado, experimentosActivos, experimentosDelBoard, iniciales, pendientesDePoza, valorPorFase, type Journey, type PozaJourney } from "./journey";
import type { EtapaId, Experimento } from "./tipos";

const poza = (id: string, desde: EtapaId, valor: number): PozaJourney => ({ id, desde: ORDEN_ETAPAS.indexOf(desde), volumen: 1, valor, nombre: id, causa: id });

describe("valorPorFase", () => {
  it("agrupa el valor por la fase de la etapa de origen y calcula la proporción", () => {
    const r = valorPorFase([poza("a", "exploracion", 600), poza("b", "calificacion", 300), poza("c", "visita", 100)]);
    assert.deepEqual(
      r.map((f) => [f.fase, f.valor, f.proporcion]),
      [
        ["atraer", 600, 0.6],
        ["convertir", 300, 0.3],
        ["cerrar", 100, 0.1],
      ],
    );
  });

  it("sin valor en riesgo, todas las proporciones son 0", () => {
    assert.ok(valorPorFase([poza("a", "exploracion", 0)]).every((f) => f.proporcion === 0));
  });
});

describe("experimentos del board", () => {
  const exp = (id: string, estado: Experimento["estado"], despliegue: string) => ({ id, estado, despliegue }) as Experimento;
  const lista = [
    exp("viejo-leyendo", "leyendo", "2026-06-01"),
    exp("nuevo-leyendo", "leyendo", "2026-08-24"),
    exp("curso", "en_curso", "2026-10-05"),
    exp("validado", "validado", "2026-07-06"),
    exp("diseno", "diseno", "2026-12-07"),
    exp("refutado", "refutado", "2026-05-01"),
    exp("curso-viejo", "en_curso", "2026-09-01"),
  ];

  it("el destacado es el más reciente en lectura", () => {
    assert.equal(experimentoDestacado(lista), "nuevo-leyendo");
    assert.equal(experimentoDestacado([exp("x", "en_curso", "2026-01-05")]), null);
  });

  it("cuenta como activos los en curso y los que están en lectura", () => {
    assert.equal(experimentosActivos(lista), 4);
  });

  it("ordena por estado y recencia y recorta a 6", () => {
    assert.deepEqual(
      experimentosDelBoard(lista).map((e) => e.id),
      ["nuevo-leyendo", "viejo-leyendo", "curso", "curso-viejo", "validado", "diseno"],
    );
  });
});

describe("pendientesDePoza", () => {
  const leads = [
    { id: "1", score: 50, fugaId: "fantasmas", ultimaActividad: "2026-10-01" },
    { id: "2", score: 90, fugaId: "fantasmas", ultimaActividad: "2026-10-01" },
    { id: "3", score: 90, fugaId: "fantasmas", ultimaActividad: "2026-10-20" },
    { id: "4", score: 99, fugaId: "sin-datos", ultimaActividad: "2026-10-20" },
    { id: "5", score: 95, fugaId: "fantasmas", ultimaActividad: "2026-10-20" },
  ];
  it("filtra la poza, saca los tratados y ordena por score (y el más reciente a igual score)", () => {
    assert.deepEqual(
      pendientesDePoza(leads, "fantasmas", (id) => id === "5").map((l) => l.id),
      ["3", "2", "1"],
    );
  });
});

describe("formatos del board", () => {
  it("iniciales de nombre y apellido", () => {
    assert.equal(iniciales("José Luis P."), "JP");
    assert.equal(iniciales("Ana"), "A");
  });
  it("puntos en texto corrido", () => {
    assert.equal(formatearPuntos(1.5), "+1.5 puntos");
  });
  it("montos compactos", () => {
    assert.equal(formatearMxnCompacto(2_310_000), "$2.31 M");
    assert.equal(formatearMxnCompacto(351_616), "$352 K");
    assert.equal(formatearMxnCompacto(950), "$950");
  });
  it("el CSV escapa comas y lleva etapas y pozas", () => {
    const journey: Journey = {
      etapas: ORDEN_ETAPAS.map((id) => ({ id, volumen: 10, anterior: 8, tasa: 0.5, deltaPp: 1 })),
      tasas: [],
      deltas: [],
      pozas: [{ ...poza("x", "visita", 1000), causa: "Cancelada, sin aviso" }],
      valorEnRiesgo: 1000,
    };
    const nombres = Object.fromEntries(ORDEN_ETAPAS.map((id) => [id, id])) as Record<EtapaId, string>;
    const csv = csvJourney(journey, nombres);
    assert.match(csv, /^Etapa,Volumen/);
    assert.match(csv, /"Cancelada, sin aviso",visita,1,1000/);
  });
});
