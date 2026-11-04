import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { leerPagina, numerosDePagina, paginar } from "./paginacion";

describe("paginación del feed", () => {
  it("lee la página de la URL con fallback a 1", () => {
    assert.equal(leerPagina("3"), 3);
    assert.equal(leerPagina(null), 1);
    assert.equal(leerPagina("0"), 1);
    assert.equal(leerPagina("abc"), 1);
    assert.equal(leerPagina("2.5"), 1);
  });

  it("acota la página y calcula el rango de 10 en 10", () => {
    assert.deepEqual(paginar(23, 2), { pagina: 2, paginas: 3, desde: 10, hasta: 20 });
    assert.deepEqual(paginar(23, 9), { pagina: 3, paginas: 3, desde: 20, hasta: 23 });
    // Si una acción vacía la última página, queda la anterior.
    assert.equal(paginar(20, 3).pagina, 2);
    assert.deepEqual(paginar(0, 1), { pagina: 1, paginas: 1, desde: 0, hasta: 0 });
  });

  it("muestra primera, última y vecinas, con saltos", () => {
    assert.deepEqual(numerosDePagina(1, 3), [1, 2, 3]);
    assert.deepEqual(numerosDePagina(5, 10), [1, "…", 4, 5, 6, "…", 10]);
    assert.deepEqual(numerosDePagina(1, 1), [1]);
  });
});
