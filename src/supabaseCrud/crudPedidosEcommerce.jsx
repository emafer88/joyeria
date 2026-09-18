// Pedidos del ecommerce (no del POS presencial). RPC en vez de select()
// directo porque ecommerce_orden_envio tiene RLS user_id = auth.uid() — el
// staff no es el comprador, necesita las funciones admin_* (SECURITY DEFINER).
import { supabase } from "../index";

export async function MostrarPedidosEcommerce() {
  const { data, error } = await supabase.rpc("admin_listar_pedidos_ecommerce");
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function MostrarDetallePedidoEcommerce(idVenta) {
  const { data, error } = await supabase.rpc("admin_detalle_pedido_ecommerce", {
    _id_venta: idVenta,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data?.[0] ?? null;
}

export async function ActualizarEstadoEnvio(p) {
  const { error } = await supabase.rpc("admin_actualizar_estado_envio", {
    _id_venta: p.id,
    _estado_envio: p.estado_envio,
  });
  if (error) {
    throw new Error(error.message);
  }
}
