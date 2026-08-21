// Validaciones de imágenes de producto, pensadas para que después
// no fallen al subirse a la API de MercadoLibre.

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/gif", "image/bmp"];
const TAMANO_MAXIMO_MB = 5;
const TAMANO_MAXIMO_BYTES = TAMANO_MAXIMO_MB * 1024 * 1024;
const RESOLUCION_MINIMA_PX = 500; // mínimo aceptado por MercadoLibre
const MAXIMO_IMAGENES_POR_PRODUCTO = 10; // límite de MercadoLibre

export async function ValidarImagenProducto(file) {
  if (!file || file.size === undefined) {
    return { valido: false, mensaje: "No se seleccionó ningún archivo." };
  }

  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    return {
      valido: false,
      mensaje:
        "Formato no permitido. Usa JPG, PNG, GIF o BMP (MercadoLibre no acepta WEBP).",
    };
  }

  if (file.size > TAMANO_MAXIMO_BYTES) {
    return {
      valido: false,
      mensaje: `La imagen "${file.name}" supera el tamaño máximo permitido (${TAMANO_MAXIMO_MB}MB).`,
    };
  }

  const dimensiones = await obtenerDimensionesImagen(file);
  if (!dimensiones) {
    return {
      valido: false,
      mensaje: `El archivo "${file.name}" está dañado o no es una imagen válida.`,
    };
  }

  if (
    dimensiones.width < RESOLUCION_MINIMA_PX ||
    dimensiones.height < RESOLUCION_MINIMA_PX
  ) {
    return {
      valido: false,
      mensaje: `La imagen "${file.name}" debe medir al menos ${RESOLUCION_MINIMA_PX}x${RESOLUCION_MINIMA_PX}px (recomendado 1200x1200px para MercadoLibre).`,
    };
  }

  return { valido: true, mensaje: "" };
}

export function ValidarCantidadImagenes(cantidadActual, cantidadNueva) {
  if (cantidadActual + cantidadNueva > MAXIMO_IMAGENES_POR_PRODUCTO) {
    return {
      valido: false,
      mensaje: `Máximo ${MAXIMO_IMAGENES_POR_PRODUCTO} imágenes por producto (límite de MercadoLibre).`,
    };
  }
  return { valido: true, mensaje: "" };
}

// Valida un lote de archivos recién seleccionados (cantidad + cada imagen).
export async function ValidarImagenesProducto(files, cantidadActual = 0) {
  const validacionCantidad = ValidarCantidadImagenes(cantidadActual, files.length);
  if (!validacionCantidad.valido) {
    return validacionCantidad;
  }

  for (const file of files) {
    const resultado = await ValidarImagenProducto(file);
    if (!resultado.valido) {
      return resultado;
    }
  }

  return { valido: true, mensaje: "" };
}

function obtenerDimensionesImagen(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
