import Swal from "sweetalert2";
import { supabase } from "../index";
import { EliminarPermisos, InsertarPermisos } from "./crudPermisos";
import { usePermisosStore } from "../store/PermisosStore";
const tabla = "usuarios";
export async function MostrarUsuarios(p) {
  const { data, error } = await supabase
    .from(tabla)
    .select(`*, roles(*)`)
    .eq("id_auth", p.id_auth)
    .maybeSingle();
  if (error) {
    return;
  }
  return data;
}
export async function InsertarAdmin(p) {
  const { error } = await supabase.from(tabla).insert(p);
  if (error) {
    throw new Error(error.message);
  }
}
export async function InsertarUsuarios(p) {
  const { error, data } = await supabase
    .from(tabla)
    .insert(p)
    .select()
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function InsertarCredencialesUser(p) {
  const { data, error } = await supabase.rpc("crearcredencialesuser", p);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
export async function ObtenerIdAuthSupabase() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session != null) {
    const { user } = session;
    const idauth = user.id;
    return idauth;
  }
}
export async function EliminarUsuarioAsignado(p) {
  const { error } = await supabase.from(tabla).delete().eq("id", p.id);
  if (error) {
    throw new Error(error.message);
  }
}
// Edita datos del usuario Y resincroniza sus permisos según los módulos
// seleccionados en PermisosStore. Úsala SOLO desde pantallas que gestionan
// permisos (ej. RegistrarUsuarios + PermisosUser). Para editar solo datos
// del perfil (nombre, teléfono, tema, etc.) usa EditarPerfilUsuario.
export async function EditarUsuarios(p) {
  const selectModules = usePermisosStore.getState().selectedModules || [];
  const id_usuario = p.id;
  if (!Array.isArray(selectModules) || selectModules.length === 0) {
    throw new Error("No hay módulos seleccionados");
  }

  const { error } = await supabase.from(tabla).update(p).eq("id", p.id);
  if (error) {
    throw new Error(error.message);
  }

  await EliminarPermisos({ id_usuario });
  selectModules.forEach(async (idModule) => {
    let pp = {
      id_usuario: id_usuario,
      idmodulo: idModule,
    };
    await InsertarPermisos(pp);
  });
}

// Edita únicamente datos del usuario (perfil, tema, etc.) sin tocar
// sus permisos. Esta es la que debe usarse fuera de la gestión de permisos.
export async function EditarPerfilUsuario(p) {
  const { error } = await supabase.from(tabla).update(p).eq("id", p.id);
  if (error) {
    throw new Error(error.message);
  }
}