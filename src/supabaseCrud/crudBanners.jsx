// CRUD de banners del home del ecommerce. Tabla sin RPC (como
// producto_imagenes): el gate real es que el ecommerce nunca la lee directo,
// siempre pasa por ecommerce_listar_banners (RPC de solo lectura).
import { supabase } from "../index";

const tabla = "banners";
const bucket = "imagenes";

export async function MostrarBanners(p) {
  const { data, error } = await supabase
    .from(tabla)
    .select()
    .eq("id_empresa", p.id_empresa)
    .order("orden", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

function nombreUnico() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function subirImagenBanner(file) {
  const ruta = `banners/${nombreUnico()}`;
  const { error: errorUpload } = await supabase.storage
    .from(bucket)
    .upload(ruta, file, { cacheControl: "3600", upsert: true });
  if (errorUpload) throw new Error(errorUpload.message);

  const { data: urlPublica } = await supabase.storage
    .from(bucket)
    .getPublicUrl(ruta);
  return { path: ruta, url: urlPublica.publicUrl };
}

/** p: { titulo, subtitulo, link_destino, orden, activo, id_empresa }, file: File de la imagen (obligatoria en alta). */
export async function InsertarBanner(p, file) {
  const { path, url } = await subirImagenBanner(file);
  const { data, error } = await supabase
    .from(tabla)
    .insert({ ...p, imagen_path: path, imagen_url: url })
    .select()
    .single();
  if (error) {
    await supabase.storage.from(bucket).remove([path]);
    throw new Error(error.message);
  }
  return data;
}

/** p: { id, titulo, subtitulo, link_destino, orden, activo }, file: File nuevo (opcional, reemplaza la imagen). */
export async function EditarBanner(p, file) {
  const cambios = {
    titulo: p.titulo,
    subtitulo: p.subtitulo,
    link_destino: p.link_destino,
    orden: p.orden,
    activo: p.activo,
    updated_at: new Date().toISOString(),
  };
  if (file) {
    const { path, url } = await subirImagenBanner(file);
    cambios.imagen_path = path;
    cambios.imagen_url = url;
    if (p.imagen_path_anterior) {
      await supabase.storage.from(bucket).remove([p.imagen_path_anterior]);
    }
  }
  const { error } = await supabase.from(tabla).update(cambios).eq("id", p.id);
  if (error) throw new Error(error.message);
}

export async function EliminarBanner(p) {
  const { error } = await supabase.from(tabla).delete().eq("id", p.id);
  if (error) throw new Error(error.message);
  if (p.imagen_path) {
    await supabase.storage.from(bucket).remove([p.imagen_path]);
  }
}
