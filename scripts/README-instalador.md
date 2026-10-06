# Instalar una joyería cliente

Cada joyería tiene su propio proyecto de Supabase dentro de la organización
Pro. El plan (`basico`, `tienda`, `completo`) vive en la tabla `licencia` del
proyecto y solo se cambia con la service_role key.

## 1. Crear el proyecto

En supabase.com, dentro de la organización: **New project**. Guarda la
contraseña de la base. Región: la misma que el proyecto original.

De **Project Settings** copia:

- **API**: Project URL, `anon` key y `service_role` key.
- **Database > Connection string > Session pooler** (puerto 5432): reemplaza
  `[YOUR-PASSWORD]` por la contraseña. Si la contraseña tiene caracteres
  como `@`, `#`, `%` o `/`, van codificados (`@` → `%40`, etc.).

## 2. Correr el instalador

Desde `proyecto-joyeria`, en `main`:

```
copy scripts\cliente-ejemplo.json clientes\<cliente>.json
(llenar el JSON)
node scripts/instalar-cliente.mjs clientes/<cliente>.json
```

`clientes/` está en `.gitignore`: ahí van las llaves de cada cliente. Guarda
esos JSON también en un lugar seguro fuera de la compu.

El instalador aplica las migraciones, crea el acceso del superadmin, la
empresa (el trigger arma sucursal, caja, métodos de pago y permisos), el plan,
la URL del proyecto y las series de comprobantes WEB/ML, y al final prueba que
el superadmin entra. Se puede volver a correr sin duplicar nada.

## 3. Lo que queda a mano

- **Admin**: desplegarlo con `VITE_APP_SUPABASE_URL` y
  `VITE_APP_SUPABASE_ANON_KEY` del cliente.
- **Auth > URL Configuration** del proyecto: Site URL y Redirect URLs del
  admin (y de la tienda si el plan la incluye).
- **Plan tienda o completo** (desde `joyeria-ecommerce`):
  - `npx supabase functions deploy --project-ref <ref>`
  - `npx supabase secrets set --project-ref <ref> MP_ACCESS_TOKEN=... SITE_URL=...`
    (el access token de Mercado Pago es el de la joyería)
  - Códigos postales: `node scripts/seed-cp-mexico.mjs ./CPdescarga.txt` con
    `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del cliente en el entorno.
- **Plan completo** (desde `joyeria-mercadolibre`):
  - `npx supabase functions deploy --project-ref <ref>`
  - `npx supabase secrets set --project-ref <ref> ML_CLIENT_ID=... ML_CLIENT_SECRET=...`
  - Autorizar la cuenta de Mercado Libre de la joyería (llena `ml_cuenta`).

## Cambiar el plan después

En el SQL Editor del proyecto del cliente:

```sql
update licencia set plan = 'completo';
```

Si sube a tienda o completo, haz también los pasos de la sección 3 que le
falten (funciones, secretos y series: volver a correr el instalador crea las
series que falten).

## Suspender o reactivar una cuenta

```
node scripts/suspender-cliente.mjs clientes/<cliente>.json --mensaje "Tu pago de octubre está pendiente."
node scripts/suspender-cliente.mjs clientes/<cliente>.json --reactivar
```

Suspendida: el admin muestra "Cuenta suspendida" con el mensaje, la base no
deja leer ni escribir al personal, la tienda muestra "Tienda no disponible" y
no cobra, y no corren los crons. Los datos no se tocan; al reactivar todo
vuelve como estaba (el admin lo nota en máximo 5 minutos, o al recargar).

## Actualizar a todos los clientes

Cuando hay una migración nueva:

1. Aplicarla primero en tu joyería, como siempre (`npx supabase db push`) y
   copiarla a `joyeria-ecommerce`.
2. Ver qué le falta a cada cliente (no cambia nada):
   `node scripts/actualizar-clientes.mjs --ver`
3. Aplicarla a todos: `node scripts/actualizar-clientes.mjs`
   (o solo a algunos: `node scripts/actualizar-clientes.mjs clientes/a.json`).

Si un cliente falla, el script sigue con los demás y al final muestra el
error de cada uno. Un JSON con `"actualizar": false` se salta (el de prueba
local, o un cliente dado de baja).

Ojo al escribir migraciones: tienen que funcionar también en la base de un
cliente, que no tiene los datos de tu joyería. Nada de ids fijos de usuarios,
sucursales, ventas, etc. sin un `WHERE EXISTS` que lo proteja.

## Probar el instalador en local

Con Docker Desktop abierto: `npx supabase start` (aplica todas las
migraciones en una base vacía) y luego el instalador con un JSON que apunte
a `http://127.0.0.1:54321` y `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
(las llaves las muestra `npx supabase status`). `npx supabase stop` al terminar.
