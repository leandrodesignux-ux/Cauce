import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PARAMETROS_PERDIDA_INICIALES as P } from "../config/modelo";
import {
  avanceDeEtapa,
  modeloPerdida,
  observadoDeSerie,
  periodoAnterior,
  periodoDesdePreset,
  simularMejora,
  tasaDeFase,
  tasaTransicion,
  valorEnRiesgoPorPoza,
  volumenVacio,
} from "./selectors";

describe("modeloPerdida", () => {
  const iniciales = {
    fantasmas: P.fantasmas.valor,
    leadACita: P.leadACita.valor,
    citaAContrato: P.citaAContrato.valor,
    comisionUsd: P.comisionUsd.valor,
  };

  it("con los valores iniciales da 643 × 0.30 × 0.10 × 1,000 = $19,290 USD", () => {
    assert.equal(modeloPerdida(iniciales).montoUsd, 19_290);
  });

  it("expone los pasos intermedios de la fórmula", () => {
    const r = modeloPerdida(iniciales);
    assert.ok(Math.abs(r.citas - 192.9) < 1e-9);
    assert.ok(Math.abs(r.contratos - 19.29) < 1e-9);
  });

  it("es proporcional a cada parámetro", () => {
    assert.equal(modeloPerdida({ ...iniciales, fantasmas: 1286 }).montoUsd, 38_580);
    assert.equal(modeloPerdida({ ...iniciales, comisionUsd: 500 }).montoUsd, 9_645);
  });

  it("da cero sin fantasmas", () => {
    assert.equal(modeloPerdida({ ...iniciales, fantasmas: 0 }).montoUsd, 0);
  });
});

describe("períodos y tasas", () => {
  it("30d son 4 semanas y el anterior es el bloque previo", () => {
    const p = periodoDesdePreset("30d", "2026-10-26");
    assert.deepEqual(p, { desde: "2026-10-05", hasta: "2026-10-26" });
    assert.deepEqual(periodoAnterior(p), { desde: "2026-09-07", hasta: "2026-09-28" });
  });

  it("la tasa es null sin volumen de origen", () => {
    assert.equal(tasaTransicion(volumenVacio(), { desde: "visita", hacia: "cierre" }), null);
  });
});

describe("valorEnRiesgoPorPoza", () => {
  it("la poza de fantasmas muestra el mismo monto que el modelo de pérdida inicial", () => {
    const fuga = { id: "fantasmas", desde: "calificacion", hacia: "asignacion", causa: "", proporcionCaida: 0.75 } as const;
    const [poza] = valorEnRiesgoPorPoza([], [fuga], { periodo: periodoDesdePreset("30d", "2026-10-26") });
    assert.equal(poza.valorUsd, 19_290);
    assert.equal(poza.volumen, 643);
  });
});

describe("recorrido: fases, avance y simulador", () => {
  const v = { ...volumenVacio(), descubrimiento: 1000, exploracion: 600, evaluacion: 300, contacto: 120, calificacion: 100, asignacion: 80, visita: 40, cierre: 10 };
  const fases = [
    { etapas: ["descubrimiento", "exploracion", "evaluacion"] as const },
    { etapas: ["contacto", "calificacion", "asignacion"] as const },
    { etapas: ["visita", "cierre"] as const },
  ];

  it("la métrica de fase es la primera etapa de la siguiente sobre la primera de esta; en Cerrar, cierre / visita", () => {
    assert.equal(tasaDeFase(v, fases, 0), 0.12);
    assert.equal(tasaDeFase(v, fases, 1), 40 / 120);
    assert.equal(tasaDeFase(v, fases, 2), 0.25);
    assert.equal(tasaDeFase(volumenVacio(), fases, 0), null);
  });

  it("avance de etapa: avanzan los de la siguiente y se quedan el resto; nada en Cierre", () => {
    assert.deepEqual(avanceDeEtapa(v, "evaluacion"), { avanzan: 120, seQuedan: 180 });
    assert.equal(avanceDeEtapa(v, "cierre"), null);
  });

  it("simularMejora: volumen[desde] × puntos / 100 × probabilidad de cierre desde hacia × comisión", () => {
    const r = simularMejora(v, { desde: "evaluacion", hacia: "contacto" }, 2, 1_000);
    // 300 × 0.02 = 6 extra; desde Contacto: 100/120 × 80/100 × 40/80 × 10/40 = 1/12.
    assert.equal(r.extra, 6);
    assert.ok(Math.abs(r.probabilidad - 1 / 12) < 1e-12);
    assert.ok(Math.abs(r.cierres - 0.5) < 1e-12);
    assert.equal(r.usd, 500);
    // Visita → Cierre: llegar a Cierre ya es cerrar.
    assert.equal(simularMejora(v, { desde: "visita", hacia: "cierre" }, 10, 1_000).cierres, 4);
    assert.equal(simularMejora(v, { desde: "visita", hacia: "cierre" }, 0, 1_000).usd, 0);
  });
});

describe("observadoDeSerie", () => {
  // Despliegue el 2026-09-07; ventana de lectura semanas 2 a 3 (21 sep y 28 sep).
  const serie = [
    { semana: "2026-07-27", valor: 10 },
    { semana: "2026-08-03", valor: 10 },
    { semana: "2026-08-10", valor: 12 },
    { semana: "2026-08-17", valor: 10 },
    { semana: "2026-08-24", valor: 8 },
    { semana: "2026-08-31", valor: 10 },
    { semana: "2026-09-07", valor: 50 },
    { semana: "2026-09-14", valor: 50 },
    { semana: "2026-09-21", valor: 11 },
    { semana: "2026-09-28", valor: 13 },
  ];
  it("ventana de lectura menos las 6 semanas previas al despliegue", () => {
    // Previas: 27 jul – 31 ago (promedio 10); ventana: 21 y 28 sep (promedio 12).
    assert.equal(observadoDeSerie(serie, "2026-09-07", [2, 3]), 2);
  });
  it("null si la ventana todavía no tiene semanas", () => {
    assert.equal(observadoDeSerie(serie, "2026-09-07", [6, 8]), null);
  });
  it("ignora semanas sin dato", () => {
    const conHueco = serie.map((p) => (p.semana === "2026-09-28" ? { ...p, valor: null } : p));
    assert.equal(observadoDeSerie(conHueco, "2026-09-07", [2, 3]), 1);
  });
});
