// Suspende o reactiva la cuenta de una joyería cliente (tabla licencia).
// Ver scripts/README-instalador.md.
//
// Uso:
//   node scripts/suspender-cliente.mjs clientes/<cliente>.json
//   node scripts/suspender-cliente.mjs clientes/<cliente>.json --mensaje "Tu pago de octubre está pendiente."
//   node scripts/suspender-cliente.mjs clientes/<cliente>.json --reactivar
//
// Suspendida: el admin muestra "Cuenta suspendida", la base no deja leer ni
// escribir al personal, la tienda muestra "Tienda no disponible" y no cobra,
// y no corren los crons. Los datos no se tocan.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const rutaConfig = args.find((a) => !a.startsWith("--"));
if (!rutaConfig) {
  console.error('Uso: node scripts/suspender-cliente.mjs clientes/<cliente>.json [--reactivar] [--mensaje "..."]');
  process.exit(1);
}
const reactivar = args.includes("--reactivar");
const iMensaje = args.indexOf("--mensaje");
const mensaje = iMensaje >= 0 ? args[iMensaje + 1] : null;

const cfg = JSON.parse(readFileSync(rutaConfig, "utf8"));
if (!cfg.supabase_url || !cfg.service_role_key) {
  console.error(`Faltan supabase_url o service_role_key en ${rutaConfig}`);
  process.exit(1);
}
const admin = createClient(cfg.supabase_url, cfg.service_role_key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const cambios = reactivar
  ? { suspendida: false, mensaje_suspension: null }
  : { suspendida: true, mensaje_suspension: mensaje };

const { data, error } = await admin
  .from("licencia")
  .update(cambios)
  .eq("id", 1)
  .select("plan, suspendida, mensaje_suspension")
  .single();
if (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}
const nombre = cfg.empresa?.nombre ?? rutaConfig;
console.log(
  data.suspendida
    ? `${nombre}: SUSPENDIDA${data.mensaje_suspension ? ` ("${data.mensaje_suspension}")` : ""}`
    : `${nombre}: activa (plan ${data.plan})`
);
