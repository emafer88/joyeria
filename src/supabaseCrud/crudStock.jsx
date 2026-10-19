import { supabase } from "./supabase.config";

const tabla = "stock";
export async function InsertarStock(p) {
  const { error } = await supabase.from(tabla).insert(p);
  if (error) {
    throw new Error(error.message);
  }
}
export async function EditarStock(p, tipo) {
  const { error } = await supabase.rpc(
    tipo === "ingreso" ? "incrementarstock": "reducirstock",p
  );
  if (error) {
    throw new Error(error.message);
  }
}
export async function MostrarStockXAlmacenYProducto(p) {
  const { data } = await supabase
    .from(tabla)
    .select()
    .eq("id_almacen", p.id_almacen)
    .eq("id_producto", p.id_producto)
    .maybeSingle();
  return data;
}
export async function MostrarStockXAlmacenesYProducto(p) {
  const { data } = await supabase
    .from(tabla)
    .select(`*, almacen(*)`)
    .eq("id_almacen", p.id_almacen)
    .eq("id_producto", p.id_producto)
    .gt("stock", 0);
  return data;
}
// Existencias de todos los productos que controlan stock, por almacén.
export async function MostrarExistencias(p) {
  const { data, error } = await supabase
    .from(tabla)
    .select(
      `id, stock, stock_minimo, ubicacion,
      almacen!inner(id, nombre, sucursales!inner(nombre, id_empresa)),
      productos:productos_v!inner(id, nombre, codigo_barras, sevende_por,
        maneja_inventarios, precio_venta, precio_compra, activo)`
    )
    .eq("almacen.sucursales.id_empresa", p.id_empresa)
    .eq("productos.activo", true)
    .eq("productos.maneja_inventarios", true);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
