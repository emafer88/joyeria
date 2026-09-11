// "Medidas" (largo/ancho en cm) se carga como dos números separados en los
// formularios, pero se guarda como un solo texto en la base (columna
// `medidas` de `productos`/`piezas_inventario`), igual que ya funcionaba.
// Estas dos funciones son la ida y vuelta entre ambos formatos.

/** Arma el texto a guardar a partir de los inputs de largo/ancho (cm). */
export function formatMedidas(largo, ancho) {
  const l = String(largo ?? "").trim();
  const a = String(ancho ?? "").trim();
  if (!l) return null;
  return a ? `${l} x ${a} cm` : `${l} cm`;
}

/** Extrae largo/ancho de un texto ya guardado, para prellenar el formulario. */
export function parseMedidas(texto) {
  const numeros = String(texto ?? "").match(/\d+(?:[.,]\d+)?/g) || [];
  return {
    largo: numeros[0] ? numeros[0].replace(",", ".") : "",
    ancho: numeros[1] ? numeros[1].replace(",", ".") : "",
  };
}
