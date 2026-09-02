
import Swal from "sweetalert2";
import { supabase } from "../index";
const tabla = "productos";
const tablaImagenes = "producto_imagenes";
const bucket = "imagenes";
export async function InsertarProductos(p) {
  const { error, data } = await supabase.rpc("insertarproductos", p);
  if (error) {
    throw new Error(error.message);
  }
  console.log(data);
  return data;
}

export async function MostrarProductos(p) {
  const { data } = await supabase.rpc("mostrarproductos", {
    _id_empresa: p.id_empresa,
  });
  return data;
}
export async function BuscarProductos(p) {
  const { data, error } = await supabase.rpc("buscarproductos", {
    _id_empresa: p.id_empresa,
    buscador: p.buscador,
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
// "Eliminar" un producto lo desactiva en vez de borrarlo físicamente: si
// tiene ventas registradas, un DELETE viola la FK de detalle_venta y rompe
// el historial. Al desactivarlo deja de listarse en catálogo/buscador/POS
// (ver mostrarproductos/buscarproductos en Supabase) pero sus ventas pasadas
// y sus imágenes se conservan intactas por si se necesita reactivarlo.
export async function EliminarProductos(p) {
  const { error } = await supabase
    .from(tabla)
    .update({ activo: false })
    .eq("id", p.id);
  if (error) {
    throw new Error(error.message);
  }
}
export async function EditarProductos(p) {
  const { error } = await supabase.rpc("editarproductos", p);
  if (error) {
    throw new Error(error.message);
  }
}

export async function MostrarUltimoProducto(p) {
  const { data } = await supabase
    .from(tabla)
    .select()
    .eq("id_empresa", p.id_empresa)
    .order("id", { ascending: false })
    .maybeSingle();

  return data;
}

// ---- Galería de imágenes del producto (para futura integración con MercadoLibre) ----

export async function MostrarImagenesProducto(idProducto) {
  const { data, error } = await supabase
    .from(tablaImagenes)
    .select()
    .eq("id_producto", idProducto)
    .order("orden", { ascending: true });
  if (error) {
    Swal.fire({ icon: "error", title: "Oops...", text: error.message });
    return [];
  }
  return data;
}

function nombreUnico() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// files: arreglo de File ya validados (ver ValidarImagenesProducto).
// ordenInicial: siguiente número de orden a usar (largo de las imágenes ya existentes + 1).
export async function SubirImagenesProducto(idProducto, files, ordenInicial = 1) {
  const subidas = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ruta = `productos/${idProducto}/${nombreUnico()}`;

    const { error: errorUpload } = await supabase.storage
      .from(bucket)
      .upload(ruta, file, { cacheControl: "3600", upsert: true });
    if (errorUpload) {
      Swal.fire({ icon: "error", title: "Oops...", text: errorUpload.message });
      continue;
    }

    const { data: urlPublica } = await supabase.storage
      .from(bucket)
      .getPublicUrl(ruta);

    const { data: filaImagen, error: errorInsert } = await supabase
      .from(tablaImagenes)
      .insert({
        id_producto: idProducto,
        orden: ordenInicial + i,
        path: ruta,
        url: urlPublica.publicUrl,
      })
      .select()
      .single();
    if (errorInsert) {
      Swal.fire({ icon: "error", title: "Oops...", text: errorInsert.message });
      await supabase.storage.from(bucket).remove([ruta]);
      continue;
    }

    subidas.push(filaImagen);
  }
  return subidas;
}

// Reemplaza el archivo de una imagen ya existente sin cambiar su id/orden.
export async function EditarImagenProducto(imagen, nuevoFile) {
  const { error } = await supabase.storage
    .from(bucket)
    .update(imagen.path, nuevoFile, {
      cacheControl: "3600",
      upsert: true,
    });
  if (error) {
    Swal.fire({ icon: "error", title: "Oops...", text: error.message });
  }
}

// Si el archivo ya no está en storage (fila huérfana) igual se borra la fila
// de la tabla, para que el botón "quitar" del formulario no quede sin efecto;
// solo se aborta si storage falla por un motivo distinto a "no existe".
export async function EliminarImagenProducto(imagen) {
  const { error: errorStorage } = await supabase.storage
    .from(bucket)
    .remove([imagen.path]);
  if (
    errorStorage &&
    !/not.*found|no such|does not exist/i.test(errorStorage.message || "")
  ) {
    Swal.fire({ icon: "error", title: "Oops...", text: errorStorage.message });
    return;
  }
  const { error: errorTabla } = await supabase
    .from(tablaImagenes)
    .delete()
    .eq("id", imagen.id);
  if (errorTabla) {
    Swal.fire({ icon: "error", title: "Oops...", text: errorTabla.message });
  }
}

// imagenes: [{id, orden}, ...] ya reordenadas en el frontend (ej. tras drag & drop).
export async function ReordenarImagenesProducto(imagenes) {
  for (const img of imagenes) {
    await supabase
      .from(tablaImagenes)
      .update({ orden: img.orden })
      .eq("id", img.id);
  }
}
