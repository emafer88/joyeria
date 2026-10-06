import { supabase } from "../index";

// Plan contratado por esta joyería: 'basico' | 'tienda' | 'completo'.
// Lo cambia solo el dueño del sistema (tabla `licencia`).
export async function MostrarPlanLicencia() {
  const { data, error } = await supabase.rpc("licencia_plan");
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
