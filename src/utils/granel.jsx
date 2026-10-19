// Un producto "a granel" se vende por peso: su precio_venta es el precio por
// kilo y la cantidad del detalle de venta son los kilos (con decimales).
// En la base hay valores viejos en minúsculas ('unidad' es el default), por
// eso se compara sin importar mayúsculas.
export function esGranel(producto) {
  return String(producto?.sevende_por ?? "").toUpperCase() === "GRANEL";
}

// 0.35 -> "0.350 kg"
export function formatearKg(kg) {
  // Espacio no separable para que "kg" no quede en otro renglón.
  return `${Number(kg).toFixed(3)} kg`;
}
