import { supabase } from "../index";

// Plan contratado ('basico' | 'tienda' | 'completo') y si la cuenta está
// suspendida. Lo cambia solo el dueño del sistema (tabla `licencia`).
export async function MostrarEstadoLicencia() {
  const { data, error } = await supabase.rpc("licencia_estado");
  if (error) {
    throw new Error(error.message);
  }
  return data;
}
