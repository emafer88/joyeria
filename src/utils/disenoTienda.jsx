// Diseño editable de la tienda (empresa.diseno_tienda). La tienda
// (joyeria-ecommerce, src/data/disenoTienda.ts) es la que lo interpreta: acá
// se repiten ids, paletas y textos de fábrica para el editor. Mantenerlos
// iguales en los dos repos.

export const TIENDA_URL =
  import.meta.env.VITE_TIENDA_URL ?? "https://cubiks-ecommerce.fer-ema-777.workers.dev";

export const SECCIONES = {
  banner: {
    nombre: "Banner principal",
    nota: "Las imágenes se cambian en Productos → Banners.",
  },
  categorias: { nombre: "Categorías", conTitulo: true },
  destacados: { nombre: "Productos destacados", conTitulo: true, conSubtitulo: true },
  ofertas: {
    nombre: "Ofertas",
    conTitulo: true,
    conSubtitulo: true,
    nota: "Sin productos en oferta se muestra el aviso de promoción (pestaña Textos).",
  },
  nuevos: { nombre: "Nuevos productos", conTitulo: true, conSubtitulo: true },
  beneficios: { nombre: "Beneficios", nota: "Se editan en la pestaña Textos." },
  redes: {
    nombre: "Redes sociales",
    conTitulo: true,
    conSubtitulo: true,
    nota: "Los enlaces se cargan en la pestaña Contacto.",
  },
};

export const PALETAS_TIENDA = [
  { id: "clasica", nombre: "Oro y violeta", principal: "#f3d20c", secundario: "#9046ff", fondo: "#1c1730" },
  { id: "oro-rosa", nombre: "Oro rosa", principal: "#e8b4a0", secundario: "#d0628c", fondo: "#2c1a22" },
  { id: "plata", nombre: "Plata", principal: "#d7dde6", secundario: "#7c93ff", fondo: "#1b202b" },
  { id: "esmeralda", nombre: "Esmeralda", principal: "#34d399", secundario: "#e9c46a", fondo: "#0f2a22" },
  { id: "zafiro", nombre: "Zafiro", principal: "#7cb4ff", secundario: "#c4b5fd", fondo: "#13203d" },
  { id: "rubi", nombre: "Rubí", principal: "#fb7185", secundario: "#f3d20c", fondo: "#2d0f19" },
];

export const ICONOS_BENEFICIO = [
  { id: "envio", nombre: "Envío" },
  { id: "garantia", nombre: "Garantía" },
  { id: "devolucion", nombre: "Devolución" },
  { id: "pago", nombre: "Pago seguro" },
  { id: "regalo", nombre: "Regalo" },
  { id: "diamante", nombre: "Diamante" },
  { id: "atencion", nombre: "Atención" },
  { id: "certificado", nombre: "Certificado" },
];

export const DISENO_FABRICA = {
  paleta: "clasica",
  secciones: [
    { id: "banner", visible: true, titulo: "", subtitulo: "" },
    { id: "categorias", visible: true, titulo: "Categorías", subtitulo: "" },
    {
      id: "destacados",
      visible: true,
      titulo: "Productos destacados",
      subtitulo: "Una selección de nuestras piezas favoritas",
    },
    {
      id: "ofertas",
      visible: true,
      titulo: "Ofertas",
      subtitulo: "Precio especial por tiempo limitado",
    },
    {
      id: "nuevos",
      visible: true,
      titulo: "Nuevos productos",
      subtitulo: "Lo último que llegó a la joyería",
    },
    { id: "beneficios", visible: true, titulo: "", subtitulo: "" },
    {
      id: "redes",
      visible: true,
      titulo: "Síguenos en redes",
      subtitulo: "Novedades, lanzamientos y detrás de escena de cada pieza.",
    },
  ],
  promo: {
    etiqueta: "Promociones",
    titulo: "Consulta nuestras ofertas de temporada",
    texto: "Piezas seleccionadas con condiciones especiales, todo el año.",
    boton: "Ver catálogo",
  },
  beneficios: [
    { icono: "envio", titulo: "Envío a todo México", texto: "Empaque seguro con seguimiento en cada pedido." },
    { icono: "garantia", titulo: "Garantía en tus piezas", texto: "Respaldo en materiales y fabricación." },
    { icono: "devolucion", titulo: "Devoluciones simples", texto: "Cambios y devoluciones sin complicaciones." },
    { icono: "pago", titulo: "Pagos 100% seguros", texto: "Checkout protegido en cada compra." },
  ],
  contacto: {
    nombre: "Cubiks Jewelry",
    descripcion: "Joyería en oro y plata, piezas pensadas para durar toda la vida.",
    telefono: "+52 55 0000 0000",
    whatsapp: "5215500000000",
    email: "contacto@cubiksjewelry.com",
    direccion: "Ciudad de México, México",
    instagram: "https://instagram.com/cubiksjewelry",
    facebook: "https://facebook.com/cubiksjewelry",
    tiktok: "",
  },
};

export const esUrlValida = (url) => url === "" || /^https?:\/\/[^\s"'<>]+$/i.test(url);

const texto = (valor, defecto) => (typeof valor === "string" ? valor : defecto);

// Lo guardado completado con lo de fábrica (mismo criterio que la tienda),
// para que el editor siempre tenga todos los campos.
export function completarDiseno(guardado) {
  const g = guardado && typeof guardado === "object" ? guardado : {};
  const f = DISENO_FABRICA;
  const vistos = new Set();
  const secciones = [];
  for (const s of Array.isArray(g.secciones) ? g.secciones : []) {
    const base = f.secciones.find((d) => d.id === s?.id);
    if (!base || vistos.has(base.id)) continue;
    vistos.add(base.id);
    secciones.push({
      id: base.id,
      visible: typeof s.visible === "boolean" ? s.visible : true,
      titulo: texto(s.titulo, base.titulo),
      subtitulo: texto(s.subtitulo, base.subtitulo),
    });
  }
  for (const base of f.secciones) {
    if (!vistos.has(base.id)) secciones.push({ ...base });
  }
  return {
    paleta: PALETAS_TIENDA.some((p) => p.id === g.paleta) ? g.paleta : f.paleta,
    secciones,
    promo: { ...f.promo, ...(g.promo ?? {}) },
    beneficios: Array.isArray(g.beneficios)
      ? g.beneficios.slice(0, 4).map((b) => ({ icono: "diamante", titulo: "", texto: "", ...b }))
      : f.beneficios.map((b) => ({ ...b })),
    contacto: { ...f.contacto, ...(g.contacto ?? {}) },
  };
}
