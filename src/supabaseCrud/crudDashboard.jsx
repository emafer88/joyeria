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
