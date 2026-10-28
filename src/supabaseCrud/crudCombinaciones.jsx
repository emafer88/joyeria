import { supabase } from "../index";

// Tallas y colores de un producto con existencia propia (Fase C). Tabla
// producto_combinaciones; el stock de cada una es su fila en `stock` con
// id_combinacion. Las policies dejan leer al personal y escribir a quien
// tiene el módulo de productos.

// Activas, en su orden, con su existencia en el almacén (null si no tiene
// fila ahí todavía).
export async function MostrarCombinaciones({ id_producto, id_almacen }) {
  const { data, error } = await supabase
    .from("producto_combinaciones")
    .select(
      "id, talla, color, color_hex, sku, codigo_barras, orden, stock(id, id_almacen, stock, stock_minimo)"
    )
    .eq("id_producto", id_producto)
    .eq("activo", true)
    .order("orden");
  if (error) throw new Error(error.message);
  return (data ?? []).map(({ stock, ...c }) => ({
    ...c,
    stockAlmacen: stock.find((s) => s.id_almacen === id_almacen) ?? null,
  }));
}

export async function GuardarCombinaciones({ id_producto, id_almacen, combinaciones }) {
  const { error } = await supabase.rpc("guardar_combinaciones_producto", {
    _id_producto: id_producto,
    _id_almacen: id_almacen ?? null,
    _combinaciones: combinaciones,
  });
  if (error) {
    if (error.code === "23505") {
      throw new Error("Ese código de barras ya lo usa otra talla o color");
    }
    throw new Error(error.message);
  }
}

// "M · Negro", "M", "Negro".
export function nombreCombinacion(c) {
  return [c?.talla, c?.color].filter(Boolean).join(" · ");
}
