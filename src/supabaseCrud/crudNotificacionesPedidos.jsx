import { supabase } from "../index";

export async function MostrarNotificacionesPedidos() {
  const { data, error } = await supabase.rpc("admin_listar_notificaciones_pedidos");
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function MarcarNotificacionLeida(idVenta) {
  const { error } = await supabase.rpc("admin_marcar_notificacion_leida", {
    _id_venta: idVenta,
  });
  if (error) {
    throw new Error(error.message);
  }
}
