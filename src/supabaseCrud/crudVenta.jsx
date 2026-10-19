import Swal from "sweetalert2";
import { supabase } from "../index";
const tabla = "ventas";
export async function InsertarVentas(p) {
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


export async function EliminarVentasIncompletas(p) {
  const { error } = await supabase
    .from(tabla)
    .delete()
    .eq("estado", "pendiente")
    .eq("id_usuario", p.id_usuario)
    .eq("id_cierre_caja", p.id_cierre_caja);
  if (error) {
    throw new Error(error.message);
  }
}
export async function EliminarVenta(p) {
  const { error } = await supabase
    .from(tabla)
    .delete()
    .eq("id", p.id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function MostrarVentasXsucursal(p) {
  const { data } = await supabase
    .from(tabla)
    .select()
    .eq("id_sucursal", p.id_sucursal)
    .eq("estado", "nueva")
    .maybeSingle();

  return data;
}
export async function ConfirmarVenta(p) {
  const { data, error } = await supabase
    .from(tabla)
    .update(p)
    .eq("id", p.id)
    .select();
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Ventas cobradas (y canceladas) del turno de caja abierto, para el panel
// "Ventas del turno" del POS.
export async function MostrarVentasTurno(p) {
  const { data, error } = await supabase
    .from(tabla)
    .select(
      `id, nro_comprobante, fecha, monto_total, sub_total, total_impuestos,
      vuelto, estado, motivo_anulacion, anulada_en,
      cajero:usuarios!ventas_id_usuario_fkey(nombres),
      cliente:clientes_proveedores(nombres, direccion, identificador_fiscal),
      pagos:movimientos_caja(tipo_movimiento, monto, vuelto, metodos_pago(nombre))`
    )
    .eq("id_cierre_caja", p.id_cierre_caja)
    .in("estado", ["confirmada", "anulada"])
    .order("id", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Nombre del comprobante (Ticket, Boleta…) según la serie del número.
export async function MostrarNombresComprobante(p) {
  const { data, error } = await supabase
    .from("serializacion_comprobantes")
    .select("serie, tipo_comprobantes(nombre)")
    .eq("sucursal_id", p.id_sucursal);
  if (error) {
    throw new Error(error.message);
  }
  return Object.fromEntries(
    (data ?? []).map((s) => [s.serie, s.tipo_comprobantes?.nombre])
  );
}

// Devuelve "ok", "clave_incorrecta" o "bloqueado".
export async function AnularVenta(p) {
  const { data, error } = await supabase.rpc("anular_venta", {
    _id_venta: p.id_venta,
    _motivo: p.motivo,
    _clave: p.clave,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Clave numérica con la que un gerente autoriza cancelaciones. Solo la del
// usuario actual; null si todavía no tiene.
export async function MiClaveAutorizacion() {
  const { data, error } = await supabase.rpc("mi_clave_autorizacion");
  if (error) {
    throw new Error(error.message);
  }
  return data ?? null;
}

export async function GuardarClaveAutorizacion(p) {
  const { error } = await supabase.rpc("guardar_clave_autorizacion", {
    _clave: p.clave,
  });
  if (error) {
    throw new Error(error.message);
  }
}
