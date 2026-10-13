// Panel de Mercado Libre. Todo por RPC ml_admin_* (SECURITY DEFINER): las
// tablas ml_* son solo service_role, y cada RPC verifica que quien llama sea
// personal del admin y no un cliente del ecommerce (mismo Supabase Auth).
import { supabase } from "../index";

async function rpc(nombre, params) {
  const { data, error } = await supabase.rpc(nombre, params);
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

// Abre el login de ML para conectar la cuenta (Edge Function ml-oauth). Al
// terminar, ML/ml-oauth regresan a esta misma página con ?ml=conectado|error.
export async function ConectarCuentaML() {
  const volverA = window.location.origin + window.location.pathname;
  const state = await rpc("ml_admin_iniciar_conexion", { _volver_a: volverA });
  const base = import.meta.env.VITE_APP_SUPABASE_URL.replace(/\/$/, "");
  window.location.assign(`${base}/functions/v1/ml-oauth?iniciar=${state}`);
}

export async function MostrarCuentaML() {
  const data = await rpc("ml_admin_cuenta");
  return data?.[0] ?? null;
}

export const MostrarDisenosML = () => rpc("ml_admin_listar_disenos");

export const MostrarDisenosSinConfigurarML = () => rpc("ml_admin_disenos_sin_configurar");

export const MostrarPublicacionesML = () => rpc("ml_admin_listar_publicaciones");

export const MostrarOrdenesML = () => rpc("ml_admin_listar_ordenes");

export async function GuardarDisenoML(p) {
  await rpc("ml_admin_guardar_diseno", {
    _id_producto: p.id_producto,
    _publicar: p.publicar,
    _ml_category_id: p.ml_category_id,
    _atributos: p.atributos,
  });
}

export async function SincronizarML() {
  await rpc("ml_admin_sincronizar");
}

export const PrevisualizarDisenoML = (idProducto) =>
  rpc("ml_admin_previsualizar", { _id_producto: idProducto });
