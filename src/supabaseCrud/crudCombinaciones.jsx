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

// Foto de un color del producto (la tienda la muestra al elegir ese color);
// null = foto de todos los colores.
export async function AsignarColorImagen({ id, color }) {
  const { error } = await supabase
    .from("producto_imagenes")
    .update({ color: color || null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// "M · Negro", "M", "Negro".
export function nombreCombinacion(c) {
  return [c?.talla, c?.color].filter(Boolean).join(" · ");
}

// Pestaña Ropa y calzado: una fila por combinación y almacén.
export async function RopaInventario({ id_empresa }) {
  const { data, error } = await supabase.rpc("ropa_inventario", {
    _id_empresa: id_empresa,
  });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// El producto completo para editarlo desde la pestaña de ropa.
export async function MostrarProductoRopa(id) {
  const { data, error } = await supabase
    .from("productos_v")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Agrupa las filas de ropa_inventario por producto: totales y combinaciones
// (existencia sumada entre almacenes).
export function agruparPorProducto(filas) {
  const productos = new Map();
  for (const f of filas) {
    let p = productos.get(f.id_producto);
    if (!p) {
      p = {
        id: f.id_producto,
        nombre: f.producto,
        precio_venta: f.precio_venta,
        id_categoria: f.id_categoria,
        categoria: f.categoria,
        marca: f.marca,
        imagen_portada: f.imagen_portada,
        creado: f.creado,
        combinaciones: new Map(),
        total: 0,
      };
      productos.set(f.id_producto, p);
    }
    let c = p.combinaciones.get(f.id_combinacion);
    if (!c) {
      c = {
        id: f.id_combinacion,
        talla: f.talla,
        color: f.color,
        color_hex: f.color_hex,
        codigo_barras: f.codigo_barras,
        orden: f.orden,
        stock: 0,
      };
      p.combinaciones.set(f.id_combinacion, c);
    }
    c.stock += Number(f.stock ?? 0);
    p.total += Number(f.stock ?? 0);
  }
  return [...productos.values()].map((p) => {
    const combinaciones = [...p.combinaciones.values()].sort(
      (a, b) => a.orden - b.orden
    );
    const tallas = [];
    const colores = [];
    for (const c of combinaciones) {
      if (c.talla && !tallas.includes(c.talla)) tallas.push(c.talla);
      if (c.color && !colores.some((x) => x.nombre === c.color)) {
        colores.push({ nombre: c.color, hex: c.color_hex });
      }
    }
    return { ...p, combinaciones, tallas, colores };
  });
}

// POS: combinaciones de un producto con su existencia en el almacén de la
// caja (stock null = nunca tuvo entrada ahí).
export async function PosCombinaciones({ id_producto, id_almacen }) {
  const { data, error } = await supabase.rpc("pos_combinaciones", {
    _id_producto: id_producto,
    _id_almacen: id_almacen,
  });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// POS: combinación por código de barras o SKU exacto, con los datos del
// producto que pide el carrito. null si no hay.
export async function PosBuscarCombinacion({ id_empresa, codigo }) {
  const { data, error } = await supabase.rpc("pos_buscar_combinacion", {
    _id_empresa: id_empresa,
    _codigo: codigo,
  });
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
}
