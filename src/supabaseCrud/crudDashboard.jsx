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
