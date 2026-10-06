// Aplica las migraciones nuevas a todas las joyerías cliente (los JSON de
// clientes/, los mismos del instalador). Ver scripts/README-instalador.md.
//
// Uso:
//   node scripts/actualizar-clientes.mjs                  aplica a todos
//   node scripts/actualizar-clientes.mjs --ver            solo muestra qué falta (no cambia nada)
//   node scripts/actualizar-clientes.mjs clientes/a.json  solo esos clientes
//
// Un cliente con "actualizar": false en su JSON se salta (por ejemplo, el de
// prueba local). Si uno falla se sigue con los demás, y al final hay un
// resumen; el proceso termina con error si alguno falló.
//
// Tu joyería (el proyecto original) no está en clientes/: se sigue
// actualizando como siempre, con `npx supabase db push`.

import { readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, join } from "node:path";

const args = process.argv.slice(2);
const soloVer = args.includes("--ver");
let archivos = args.filter((a) => !a.startsWith("--"));
if (!archivos.length) {
  const carpeta = new URL("../clientes/", import.meta.url);
  archivos = readdirSync(carpeta)
    .filter((f) => f.endsWith(".json"))
    .map((f) => join("clientes", f));
}
if (!archivos.length) {
  console.log("No hay clientes en clientes/");
  process.exit(0);
}

// npx por su .js con el mismo node, sin shell: la contraseña de db_url
// puede traer caracteres que la línea de comandos interpretaría.
const npxCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");

function dbPush(dbUrl) {
  const r = spawnSync(
    process.execPath,
    [npxCli, "supabase", "db", "push", "--db-url", dbUrl, "--yes", ...(soloVer ? ["--dry-run"] : [])],
    { encoding: "utf8" }
  );
  // La CLI deja un JSON con { upToDate, migrations, message } en stdout.
  const linea = r.stdout
    ?.split(/\r?\n/)
    .reverse()
    .find((l) => l.trim().startsWith("{") && l.includes('"migrations"'));
  let resultado = null;
  try {
    resultado = linea ? JSON.parse(linea) : null;
  } catch {
    resultado = null;
  }
  return { ok: r.status === 0 && !!resultado, resultado, salida: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

function explicarError(salida) {
  // El error de la CLI viene como JSON {"_tag":"Error","error":{"message":...}}.
  const m = salida.match(/"message":"((?:[^"\\]|\\.)*)"/);
  const texto = m ? JSON.parse(`"${m[1]}"`) : salida.trim().split(/\r?\n/).slice(-3).join("\n");
  // Nunca mostrar la contraseña de la base.
  return texto.replace(/postgres(ql)?:\/\/[^\s"]+/g, "postgresql://***");
}

console.log(soloVer ? "Revisando (no se cambia nada)...\n" : "Aplicando migraciones...\n");

const resumen = [];
for (const archivo of archivos) {
  const nombre = basename(archivo, ".json");
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(archivo, "utf8"));
  } catch (e) {
    resumen.push({ nombre, estado: "ERROR", detalle: `no se pudo leer ${archivo}: ${e.message}` });
    continue;
  }
  if (cfg.actualizar === false) {
    resumen.push({ nombre, estado: "omitido", detalle: '"actualizar": false' });
    continue;
  }
  if (!cfg.db_url) {
    resumen.push({ nombre, estado: "ERROR", detalle: "el JSON no tiene db_url" });
    continue;
  }

  process.stdout.write(`- ${nombre}... `);
  const { ok, resultado, salida } = dbPush(cfg.db_url);
  if (!ok) {
    console.log("ERROR");
    resumen.push({ nombre, estado: "ERROR", detalle: explicarError(salida) });
    continue;
  }
  const migraciones = resultado.migrations ?? [];
  if (!migraciones.length) {
    console.log("al día");
    resumen.push({ nombre, estado: "al día", detalle: "" });
  } else {
    console.log(soloVer ? `le faltan ${migraciones.length}` : `${migraciones.length} aplicadas`);
    resumen.push({
      nombre,
      estado: soloVer ? "pendiente" : "actualizado",
      detalle: migraciones.join(", "),
    });
  }
}

console.log("\nResumen:");
for (const r of resumen) {
  console.log(`  ${r.nombre}: ${r.estado}${r.detalle ? ` (${r.detalle})` : ""}`);
}
const fallidos = resumen.filter((r) => r.estado === "ERROR");
if (fallidos.length) {
  console.log(`\n${fallidos.length} con error: revisa el detalle arriba y vuelve a correrlo solo para ellos.`);
  process.exit(1);
}
