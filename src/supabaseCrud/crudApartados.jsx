import { supabase } from "./supabase.config";

async function rpc(nombre, params) {
  const { data, error } = await supabase.rpc(nombre, params);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Convierte la venta del carrito en apartado y cobra el anticipo.
export async function CrearApartado(p) {
  const data = await rpc("crear_apartado", {
    _id_venta: p.id_venta,
    _id_cliente: p.id_cliente,
    _anticipo: p.anticipo,
    _id_metodo_pago: p.id_metodo_pago,
    _fecha: p.fecha,
  });
  return data?.[0];
}

// Si el abono cubre el saldo, la venta queda liquidada (estado confirmada).
export async function AbonarApartado(p) {
  const data = await rpc("abonar_apartado", {
    _id_venta: p.id_venta,
    _monto: p.monto,
    _id_metodo_pago: p.id_metodo_pago,
    _id_cierre_caja: p.id_cierre_caja,
    _fecha: p.fecha,
  });
  return data?.[0];
}

// Devuelve "ok", "clave_incorrecta" o "bloqueado".
export const CancelarApartado = (p) =>
  rpc("cancelar_apartado", {
    _id_venta: p.id_venta,
    _motivo: p.motivo,
    _clave: p.clave,
    _devolver: p.devolver,
    _id_cierre_caja: p.id_cierre_caja,
  });

// Apartados activos con sus pagos, para calcular abonado y saldo.
export async function MostrarApartados() {
  const { data, error } = await supabase
    .from("ventas")
    .select(
      `id, nro_comprobante, fecha, monto_total, sub_total, total_impuestos,
      apartado_creado, apartado_vence,
      cliente:clientes_proveedores(nombres, direccion, identificador_fiscal, telefono),
      pagos:movimientos_caja(tipo_movimiento, monto, vuelto, fecha_movimiento, metodos_pago(nombre))`
    )
    .eq("estado", "apartada")
    .order("apartado_vence", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((a) => {
    const abonado = abonadoDe(a.pagos);
    return { ...a, abonado, saldo: Math.round((a.monto_total - abonado) * 100) / 100 };
  });
}

// Mismo cálculo que apartado_abonado() en la base.
export function abonadoDe(pagos) {
  const total = (pagos ?? []).reduce((s, p) => {
    if (p.tipo_movimiento === "salida") return s - Number(p.monto);
    const vuelto = p.metodos_pago?.nombre === "Efectivo" ? Number(p.vuelto) || 0 : 0;
    return s + Number(p.monto) - vuelto;
  }, 0);
  return Math.round(total * 100) / 100;
}
