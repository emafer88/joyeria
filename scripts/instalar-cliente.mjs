// Instalador de una joyería cliente nueva (un proyecto de Supabase por
// cliente). Ver scripts/README-instalador.md.
//
// Uso:
//   node scripts/instalar-cliente.mjs clientes/<cliente>.json
//
// Pasos (se puede volver a correr: lo que ya está hecho no se repite):
//   1) Aplica todas las migraciones (supabase db push --db-url).
//   2) Crea el usuario de acceso del superadmin (Auth).
//   3) Crea la empresa: el trigger insertpordefecto arma superadmin con todos
//      los permisos, sucursal, almacén, caja, métodos de pago, etc.
//   4) Pone el plan y la URL del proyecto en `licencia`.
//   5) Crea las series de comprobantes WEB (tienda) y ML (Mercado Libre).
//   6) Prueba que el superadmin entra y ve lo que corresponde a su plan.
//
// El JSON del cliente tiene la service_role key y la contraseña de la base:
// va en clientes/, que está en .gitignore. Formato en
// scripts/cliente-ejemplo.json.

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const PLANES = ["basico", "tienda", "completo"];

const rutaConfig = process.argv[2];
if (!rutaConfig) {
  console.error("Uso: node scripts/instalar-cliente.mjs clientes/<cliente>.json");
  process.exit(1);
}
const cfg = JSON.parse(readFileSync(rutaConfig, "utf8"));

function exigir(valor, nombre) {
  if (valor === undefined || valor === null || valor === "") {
    console.error(`Falta "${nombre}" en ${rutaConfig}`);
    process.exit(1);
  }
  return valor;
}
const url = exigir(cfg.supabase_url, "supabase_url").replace(/\/$/, "");
const serviceKey = exigir(cfg.service_role_key, "service_role_key");
const anonKey = exigir(cfg.anon_key, "anon_key");
const dbUrl = exigir(cfg.db_url, "db_url");
const plan = exigir(cfg.plan, "plan");
const empresaCfg = exigir(cfg.empresa, "empresa");
const nombreEmpresa = exigir(empresaCfg.nombre, "empresa.nombre");
const correo = exigir(cfg.superadmin?.correo, "superadmin.correo").toLowerCase();
const password = exigir(cfg.superadmin?.password, "superadmin.password");
if (!PLANES.includes(plan)) {
  console.error(`plan debe ser uno de: ${PLANES.join(", ")}`);
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function paso(texto) {
  console.log(`\n== ${texto}`);
}
function fallar(texto, error) {
  console.error(`\nERROR: ${texto}${error ? `\n${error.message ?? error}` : ""}`);
  process.exit(1);
}
async function q(promesa, texto) {
  const { data, error } = await promesa;
  if (error) fallar(texto, error);
  return data;
}

// ---------------------------------------------------------------------------
paso("1) Migraciones");
if (cfg.saltar_migraciones) {
  console.log("saltar_migraciones = true: no se corre db push");
} else {
  // npx por su .js con el mismo node, sin shell: la contraseña de db_url
  // puede traer caracteres que la línea de comandos interpretaría.
  const npxCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
  const r = spawnSync(
    process.execPath,
    [npxCli, "supabase", "db", "push", "--db-url", dbUrl, "--yes"],
    { stdio: "inherit" }
  );
  if (r.status !== 0) fallar("supabase db push falló");
}

// ---------------------------------------------------------------------------
paso("2) Usuario de acceso del superadmin");
let idAuth;
{
  const usuarios = await q(
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    "no se pudo listar usuarios de Auth"
  );
  const existente = usuarios.users.find((u) => u.email?.toLowerCase() === correo);
  if (existente) {
    idAuth = existente.id;
    console.log(`ya existía (${idAuth}); no se cambia su contraseña`);
  } else {
    const creado = await q(
      admin.auth.admin.createUser({ email: correo, password, email_confirm: true }),
      "no se pudo crear el usuario de Auth"
    );
    idAuth = creado.user.id;
    console.log(`creado (${idAuth})`);
  }
}

// ---------------------------------------------------------------------------
paso("3) Empresa");
let empresa;
{
  const empresas = await q(admin.from("empresa").select("id, nombre, id_auth"), "no se pudo leer empresa");
  if (empresas.length > 0) {
    empresa = empresas.find((e) => e.id_auth === idAuth);
    if (!empresa) {
      fallar(
        `la base ya tiene otra empresa (${empresas.map((e) => `${e.id} ${e.nombre}`).join(", ")}): ` +
          "este instalador es para un proyecto nuevo"
      );
    }
    console.log(`ya existía: ${empresa.id} ${empresa.nombre}`);
  } else {
    // Sin columnas de Perú por defecto: valores de México salvo que el JSON
    // diga otra cosa.
    empresa = await q(
      admin
        .from("empresa")
        .insert({
          iso: "MX",
          pais: "Mexico",
          currency: "MXN",
          simbolo_moneda: "$",
          nombre_moneda: "Peso mexicano",
          impuesto: "IVA",
          valor_impuesto: 16,
          ...empresaCfg,
          correo,
          id_auth: idAuth,
        })
        .select("id, nombre")
        .single(),
      "no se pudo crear la empresa"
    );
    console.log(`creada: ${empresa.id} ${empresa.nombre}`);
  }
  // La tienda en línea atiende siempre a la empresa 1 (ecommerce_id_empresa).
  if (empresa.id !== 1) {
    console.warn(`OJO: la empresa quedó con id ${empresa.id}; la tienda en línea espera la 1`);
  }
  if (cfg.superadmin?.nombres) {
    await q(
      admin.from("usuarios").update({ nombres: cfg.superadmin.nombres }).eq("id_auth", idAuth),
      "no se pudo poner el nombre del superadmin"
    );
  }
}

// ---------------------------------------------------------------------------
paso("4) Plan y URL del proyecto");
await q(
  admin.from("licencia").upsert({ id: 1, plan, url_proyecto: url }),
  "no se pudo guardar la licencia"
);
console.log(`plan = ${plan}, url_proyecto = ${url}`);

// ---------------------------------------------------------------------------
paso("5) Series de comprobantes de la tienda y de Mercado Libre");
{
  const sucursal = await q(
    admin.from("sucursales").select("id").eq("id_empresa", empresa.id).order("id").limit(1).single(),
    "no se encontró la sucursal de la empresa"
  );
  const series = [];
  if (plan !== "basico") series.push("WEB");
  if (plan === "completo") series.push("ML");
  // Boleta (tipo 2), como en las migraciones de la base original.
  for (const serie of series) {
    const existe = await q(
      admin
        .from("serializacion_comprobantes")
        .select("id")
        .eq("id_tipo_comprobante", 2)
        .eq("serie", serie)
        .eq("sucursal_id", sucursal.id),
      `no se pudo revisar la serie ${serie}`
    );
    if (existe.length) {
      console.log(`${serie}: ya existía`);
      continue;
    }
    await q(
      admin.from("serializacion_comprobantes").insert({
        id_tipo_comprobante: 2,
        serie,
        cantidad_numeros: 8,
        correlativo: 0,
        sucursal_id: sucursal.id,
        por_default: false,
      }),
      `no se pudo crear la serie ${serie}`
    );
    console.log(`${serie}: creada`);
  }
  if (!series.length) console.log("plan básico: no necesita series extra");
}

// ---------------------------------------------------------------------------
paso("6) Prueba de acceso del superadmin");
{
  const cliente = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: errLogin } = await cliente.auth.signInWithPassword({ email: correo, password });
  if (errLogin) {
    console.warn(`no se pudo entrar con la contraseña del JSON (${errLogin.message}); si el usuario ya existía, es normal`);
  } else {
    const usuario = await q(
      cliente.from("usuarios").select("id, nombres, roles(nombre)").eq("id_auth", idAuth).single(),
      "el superadmin no puede leer su usuario"
    );
    const permisos = await q(
      cliente.from("permisos").select("id").eq("id_usuario", usuario.id),
      "el superadmin no puede leer sus permisos"
    );
    const planVisto = await q(cliente.rpc("licencia_plan"), "no se pudo leer el plan");
    console.log(
      `ok: ${usuario.nombres} (${usuario.roles?.nombre}), ${permisos.length} permisos, plan visto = ${planVisto}`
    );
    if (usuario.roles?.nombre !== "superadmin") fallar("el usuario no quedó como superadmin");
    if (planVisto !== plan) fallar("el plan que ve la app no es el configurado");
    await cliente.auth.signOut();
  }
}

// ---------------------------------------------------------------------------
const ref = new URL(url).hostname.split(".")[0];
console.log(`
Listo. Falta (ver scripts/README-instalador.md):
  * Admin: desplegarlo con VITE_APP_SUPABASE_URL=${url} y la anon key.
  * Auth > URL Configuration: Site URL y Redirect URLs del admin${plan !== "basico" ? " y de la tienda" : ""}.${
  plan !== "basico"
    ? `
  * Tienda (desde joyeria-ecommerce):
      npx supabase functions deploy --project-ref ${ref}
      npx supabase secrets set --project-ref ${ref} MP_ACCESS_TOKEN=... SITE_URL=<url de la tienda>
      códigos postales: node scripts/seed-cp-mexico.mjs ./CPdescarga.txt (con la URL y service key del cliente)`
    : ""
}${
  plan === "completo"
    ? `
  * Mercado Libre (desde joyeria-mercadolibre):
      npx supabase functions deploy --project-ref ${ref}
      npx supabase secrets set --project-ref ${ref} ML_CLIENT_ID=... ML_CLIENT_SECRET=...
      y autorizar la cuenta de ML del cliente (llena ml_cuenta)`
    : ""
}
`);
