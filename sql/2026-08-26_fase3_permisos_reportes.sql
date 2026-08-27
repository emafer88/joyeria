-- ============================================================================
-- Fase 3: activar el bloqueo real de permisos (ProtectedRoute) sin dejar a
-- nadie afuera por accidente.
-- ============================================================================
-- Al revisar por qué asignar/quitar permisos no tenía efecto, encontramos
-- que el bloqueo de rutas estaba directamente comentado en el código
-- (arreglado en el frontend). Pero antes de reactivarlo hacía falta esto:
-- la tabla "modulos" no tenía ninguna fila para la ruta /reportes. Sin este
-- módulo, activar el bloqueo hubiera dejado esa sección inaccesible para
-- TODOS, incluido el superadmin, porque nunca iba a existir un permiso que
-- calzara con esa ruta.
--
-- Este script:
--   1) Crea el módulo faltante para /reportes.
--   2) Le da ese permiso a todos los superadmin que ya existen hoy (los que
--      se creen de acá en adelante lo reciben solos, vía el trigger
--      insertpordefecto que ya corre al dar de alta una empresa nueva).
--
-- Nota sobre los intentos anteriores: el generador automático de ids de
-- "modulos" está desincronizado con los datos reales (la carga inicial puso
-- ids a mano). En vez de depender de ese generador, acá calculamos el
-- próximo id directamente a partir del máximo real de la tabla en el
-- momento de insertar, así no importa en qué estado esté el contador.
--
-- Cómo aplicar: pegar en el SQL Editor de Supabase y ejecutar. Seguro de
-- re-ejecutar (usa WHERE NOT EXISTS / verifica antes de insertar).
-- ============================================================================

-- 1) Módulo para /reportes (si todavía no existe). El id se calcula como
--    MAX(id)+1 en el momento, sin depender del generador automático.
INSERT INTO modulos (id, nombre, "check", descripcion, icono, link, etiquetas)
SELECT
  (SELECT COALESCE(MAX(id), 0) + 1 FROM modulos),
  'Reportes', false, '-', '-', '/reportes', '#operacion'
WHERE NOT EXISTS (
  SELECT 1 FROM modulos WHERE link = '/reportes'
);

-- 2) Backfill: dárselo a los superadmin que ya existen y todavía no lo tienen.
--    Mismo criterio para el id: MAX(id) + un correlativo por cada fila nueva.
INSERT INTO permisos (id, id_usuario, idmodulo)
SELECT
  (SELECT COALESCE(MAX(id), 0) FROM permisos) + ROW_NUMBER() OVER (),
  u.id,
  m.id
FROM usuarios u
JOIN roles r ON r.id = u.id_rol AND r.nombre = 'superadmin'
JOIN modulos m ON m.link = '/reportes'
WHERE NOT EXISTS (
  SELECT 1 FROM permisos p WHERE p.id_usuario = u.id AND p.idmodulo = m.id
);

-- 3) Ahora sí, sincronizar los generadores automáticos de ids con el estado
--    real que quedó, para que las próximas inserciones normales de la app
--    (que sí usan el generador) no vuelvan a chocar.
SELECT setval('modulos_id_seq', (SELECT MAX(id) FROM modulos), true);
SELECT setval('permisos_id_seq', (SELECT MAX(id) FROM permisos), true);

-- ============================================================================
-- Verificación rápida después de aplicar:
--
-- 1) select * from modulos where link = '/reportes';  -> debe existir 1 fila
-- 2) select p.* from permisos p
--    join usuarios u on u.id = p.id_usuario
--    join roles r on r.id = u.id_rol and r.nombre = 'superadmin'
--    join modulos m on m.id = p.idmodulo and m.link = '/reportes';
--    -> debe haber una fila por cada superadmin existente
-- ============================================================================
