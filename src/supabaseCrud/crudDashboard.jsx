import { supabase } from "./supabase.config";

// { num_ventas, total, ticket_promedio, metodos: [{metodo, total}],
//   canales: [{canal, ventas, total}] } de las ventas cobradas del rango.
export async function DesgloseVentasDashboard(p) {
  const { data, error } = await supabase.rpc("dashboard_desglose_ventas", p);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Detalle de las tarjetas del dashboard: una fila por venta cobrada del rango.
export async function DetalleVentasDashboard(p) {
  const { data, error } = await supabase.rpc("dashboard_detalle_ventas", p);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Una fila por producto vendido en el rango (ganancia null sin "Ver costos").
export async function DetalleProductosDashboard(p) {
  const { data, error } = await supabase.rpc("dashboard_detalle_productos", p);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Ventas cobradas por día de la semana (1 = lunes) y hora local, para el mapa
// de calor: [{ dia, hora, ventas, total }].
export async function VentasPorHoraDashboard(p) {
  const { data, error } = await supabase.rpc("dashboard_ventas_por_hora", p);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Pestaña Joyería: piezas vendidas en el rango por material y pureza.
export async function JoyeriaVentasDashboard(p) {
  const { data, error } = await supabase.rpc("dashboard_joyeria_ventas", p);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Pestaña Joyería: piezas disponibles hoy por material y pureza.
export async function JoyeriaInventarioDashboard(p) {
  const { data, error } = await supabase.rpc("dashboard_joyeria_inventario", p);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Alertas de inventario al día de hoy: agotados, bajo el mínimo y sin
// movimiento en los últimos _dias_sin_movimiento días.
export async function AlertasInventarioDashboard(p) {
  const { data, error } = await supabase.rpc("dashboard_alertas_inventario", p);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Ventas cobradas que se cancelaron en el rango (fecha de cancelación en la
// zona horaria _zona).
export async function CancelacionesDashboard(p) {
  const { data, error } = await supabase.rpc("dashboard_cancelaciones", p);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
