import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PARAMETROS_PERDIDA_INICIALES as P } from "../config/modelo";
import { modeloPerdida, periodoAnterior, periodoDesdePreset, tasaTransicion, volumenVacio } from "./selectors";

describe("modeloPerdida", () => {
  const iniciales = {
    fantasmas: P.fantasmas.valor,
    leadACita: P.leadACita.valor,
    citaAContrato: P.citaAContrato.valor,
    comisionMxn: P.comisionMxn.valor,
  };

  it("con los valores iniciales da 643 × 0.30 × 0.10 × 18,000 = $347,220 MXN", () => {
    assert.equal(modeloPerdida(iniciales).montoMxn, 347_220);
  });

  it("expone los pasos intermedios de la fórmula", () => {
    const r = modeloPerdida(iniciales);
    assert.ok(Math.abs(r.citas - 192.9) < 1e-9);
    assert.ok(Math.abs(r.contratos - 19.29) < 1e-9);
  });

  it("es proporcional a cada parámetro", () => {
    assert.equal(modeloPerdida({ ...iniciales, fantasmas: 1286 }).montoMxn, 694_440);
    assert.equal(modeloPerdida({ ...iniciales, comisionMxn: 9_000 }).montoMxn, 173_610);
  });

  it("da cero sin fantasmas", () => {
    assert.equal(modeloPerdida({ ...iniciales, fantasmas: 0 }).montoMxn, 0);
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
