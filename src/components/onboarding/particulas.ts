// Motor de partículas del onboarding (canvas 2D, sin React). Estado en typed arrays: sin objetos por partícula.
// Un solo requestAnimationFrame, detenido con pausa, pestaña oculta o al destruir.

export type DatosParticulas = {
  /** Cadenas ya formateadas que forman las partículas. */
  llegaron: string;
  firmaron: string;
  riesgo: string;
  contratos: string;
  /** Valores de las pozas (> 0), en el orden en que se muestran sus etiquetas. */
  pozas: readonly number[];
  /** Fracción del coral que vuelve en el acto 3 (0.2–0.45). */
  fraccionRetorno: number;
};

export type Caja = { x: number; y: number; w: number; h: number };
export type PozaPos = { cx: number; base: number; ancho: number; alto: number };

/** Eventos de la coreografía, para las etiquetas HTML (posiciones en px CSS del contenedor). */
export type Evento =
  | { tipo: "cifra"; acto: number; clave: "sesiones" | "cierres" | "riesgo" | "contratos"; caja: Caja }
  | { tipo: "ocultarCifra" }
  | { tipo: "pozas"; pozas: PozaPos[] }
  | { tipo: "ocultarPozas" }
  | { tipo: "chip"; caja: Caja };

export type Motor = {
  irA: (acto: number, opciones?: { instantaneo?: boolean }) => void;
  pausar: (pausado: boolean) => void;
  explosion: () => void;
  destruir: () => void;
};

type Colores = [string, string, string]; // azul, coral, tenue
const AZUL = 0;
const CORAL = 1;
const TENUE = 2;

const AMORTIGUACION = 0.86;
const RUIDO = 0.4;
const ALFA_PASO = 0.08;
const FRAME = 1000 / 60;

/** Cantidad de partículas según ancho y CPU. */
export function cantidadParticulas(ancho: number): number {
  if (typeof navigator !== "undefined" && (navigator.hardwareConcurrency ?? 8) <= 4) return 600;
  return ancho < 768 ? 1000 : 2400;
}

/** PRNG con semilla (mulberry32): mismas posiciones en cada apertura. */
function prng(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Muestreo = { puntos: Float32Array; caja: Caja };

export function crearMotor(
  canvas: HTMLCanvasElement,
  { n, colores, reducir, datos, alEvento }: { n: number; colores: Colores; reducir: boolean; datos: DatosParticulas; alEvento: (e: Evento) => void },
): Motor {
  const ctx = canvas.getContext("2d");
  const azar = prng(11);
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const vx = new Float32Array(n);
  const vy = new Float32Array(n);
  const tx = new Float32Array(n);
  const ty = new Float32Array(n);
  const alpha = new Float32Array(n);
  const talpha = new Float32Array(n);
  const color = new Uint8Array(n);
  const k = new Float32Array(n); // rigidez del resorte; 0 = libre (balístico)
  const fase = new Float32Array(n);
  for (let i = 0; i < n; i++) fase[i] = azar() * Math.PI * 2;

  // Grupos: S (las que firman, 3 % y mín. 80), R (el resto) y F (la fracción de R que vuelve en el acto 3).
  const nS = Math.min(n, Math.max(80, Math.round(n * 0.03)));
  const S = Uint32Array.from({ length: nS }, (_, i) => i);
  const R = Uint32Array.from({ length: n - nS }, (_, i) => i + nS);
  const nF = Math.round(R.length * datos.fraccionRetorno);
  const F = R.subarray(0, nF);
  const Rresto = R.subarray(nF);
  const todas = Uint32Array.from({ length: n }, (_, i) => i);

  let W = 0;
  let H = 0;
  let dpr = 1;
  let gravedad = 0;
  let reloj = 0; // ms del acto en curso (solo avanza sin pausa)
  let acto = 0;
  let pasos: { en: number; hacer: () => void; hecho: boolean }[] = [];
  let pausado = false;
  let oculto = typeof document !== "undefined" && document.hidden;
  let raf = 0;
  let ultimo = 0;
  let destruido = false;
  /** Formaciones activas, por grupo: se vuelven a aplicar al redimensionar. */
  const activas = new Map<string, () => void>();
  const cache = new Map<string, Muestreo>();
  const familia = getComputedStyle(canvas).fontFamily || "sans-serif";

  // ——— Geometría ———
  const movil = () => W < 768;
  const zona = (): Caja => {
    const h = H * (movil() ? 0.55 : 0.6);
    return { x: 0, y: 0, w: W, h };
  };
  /** Caja de una cifra: máx. 72 % del ancho (86 % en móvil) y 34 % del alto; con pocas partículas, más chica para que no quede rala. */
  const cajaTexto = (cuantas = n): Caja => {
    const z = zona();
    const escala = Math.min(1, Math.max(0.4, Math.sqrt(cuantas / n) * 1.15));
    const w = W * (movil() ? 0.86 : 0.72) * escala;
    const h = Math.min(H * 0.34, z.h * 0.62) * escala;
    return { x: (W - w) / 2, y: z.y + z.h * 0.52 - h / 2, w, h };
  };

  // ——— Formaciones ———
  /** Registra la formación de un grupo (se reaplica al redimensionar, con `primera` en false) y la aplica. */
  function fijar(grupo: string, aplicar: (primera: boolean) => void) {
    for (const g of activas.keys()) if (g === grupo || (grupo === "todas" && g !== "todas")) activas.delete(g);
    activas.set(grupo, () => aplicar(false));
    aplicar(true);
  }

  function resorte(idx: Uint32Array, rigidez: number) {
    for (const i of idx) k[i] = rigidez + (fase[i] / (Math.PI * 2)) * 0.03; // 0.06–0.09
  }

  function apariencia(idx: Uint32Array, c: number, a: number) {
    for (const i of idx) {
      color[i] = c;
      talpha[i] = a;
    }
  }

  /** Banda amplia y difusa que entra desde la izquierda. */
  function enjambre(idx: Uint32Array, desdeIzquierda: boolean) {
    const r = prng(3);
    if (desdeIzquierda)
      for (const i of idx) {
        x[i] = -r() * W * 0.6 - 10;
        y[i] = zona().h * (0.3 + r() * 0.45);
        vx[i] = vy[i] = 0;
        alpha[i] = 0;
      }
    fijar("todas", () => {
      const z = zona();
      const rr = prng(5);
      for (const i of idx) {
        const g = (rr() + rr() + rr() - 1.5) / 1.5; // ~gaussiana
        tx[i] = W * (0.06 + rr() * 0.88);
        ty[i] = z.y + z.h * 0.52 + g * z.h * 0.22;
      }
      resorte(idx, 0.06);
    });
  }

  function muestrear(cadena: string, caja: Caja, objetivo: number): Muestreo {
    const clave = `${cadena}|${Math.round(caja.w)}x${Math.round(caja.h)}|${objetivo}`;
    const guardado = cache.get(clave);
    if (guardado) return { puntos: guardado.puntos, caja: { ...guardado.caja, x: guardado.caja.x + caja.x, y: guardado.caja.y + caja.y } };
    const w = Math.max(1, Math.round(caja.w));
    const h = Math.max(1, Math.round(caja.h));
    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const c = off.getContext("2d", { willReadFrequently: true })!;
    c.font = `700 100px ${familia}`;
    const m = c.measureText(cadena);
    const altoRef = (m.actualBoundingBoxAscent || 72) + (m.actualBoundingBoxDescent || 0);
    const tam = Math.max(8, Math.min((100 * w) / Math.max(1, m.width), (100 * h) / Math.max(1, altoRef)));
    c.font = `700 ${tam}px ${familia}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "#fff";
    c.fillText(cadena, w / 2, h / 2);
    const img = c.getImageData(0, 0, w, h).data;
    let llenos = 0;
    let x0 = w,
      x1 = 0,
      y0 = h,
      y1 = 0;
    for (let py = 0; py < h; py++)
      for (let px = 0; px < w; px++)
        if (img[(py * w + px) * 4 + 3] > 128) {
          llenos++;
          if (px < x0) x0 = px;
          if (px > x1) x1 = px;
          if (py < y0) y0 = py;
          if (py > y1) y1 = py;
        }
    // Paso adaptativo: ≈ objetivo puntos.
    let paso = Math.max(1, Math.sqrt(llenos / Math.max(1, objetivo)));
    let pts: number[] = [];
    for (let intento = 0; intento < 4; intento++) {
      pts = [];
      for (let py = y0; py <= y1; py += paso)
        for (let px = x0; px <= x1; px += paso) {
          const ix = Math.round(px);
          const iy = Math.round(py);
          if (img[(iy * w + ix) * 4 + 3] > 128) pts.push(px, py);
        }
      const cuantos = pts.length / 2;
      if (cuantos >= objetivo * 0.9 || paso <= 1) break;
      paso = Math.max(1, paso * Math.sqrt(cuantos / objetivo));
    }
    // Si sobran, se queda una de cada tanto (determinista).
    let puntos = Float32Array.from(pts);
    const cuantos = puntos.length / 2;
    if (cuantos > objetivo) {
      const sel = new Float32Array(objetivo * 2);
      for (let j = 0; j < objetivo; j++) {
        const s = Math.floor((j * cuantos) / objetivo);
        sel[j * 2] = puntos[s * 2];
        sel[j * 2 + 1] = puntos[s * 2 + 1];
      }
      puntos = sel;
    }
    const resultado = { puntos, caja: { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } };
    cache.set(clave, resultado);
    return { puntos, caja: { ...resultado.caja, x: x0 + caja.x, y: y0 + caja.y } };
  }

  /** Forma la cadena con el grupo; asigna por x para que el morph barra de izquierda a derecha. Devuelve la caja real. */
  function texto(grupo: string, idx: Uint32Array, cadena: string, c: number, a: number, alFormar?: (caja: Caja) => void) {
    fijar(grupo, (primera) => {
      const caja = cajaTexto(idx.length);
      const m = muestrear(cadena, caja, idx.length);
      const cuantos = m.puntos.length / 2;
      const orden = Array.from(idx).sort((p, q) => x[p] - x[q]);
      const destinos = Array.from({ length: cuantos }, (_, j) => j).sort((p, q) => m.puntos[p * 2] - m.puntos[q * 2]);
      // Si hay menos puntos que partículas, se reparten a lo largo de todo el orden y las sobrantes se apagan.
      for (let r = 0; r < orden.length; r++) {
        const i = orden[r];
        const j = cuantos > 0 ? Math.floor((r * cuantos) / orden.length) : -1;
        // Con menos puntos que partículas, la primera de cada tramo toma el punto; las demás se apagan.
        const usa = j >= 0 && (r === 0 || Math.floor(((r - 1) * cuantos) / orden.length) !== j);
        if (!usa) {
          talpha[i] = 0;
          continue;
        }
        const d = destinos[j];
        tx[i] = caja.x + m.puntos[d * 2];
        ty[i] = caja.y + m.puntos[d * 2 + 1];
        if (primera || color[i] === c) {
          color[i] = c;
          talpha[i] = a;
        }
      }
      resorte(idx, 0.06);
      alFormar?.(m.caja);
    });
  }

  /** Las partículas caen a su poza (montículo elíptico al fondo de la zona). Reparto ∝ valor; ancho ∝ √valor. */
  function caida(idx: Uint32Array, alFormar?: (pozas: PozaPos[]) => void) {
    fijar("R", () => {
      const z = zona();
      const valores = datos.pozas;
      const total = valores.reduce((s, v) => s + v, 0) || 1;
      const raices = valores.map((v) => Math.sqrt(v));
      const sumaRaices = raices.reduce((s, v) => s + v, 0) || 1;
      const util = W * (movil() ? 0.9 : 0.8);
      const hueco = W * 0.02;
      const base = z.y + z.h * 0.8;
      let cursor = (W - util) / 2;
      const pozas: PozaPos[] = raices.map((r) => {
        const ancho = Math.max(12, (util - hueco * (valores.length - 1)) * (r / sumaRaices));
        const p = { cx: cursor + ancho / 2, base, ancho, alto: Math.min(ancho * 0.4, z.h * 0.3) };
        cursor += ancho + hueco;
        return p;
      });
      const rr = prng(17);
      let desde = 0;
      valores.forEach((v, j) => {
        const cuantas = j === valores.length - 1 ? idx.length - desde : Math.round((idx.length * v) / total);
        const p = pozas[j];
        for (let q = desde; q < Math.min(idx.length, desde + cuantas); q++) {
          const i = idx[q];
          // Punto uniforme en la media elipse superior.
          const t = rr() * Math.PI;
          const rad = Math.sqrt(rr());
          tx[i] = p.cx + Math.cos(t) * rad * (p.ancho / 2);
          ty[i] = p.base - Math.sin(t) * rad * p.alto;
        }
        desde += cuantas;
      });
      resorte(idx, 0.035);
      alFormar?.(pozas);
    });
  }

  /** Nube baja y difusa (para disolver una cifra). */
  function nube(grupo: string, idx: Uint32Array) {
    fijar(grupo, () => {
      const z = zona();
      const rr = prng(23);
      for (const i of idx) {
        tx[i] = W * (0.1 + rr() * 0.8);
        ty[i] = z.y + z.h * (0.72 + (rr() - 0.5) * 0.2);
      }
      resorte(idx, 0.06);
    });
  }

  /** Arco hacia arriba con un leve sesgo al centro (balístico). */
  function arco(idx: Uint32Array) {
    activas.delete("F");
    activas.delete("R");
    const rr = prng(29);
    for (const i of idx) {
      k[i] = 0;
      vy[i] = -(6 + rr() * 5);
      vx[i] = (W / 2 - x[i]) * 0.012 + (rr() - 0.5) * 1.2;
    }
  }

  function explosion() {
    activas.clear();
    gravedad = 0;
    const cx = W / 2;
    const cy = zona().h * 0.5;
    const rr = prng(31);
    for (let i = 0; i < n; i++) {
      k[i] = 0;
      const dx = x[i] - cx;
      const dy = y[i] - cy;
      const d = Math.hypot(dx, dy) || 1;
      const v = 6 + rr() * 8;
      vx[i] = (dx / d) * v;
      vy[i] = (dy / d) * v;
      talpha[i] = 0;
    }
    pasos = [];
    if (!reducir) arrancar();
  }

  // ——— Coreografía por acto ———
  const emitirCifra = (clave: "sesiones" | "cierres" | "riesgo" | "contratos") => (caja: Caja) => alEvento({ tipo: "cifra", acto, clave, caja });

  function guion(a: number): { en: number; hacer: () => void }[] {
    if (a === 0)
      return [
        {
          en: 0,
          hacer: () => (
            activas.clear(),
            (gravedad = 0),
            alEvento({ tipo: "ocultarCifra" }),
            alEvento({ tipo: "ocultarPozas" }),
            apariencia(todas, AZUL, 0.55),
            enjambre(todas, true)
          ),
        },
        { en: 1000, hacer: () => texto("todas", todas, datos.llegaron, AZUL, 0.9) },
        { en: 1700, hacer: () => emitirCifra("sesiones")(medir(datos.llegaron, n)) },
        { en: 3400, hacer: () => (alEvento({ tipo: "ocultarCifra" }), apariencia(R, TENUE, 0.12), apariencia(S, AZUL, 1), quietas(R)) },
        { en: 3800, hacer: () => texto("S", S, datos.firmaron, AZUL, 1, emitirCifraTarde("cierres")) },
      ];
    if (a === 1)
      return [
        { en: 0, hacer: () => (activas.clear(), alEvento({ tipo: "ocultarCifra" }), apariencia(R, CORAL, 0.85), apariencia(S, AZUL, 0)) },
        { en: 600, hacer: () => ((gravedad = 0.35), caida(R)) },
        { en: 2000, hacer: () => caida(R, (pozas) => alEvento({ tipo: "pozas", pozas })) },
        {
          en: 4000,
          hacer: () => ((gravedad = 0), alEvento({ tipo: "ocultarPozas" }), texto("R", R, datos.riesgo, CORAL, 0.85, emitirCifraTarde("riesgo"))),
        },
      ];
    return [
      { en: 0, hacer: () => (activas.clear(), (gravedad = 0), alEvento({ tipo: "ocultarCifra" }), apariencia(S, AZUL, 0), nube("R", R)) },
      { en: 600, hacer: () => ((gravedad = 0.18), apariencia(F, AZUL, 0.95), apariencia(Rresto, CORAL, 0.15), arco(F), nube("Rresto", Rresto)) },
      { en: 2800, hacer: () => ((gravedad = 0), texto("F", F, datos.contratos, AZUL, 0.95, emitirCifraTarde("contratos"))) },
      { en: 4600, hacer: () => alEvento({ tipo: "chip", caja: medir(datos.contratos, F.length) }) },
    ];
  }

  /** La etiqueta llega cuando la cifra ya está casi formada (~0.7 s después). */
  function emitirCifraTarde(clave: "cierres" | "riesgo" | "contratos") {
    const desde = reloj;
    return (caja: Caja) => {
      const en = Math.max(desde + 700, reloj);
      if (reducir || en <= reloj) return emitirCifra(clave)(caja);
      pasos.push({ en, hacer: () => emitirCifra(clave)(caja), hecho: false });
    };
  }

  function medir(cadena: string, cuantas: number): Caja {
    return muestrear(cadena, cajaTexto(cuantas), cuantas).caja;
  }

  /** Las apagadas se quedan donde están, con un leve temblor. */
  function quietas(idx: Uint32Array) {
    fijar("R", () => {
      const rr = prng(37);
      for (const i of idx) {
        tx[i] += (rr() - 0.5) * 3;
        ty[i] += (rr() - 0.5) * 3;
      }
    });
  }

  /** Estado final de un acto, sin recorrido (al volver, saltar o con reduced motion). */
  function estadoFinal(a: number) {
    activas.clear();
    gravedad = 0;
    alEvento({ tipo: "ocultarPozas" });
    alEvento({ tipo: "ocultarCifra" });
    if (a === 0) {
      texto("todas", todas, datos.llegaron, TENUE, 0.12);
      quietas(R);
      apariencia(R, TENUE, 0.12);
      texto("S", S, datos.firmaron, AZUL, 1, emitirCifra("cierres"));
    } else if (a === 1) {
      apariencia(S, AZUL, 0);
      texto("R", R, datos.riesgo, CORAL, 0.85, emitirCifra("riesgo"));
    } else {
      apariencia(S, AZUL, 0);
      nube("Rresto", Rresto);
      apariencia(Rresto, CORAL, 0.15);
      texto("F", F, datos.contratos, AZUL, 0.95, emitirCifra("contratos"));
      alEvento({ tipo: "chip", caja: medir(datos.contratos, F.length) });
    }
  }

  function irA(a: number, { instantaneo = false } = {}) {
    acto = a;
    reloj = 0;
    if (reducir) {
      estadoFinal(a);
      pasos = [];
      for (let i = 0; i < n; i++) {
        x[i] = tx[i];
        y[i] = ty[i];
        alpha[i] = talpha[i];
        vx[i] = vy[i] = 0;
      }
      canvas.style.transition = "opacity 75ms linear";
      canvas.style.opacity = "0";
      window.setTimeout(() => {
        dibujar(0);
        canvas.style.opacity = "1";
      }, 75);
      return;
    }
    if (instantaneo) {
      estadoFinal(a);
      for (let i = 0; i < n; i++) if (k[i] < 0.08) k[i] = 0.09; // llega en ~0.5 s
      pasos = [];
    } else {
      pasos = guion(a).map((p) => ({ ...p, hecho: false }));
    }
    arrancar();
  }

  // ——— Física y dibujo ———
  function paso(dt: number) {
    const f = Math.min(dt, 50) / FRAME;
    const amort = Math.pow(AMORTIGUACION, f);
    const alfa = 1 - Math.pow(1 - ALFA_PASO, f);
    for (let i = 0; i < n; i++) {
      if (k[i] > 0) {
        vx[i] += (tx[i] - x[i]) * k[i] * f;
        vy[i] += (ty[i] - y[i]) * k[i] * f;
        if (gravedad > 0 && y[i] < ty[i]) vy[i] += gravedad * f;
        vx[i] *= amort;
        vy[i] *= amort;
      } else {
        vy[i] += gravedad * f;
        vx[i] *= Math.pow(0.985, f);
        vy[i] *= Math.pow(0.985, f);
      }
      x[i] += vx[i] * f;
      y[i] += vy[i] * f;
      alpha[i] += (talpha[i] - alpha[i]) * alfa;
    }
  }

  function dibujar(t: number) {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const lado = dpr > 1 ? 1.6 : 2;
    const mitad = lado / 2;
    const fase0 = t * 0.0012;
    for (const c of [TENUE, CORAL, AZUL]) {
      ctx.globalCompositeOperation = c === AZUL ? "lighter" : "source-over";
      ctx.fillStyle = colores[c];
      for (let i = 0; i < n; i++) {
        if (color[i] !== c) continue;
        const a = alpha[i];
        if (a < 0.01) continue;
        ctx.globalAlpha = a > 1 ? 1 : a;
        const ruido = reducir ? 0 : RUIDO;
        ctx.fillRect(x[i] + Math.sin(fase0 + fase[i]) * ruido - mitad, y[i] + Math.cos(fase0 * 1.3 + fase[i]) * ruido - mitad, lado, lado);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  function cuadro(t: number) {
    raf = 0;
    if (destruido || pausado || oculto) return;
    const dt = ultimo ? t - ultimo : FRAME;
    ultimo = t;
    reloj += Math.min(dt, 50);
    for (const p of pasos)
      if (!p.hecho && reloj >= p.en) {
        p.hecho = true;
        p.hacer();
      }
    paso(dt);
    dibujar(t);
    raf = requestAnimationFrame(cuadro);
  }

  function arrancar() {
    if (raf || destruido || pausado || oculto || reducir) return;
    ultimo = 0;
    raf = requestAnimationFrame(cuadro);
  }

  function detener() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  // ——— Tamaño ———
  function medirLienzo() {
    // Tamaño de layout (clientWidth), no el visual: el diálogo entra con una escala que no debe contar.
    W = Math.max(1, canvas.clientWidth);
    H = Math.max(1, canvas.clientHeight);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }
  medirLienzo();
  const ro = new ResizeObserver(() => {
    const antesW = W;
    const antesH = H;
    medirLienzo();
    if (Math.abs(antesW - W) < 1 && Math.abs(antesH - H) < 1) return;
    for (const aplicar of activas.values()) aplicar();
    if (reducir || pausado) {
      if (reducir)
        for (let i = 0; i < n; i++) {
          x[i] = tx[i];
          y[i] = ty[i];
        }
      dibujar(0);
    }
  });
  ro.observe(canvas);

  const alVisibilidad = () => {
    oculto = document.hidden;
    if (oculto) detener();
    else arrancar();
  };
  document.addEventListener("visibilitychange", alVisibilidad);

  // Posición inicial fuera del lienzo, a la izquierda.
  for (let i = 0; i < n; i++) {
    x[i] = -20;
    y[i] = H * 0.3;
  }

  return {
    irA,
    pausar(p) {
      pausado = p;
      if (p) detener();
      else arrancar();
    },
    explosion,
    destruir() {
      destruido = true;
      detener();
      ro.disconnect();
      document.removeEventListener("visibilitychange", alVisibilidad);
    },
  };
}
