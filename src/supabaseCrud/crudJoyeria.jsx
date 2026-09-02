import Swal from "sweetalert2";
import { supabase } from "../index";

/**
 * CRUD del módulo de inventario serializado de joyería.
 * Diseño  = fila de `productos` con es_joyeria = true (maneja_inventarios = false).
 * Variante = fila de `producto_variantes` (material + pureza).
 * Pieza    = fila de `piezas_inventario` (se maneja en etapas posteriores).
 *
 * @typedef {Object} DisenoJoyeria
 * @property {number} id
 * @property {string} nombre
 * @property {string|null} descripcion
 * @property {number} id_categoria
 * @property {number|null} id_marca
 * @property {{nombre:string}|null} categorias
 *
 * @typedef {Object} VarianteJoyeria
 * @property {number} id
 * @property {number} id_producto
 * @property {number} id_empresa
 * @property {string} material
 * @property {string|null} pureza
 * @property {string|null} sku_prefijo
 * @property {number} ultimo_correlativo
 * @property {number|null} precio_venta_sugerido
 * @property {number|null} precio_compra_sugerido
 * @property {string|null} notas
 */

// ---------------------------------------------------------------------------
// Diseños (productos es_joyeria = true)
// ---------------------------------------------------------------------------

/** @returns {Promise<number>} id del diseño creado */
export async function CrearProductoJoyeria(p) {
  const { data, error } = await supabase.rpc("crear_producto_joyeria", p);
  if (error) throw new Error(error.message);
  return data;
}

/** @returns {Promise<DisenoJoyeria[]>} */
export async function MostrarProductosJoyeria(p) {
  const { data, error } = await supabase
    .from("productos")
    .select("*, categorias(nombre)")
    .eq("id_empresa", p.id_empresa)
    .eq("es_joyeria", true)
    .order("nombre", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function EditarProductoJoyeria(p) {
  const { error } = await supabase
    .from("productos")
    .update({
      nombre: p.nombre,
      descripcion: p.descripcion,
      id_categoria: p.id_categoria,
      id_marca: p.id_marca,
    })
    .eq("id", p.id);
  if (error) throw new Error(error.message);
}

/** El FK RESTRICT bloquea el borrado si el diseño ya tiene piezas. */
export async function EliminarProductoJoyeria(p) {
  const { error } = await supabase.from("productos").delete().eq("id", p.id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Variantes
// ---------------------------------------------------------------------------

/** @returns {Promise<number>} id de la variante creada */
export async function CrearVariante(p) {
  const { data, error } = await supabase.rpc("crear_variante", p);
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Trae las variantes del diseño con su galería embebida
 * (`producto_variante_imagenes`) para poder mostrar la portada en la lista.
 * @returns {Promise<VarianteJoyeria[]>}
 */
export async function MostrarVariantes(p) {
  const { data, error } = await supabase
    .from("producto_variantes")
    .select("*, producto_variante_imagenes(id, url, path, orden)")
    .eq("id_producto", p.id_producto)
    .order("material", { ascending: true })
    .order("pureza", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function EditarVariante(p) {
  const { error } = await supabase
    .from("producto_variantes")
    .update({
      material: p.material,
      pureza: p.pureza,
      precio_venta_sugerido: p.precio_venta_sugerido,
      precio_compra_sugerido: p.precio_compra_sugerido,
      notas: p.notas,
    })
    .eq("id", p.id);
  if (error) throw new Error(error.message);
}

export async function EliminarVariante(p) {
  const { error } = await supabase
    .from("producto_variantes")
    .delete()
    .eq("id", p.id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Piezas
// ---------------------------------------------------------------------------

/**
 * Alta masiva. `_lineas` es un array de objetos
 * { peso, costo, precio_venta, cantidad }. Devuelve todas las piezas creadas
 * (con su sku y barcode ya generados) para imprimir etiquetas.
 * @returns {Promise<any[]>}
 */
export async function CrearPiezasMasivo(p) {
  const { data, error } = await supabase.rpc("crear_piezas_masivo", p);
  if (error) throw new Error(error.message);
  return data || [];
}

/** Alta de una sola pieza. @returns {Promise<any[]>} */
export async function CrearPiezaIndividual(p) {
  const { data, error } = await supabase.rpc("crear_pieza", p);
  if (error) throw new Error(error.message);
  return data || [];
}

/** @returns {Promise<any[]>} piezas de una variante */
export async function MostrarPiezasVariante(p) {
  const { data, error } = await supabase
    .from("piezas_inventario")
    .select("*")
    .eq("id_variante", p.id_variante)
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Filas planas de todo el inventario de piezas de la empresa (una por pieza,
 * con nombres de categoría/diseño/variante/almacén ya resueltos). Alimenta la
 * pantalla de inventario (TanStack Table agrupa/filtra/ordena del lado cliente).
 * @returns {Promise<any[]>}
 */
export async function MostrarInventarioListado(p) {
  const { data, error } = await supabase.rpc("joyeria_inventario_listado", {
    _id_empresa: p.id_empresa,
  });
  if (error) throw new Error(error.message);
  return data || [];
}

/** Lista plana de almacenes de la empresa: { id, nombre, sucursales:{nombre} }. */
export async function MostrarAlmacenesJoyeria(p) {
  const { data, error } = await supabase
    .from("almacen")
    .select("id, nombre, sucursales!inner(nombre, id_empresa)")
    .eq("sucursales.id_empresa", p.id_empresa)
    .order("nombre", { ascending: true });
  if (error) return [];
  return data || [];
}

// ---------------------------------------------------------------------------
// Resumen por variante (para el detalle del diseño)
// ---------------------------------------------------------------------------

/**
 * Filas mínimas de piezas de un diseño para contar disponibles/total por
 * variante en el detalle. Devuelve [] si todavía no hay piezas.
 * @returns {Promise<{id_variante:number, estado:string}[]>}
 */
export async function ResumenPiezasPorDiseno(p) {
  const { data, error } = await supabase
    .from("piezas_inventario")
    .select("id_variante, estado")
    .eq("id_producto", p.id_producto);
  if (error) throw new Error(error.message);
  return data;
}

// ---------------------------------------------------------------------------
// POS
// ---------------------------------------------------------------------------

/**
 * Busca la pieza exacta por código de barras o SKU.
 * @returns {Promise<any|null>}
 */
export async function PosBuscarPieza(p) {
  const { data, error } = await supabase.rpc("pos_buscar_pieza", {
    _codigo: p.codigo,
    _id_empresa: p.id_empresa,
  });
  if (error) throw new Error(error.message);
  return (data && data[0]) || null;
}

/**
 * Búsqueda por texto parcial (nombre/SKU/código) de piezas disponibles, para
 * integrarlas al buscador principal del POS junto con los productos normales.
 * @returns {Promise<any[]>}
 */
export async function PosBuscarPiezasTexto(p) {
  const { data, error } = await supabase.rpc("pos_buscar_piezas_texto", {
    _id_empresa: p.id_empresa,
    _buscador: p.buscador,
  });
  if (error) throw new Error(error.message);
  return data || [];
}

/** Reserva la pieza (disponible -> reservada) de forma atómica. */
export async function ReservarPieza(p) {
  const { error } = await supabase.rpc("reservar_pieza", {
    _id_pieza: p.id_pieza,
    _id_venta: p.id_venta,
    _id_empresa: p.id_empresa,
    _id_usuario: p.id_usuario ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Libera la pieza (reservada -> disponible). */
export async function LiberarPieza(p) {
  const { error } = await supabase.rpc("liberar_pieza", {
    _id_pieza: p.id_pieza,
    _id_empresa: p.id_empresa,
    _id_usuario: p.id_usuario ?? null,
  });
  if (error) throw new Error(error.message);
}

/**
 * Inserta la línea de venta de una pieza serializada. Se hace directo sobre
 * `detalle_venta` (y no por el RPC insertardetalleventa) porque hace falta
 * mandar `id_pieza`; el trigger zz_joyeria_detalle_venta_biu se encarga de
 * "consumir" la pieza de forma atómica.
 */
export async function InsertarLineaPieza(p) {
  const { error } = await supabase.from("detalle_venta").insert({
    id_venta: p.id_venta,
    id_producto: p.id_producto,
    id_pieza: p.id_pieza,
    cantidad: 1,
    precio_venta: p.precio_venta,
    precio_compra: p.costo ?? 0,
    total: p.precio_venta,
    descripcion: p.descripcion,
    id_sucursal: p.id_sucursal,
    id_almacen: p.id_almacen,
  });
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Catálogos auxiliares
// ---------------------------------------------------------------------------

/** La tabla `marca` puede no existir en todas las bases: si falla, devuelve []. */
export async function MostrarMarcasJoyeria(p) {
  const { data, error } = await supabase
    .from("marca")
    .select("*")
    .eq("id_empresa", p.id_empresa)
    .order("nombre", { ascending: true });
  if (error) return [];
  return data || [];
}

export async function MostrarCategoriasJoyeria(p) {
  const { data, error } = await supabase
    .from("categorias")
    .select("id, nombre")
    .eq("id_empresa", p.id_empresa)
    .order("nombre", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

// ---------------------------------------------------------------------------
// Movimientos manuales (ajuste / marcar / devolver) + historial de la pieza
// ---------------------------------------------------------------------------

/** Corrige peso / costo / precio de una pieza no vendida (deja kardex 'ajuste'). */
export async function AjustarPieza(p) {
  const { error } = await supabase.rpc("ajustar_pieza", {
    _id_pieza: p.id_pieza,
    _id_empresa: p.id_empresa,
    _id_usuario: p.id_usuario ?? null,
    _peso: p.peso ?? null,
    _costo: p.costo ?? null,
    _precio_venta: p.precio_venta ?? null,
    _nota: p.nota ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Marca la pieza como `perdida` / `danada`, o la vuelve a `disponible`. */
export async function MarcarPieza(p) {
  const { error } = await supabase.rpc("marcar_pieza", {
    _id_pieza: p.id_pieza,
    _id_empresa: p.id_empresa,
    _id_usuario: p.id_usuario ?? null,
    _estado: p.estado,
    _nota: p.nota ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Devolución post-venta: pieza `vendida` -> `disponible` o `danada`. */
export async function DevolverPieza(p) {
  const { error } = await supabase.rpc("devolver_pieza", {
    _id_pieza: p.id_pieza,
    _id_empresa: p.id_empresa,
    _id_usuario: p.id_usuario ?? null,
    _destino: p.destino ?? "disponible",
    _nota: p.nota ?? null,
  });
  if (error) throw new Error(error.message);
}

/** Historial (kardex) de una pieza, más reciente primero. @returns {Promise<any[]>} */
export async function MostrarMovimientosPieza(p) {
  const { data, error } = await supabase.rpc("joyeria_movimientos_pieza", {
    _id_pieza: p.id_pieza,
  });
  if (error) throw new Error(error.message);
  return data || [];
}

// ---------------------------------------------------------------------------
// Galería de imágenes por variante (espejo de producto_imagenes)
// Bucket "imagenes" (público), carpeta `variantes/{id_variante}/...`.
// "Portada" de la variante = la fila con `orden` más bajo.
// ---------------------------------------------------------------------------

const BUCKET_IMG = "imagenes";
const TABLA_IMG_VARIANTE = "producto_variante_imagenes";

function nombreUnicoImg() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** @returns {Promise<any[]>} imágenes de la variante, ordenadas por `orden`. */
export async function MostrarImagenesVariante(idVariante) {
  const { data, error } = await supabase
    .from(TABLA_IMG_VARIANTE)
    .select()
    .eq("id_variante", idVariante)
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Sube archivos ya validados (ver ValidarImagenesProducto) y crea sus filas.
 * `ordenInicial` = siguiente número de orden a usar.
 * @returns {Promise<any[]>} filas creadas
 */
export async function SubirImagenesVariante(idVariante, files, ordenInicial = 1) {
  const subidas = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ruta = `variantes/${idVariante}/${nombreUnicoImg()}`;

    const { error: errorUpload } = await supabase.storage
      .from(BUCKET_IMG)
      .upload(ruta, file, { cacheControl: "3600", upsert: true });
    if (errorUpload) {
      Swal.fire({ icon: "error", title: "Oops...", text: errorUpload.message });
      continue;
    }

    const { data: urlPublica } = await supabase.storage
      .from(BUCKET_IMG)
      .getPublicUrl(ruta);

    const { data: fila, error: errorInsert } = await supabase
      .from(TABLA_IMG_VARIANTE)
      .insert({
        id_variante: idVariante,
        orden: ordenInicial + i,
        path: ruta,
        url: urlPublica.publicUrl,
      })
      .select()
      .single();
    if (errorInsert) {
      Swal.fire({ icon: "error", title: "Oops...", text: errorInsert.message });
      await supabase.storage.from(BUCKET_IMG).remove([ruta]);
      continue;
    }

    subidas.push(fila);
  }
  return subidas;
}

/**
 * Borra la imagen. A diferencia de EliminarImagenProducto, si el archivo ya
 * no está en storage igual se borra la fila (evita filas huérfanas
 * imposibles de quitar); solo aborta si storage falla por otro motivo.
 */
export async function EliminarImagenVariante(imagen) {
  const { error: errorStorage } = await supabase.storage
    .from(BUCKET_IMG)
    .remove([imagen.path]);
  if (
    errorStorage &&
    !/not.*found|no such|does not exist/i.test(errorStorage.message || "")
  ) {
    Swal.fire({ icon: "error", title: "Oops...", text: errorStorage.message });
    return;
  }
  const { error: errorTabla } = await supabase
    .from(TABLA_IMG_VARIANTE)
    .delete()
    .eq("id", imagen.id);
  if (errorTabla) {
    Swal.fire({ icon: "error", title: "Oops...", text: errorTabla.message });
  }
}

/** imagenes: [{ id, orden }, ...] ya reordenadas en el frontend. */
export async function ReordenarImagenesVariante(imagenes) {
  for (const img of imagenes) {
    await supabase
      .from(TABLA_IMG_VARIANTE)
      .update({ orden: img.orden })
      .eq("id", img.id);
  }
}
