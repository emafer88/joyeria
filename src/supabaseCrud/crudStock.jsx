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
// La fila del producto en el almacén; con id_combinacion, la de esa talla y
// color (sin ella, la del producto sin combinaciones).
export async function MostrarStockXAlmacenYProducto(p) {
  let q = supabase
    .from(tabla)
    .select()
    .eq("id_almacen", p.id_almacen)
    .eq("id_producto", p.id_producto);
  q = p.id_combinacion
    ? q.eq("id_combinacion", p.id_combinacion)
    : q.is("id_combinacion", null);
  const { data } = await q.maybeSingle();
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
// Existencias de todos los productos que controlan stock, por almacén. Las
// tallas y colores van en la pestaña Ropa y calzado (ropa_inventario).
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
    .eq("productos.maneja_inventarios", true)
    .is("id_combinacion", null);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
