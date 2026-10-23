// Paletas del panel admin (Configuración → Apariencia). Se elige una por
// empresa (empresa.paleta_admin) y se aplica sobre el tema claro u oscuro de
// cada usuario. "acento" es el color de botones principales, paginación y
// pestañas; "menu" el del ítem activo del menú lateral.
export const PALETAS = [
  { id: "clasica", nombre: "Clásica", acento: "#f9d70b", menu: "#1cb0f6" },
  { id: "dorado", nombre: "Dorado", acento: "#c9a227", menu: "#c9a227" },
  { id: "esmeralda", nombre: "Esmeralda", acento: "#10b981", menu: "#10b981" },
  { id: "rubi", nombre: "Rubí", acento: "#e11d48", menu: "#e11d48" },
  { id: "violeta", nombre: "Violeta", acento: "#8b5cf6", menu: "#8b5cf6" },
  { id: "oceano", nombre: "Océano", acento: "#2563eb", menu: "#2563eb" },
  { id: "rosa", nombre: "Rosa", acento: "#ec4899", menu: "#ec4899" },
  { id: "grafito", nombre: "Grafito", acento: "#475569", menu: "#64748b" },
];

export const PALETA_DEFAULT = PALETAS[0];

const hexARgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbAHex = (rgb) =>
  "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");

const luminancia = (hex) => {
  const [r, g, b] = hexARgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contraste = (a, b) => {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const mezclar = (hex, con, t) => {
  const a = hexARgb(hex);
  const b = hexARgb(con);
  return rgbAHex(a.map((c, i) => c + (b[i] - c) * t));
};

// Negro o blanco, el que más se lea sobre el color.
const textoSobre = (hex) =>
  contraste(hex, "#000000") >= contraste(hex, "#ffffff") ? "#111111" : "#ffffff";

// El mismo color, oscurecido (claro) o aclarado (oscuro) lo justo para que se
// lea sobre el fondo: 3:1 para líneas, 4.5:1 para texto.
const legibleSobre = (hex, fondo, oscuro, minimo = 3) => {
  const hacia = oscuro ? "#ffffff" : "#000000";
  for (let t = 0; t <= 1; t += 0.05) {
    const c = mezclar(hex, hacia, t);
    if (contraste(c, fondo) >= minimo) return c;
  }
  return hacia;
};

const rgba = (hex, a) => `rgba(${hexARgb(hex).join(", ")}, ${a})`;

// Resuelve lo guardado en empresa.paleta_admin a { acento, menu }.
export function resolverPaleta(guardada) {
  if (guardada?.id === "personalizada" && /^#[0-9a-f]{6}$/i.test(guardada.acento ?? "")) {
    const acento = guardada.acento.toLowerCase();
    return { id: "personalizada", nombre: "Personalizada", acento, menu: acento };
  }
  return PALETAS.find((p) => p.id === guardada?.id) ?? PALETA_DEFAULT;
}

// Tema final = tema base (Light/Dark) + colores de la paleta.
export function aplicarPaleta(base, guardada) {
  const paleta = resolverPaleta(guardada);
  const oscuro = base.bgtotal === "#000";
  const tema = {
    ...base,
    acento: paleta.acento,
    acentoTexto: textoSobre(paleta.acento),
    acentoLinea: legibleSobre(paleta.acento, base.bgtotal, oscuro),
  };
  // La clásica conserva exactamente el menú de siempre.
  if (paleta.id === "clasica") return tema;
  return {
    ...tema,
    bg5: paleta.menu,
    bg6: rgba(paleta.menu, oscuro ? 0.14 : 0.18),
    color1: legibleSobre(paleta.menu, base.bgtotal, oscuro, 4.5),
  };
}
