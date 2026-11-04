import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FECHA_CORTE } from "../config/modelo";
import { distribucionLeads } from "./leads";
import { sumarDias } from "./selectors";

describe("distribucionLeads", () => {
  const hace = (dias: number) => `${sumarDias(FECHA_CORTE, -dias)}T12:00:00Z`;
  it("cuenta por banda de score y por antigüedad (≤3, 4–14, más de 14 días)", () => {
    const d = distribucionLeads([
      { score: 90, ultimaActividad: hace(0) },
      { score: 70, ultimaActividad: hace(3) },
      { score: 55, ultimaActividad: hace(4) },
      { score: 10, ultimaActividad: hace(20) },
    ]);
    assert.deepEqual(d.banda, { alto: 2, medio: 1, bajo: 1 });
    assert.deepEqual(d.antiguedad, { critica: 2, reciente: 1, antigua: 1 });
  });
});
