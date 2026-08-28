/**
 * Codificador EAN-13 a SVG, sin dependencias. El barcode de cada pieza que
 * genera la base (`joyeria_ean13`) siempre son 13 dígitos numéricos, así que
 * con EAN-13 alcanza. Si llega algo que no matchea 13 dígitos, se dibuja solo
 * el texto (sin barras) para no romper la impresión.
 */

// Tablas de codificación EAN-13 (7 módulos por dígito).
const L = [
  "0001101", "0011001", "0010011", "0111101", "0100011",
  "0110001", "0101111", "0111011", "0110111", "0001011",
];
const G = [
  "0100111", "0110011", "0011011", "0100001", "0011101",
  "0111001", "0000101", "0010001", "0001001", "0010111",
];
const R = [
  "1110010", "1100110", "1101100", "1000010", "1011100",
  "1001110", "1010000", "1000100", "1001000", "1110100",
];
// El primer dígito define qué tabla (A=L / B=G) usa cada uno de los 6 de la izquierda.
const PARITY = [
  "AAAAAA", "AABABB", "AABBAB", "AABBBA", "ABAABB",
  "ABBAAB", "ABBBAA", "ABABAB", "ABABBA", "ABBABA",
];

const esEan13 = (code) => /^\d{13}$/.test(String(code || ""));

/** Devuelve los 95 bits ('1' = barra) del símbolo EAN-13. */
function ean13Bits(code) {
  const d = String(code).split("").map(Number);
  let bits = "101"; // guarda inicial
  const parity = PARITY[d[0]];
  for (let i = 0; i < 6; i++) bits += (parity[i] === "A" ? L : G)[d[i + 1]];
  bits += "01010"; // guarda central
  for (let i = 0; i < 6; i++) bits += R[d[i + 7]];
  bits += "101"; // guarda final
  return bits;
}

/**
 * Markup SVG (string) del código de barras.
 * @param {string} code  13 dígitos
 * @param {{module?:number, barHeight?:number, fontSize?:number}} [opts]
 */
export function ean13Svg(code, opts = {}) {
  const mod = opts.module ?? 2;
  const barH = opts.barHeight ?? 54;
  const fontSize = opts.fontSize ?? 11;
  const quietL = 11;
  const quietR = 7;
  const textH = fontSize + 3;
  const w = (quietL + 95 + quietR) * mod;
  const h = barH + textH + 2;
  const yText = barH + textH - 1;
  const valido = esEan13(code);

  let barras = "";
  if (valido) {
    const bits = ean13Bits(code);
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] !== "1") continue;
      const x = (quietL + i) * mod;
      const esGuarda = i < 3 || (i >= 45 && i < 50) || i >= 92;
      barras += `<rect x="${x}" y="0" width="${mod}" height="${
        esGuarda ? barH + 5 : barH
      }"/>`;
    }
  }

  let texto = "";
  if (valido) {
    const c = String(code);
    texto += `<text x="${(quietL - 9) * mod}" y="${yText}" font-size="${fontSize}">${c[0]}</text>`;
    for (let i = 0; i < 6; i++) {
      const cx = (quietL + 3 + i * 7 + 3.5) * mod;
      texto += `<text x="${cx}" y="${yText}" font-size="${fontSize}" text-anchor="middle">${c[i + 1]}</text>`;
    }
    for (let i = 0; i < 6; i++) {
      const cx = (quietL + 50 + i * 7 + 3.5) * mod;
      texto += `<text x="${cx}" y="${yText}" font-size="${fontSize}" text-anchor="middle">${c[i + 7]}</text>`;
    }
  } else {
    texto += `<text x="${w / 2}" y="${yText}" font-size="${fontSize}" text-anchor="middle">${String(
      code || ""
    )}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="#000"><g font-family="monospace">${barras}${texto}</g></svg>`;
}

/** Componente de preview en pantalla. */
export function CodigoBarras({ value, module, barHeight, fontSize }) {
  return (
    <span
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: ean13Svg(value, { module, barHeight, fontSize }),
      }}
    />
  );
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Abre una ventana con la hoja de etiquetas y lanza el diálogo de impresión.
 * Cada etiqueta: nombre, material + pureza, peso, precio, código de barras, SKU.
 * @param {Array<{sku:string,barcode:string,peso:(number|string),precio_venta:(number|string)}>} piezas
 * @param {{producto?:string, material?:string, pureza?:string}} meta
 */
export function imprimirEtiquetas(piezas, meta = {}) {
  if (!piezas || piezas.length === 0) return;

  const etiquetas = piezas
    .map(
      (p) => `
      <div class="et">
        <div class="nombre">${esc(meta.producto)}</div>
        <div class="mat">${esc(meta.material)} ${esc(meta.pureza || "")} &middot; ${p.peso} g</div>
        <div class="precio">$ ${p.precio_venta}</div>
        ${ean13Svg(p.barcode, { module: 2, barHeight: 46, fontSize: 10 })}
        <div class="sku">${esc(p.sku)}</div>
      </div>`
    )
    .join("");

  const html = `<!doctype html><html><head><meta charset="utf-8">
    <title>Etiquetas</title>
    <style>
      @page { margin: 6mm; }
      * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
      body { margin: 0; }
      .hoja { display: flex; flex-wrap: wrap; gap: 4mm; }
      .et {
        width: 46mm;
        border: 1px dashed #bbb;
        border-radius: 4px;
        padding: 3mm;
        text-align: center;
        page-break-inside: avoid;
      }
      .nombre { font-weight: 700; font-size: 10pt; line-height: 1.1; }
      .mat { font-size: 8pt; color: #333; margin: 1mm 0; }
      .precio { font-weight: 700; font-size: 12pt; margin-bottom: 1mm; }
      .et svg { width: 100%; height: auto; }
      .sku { font-family: monospace; font-size: 8pt; margin-top: 1mm; }
    </style></head>
    <body>
      <div class="hoja">${etiquetas}</div>
      <script>window.onload=function(){window.print();};</script>
    </body></html>`;

  const win = window.open("", "_blank", "width=900,height=650");
  if (!win) {
    alert("Habilitá las ventanas emergentes para poder imprimir las etiquetas.");
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
