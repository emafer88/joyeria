// Productos que se venden por peso. sevende_por:
//   "GRANEL" -> por kilo: precio_venta es el precio por kg y la cantidad del
//               detalle de venta / el stock son kilos.
//   "GRAMO"  -> por gramo: lo mismo pero en gramos.
// En la base hay valores viejos en minúsculas ('unidad' es el default), por
// eso se compara sin importar mayúsculas.
const UNIDADES = { GRANEL: "kg", GRAMO: "g" };

// "kg", "g" o null si se vende por unidad.
export function unidadPeso(producto) {
  return UNIDADES[String(producto?.sevende_por ?? "").toUpperCase()] ?? null;
}

export function esPorPeso(producto) {
  return unidadPeso(producto) != null;
}

// 0.35 kg -> "0.350 kg"; 12.5 g -> "12.5 g". Espacio no separable para que
// la unidad no quede en otro renglón.
export function formatearPeso(n, producto) {
  const unidad = unidadPeso(producto);
  const numero =
    unidad === "kg"
      ? Number(n).toFixed(3)
      : String(Math.round(Number(n) * 100) / 100);
  return `${numero} ${unidad}`;
}

// Cantidad con su unidad: peso para los productos por peso, piezas lo demás.
export function formatearCantidad(n, producto) {
  return esPorPeso(producto) ? formatearPeso(n, producto) : `${Number(n)} pz`;
}
