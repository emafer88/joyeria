-- ============================================================================
-- ROLLBACK de sql/2026-08-27_familias_variantes_peso.sql
-- ============================================================================
-- Se decidió no seguir con la funcionalidad de familias/variantes por peso.
-- Este script deshace exactamente lo que aplicó el script original:
--   - Borra la columna peso, la columna id_producto_padre (con su FK y su
--     índice único, que se van solos al borrar la columna) de productos.
--   - Restaura insertarproductos / editarproductos / mostrarproductos /
--     buscarproductos / buscarproductoslectora a como estaban antes (mismo
--     cuerpo que ya tenían, sin los parámetros/columnas de peso).
--
-- Ojo: si llegaste a cargar productos de prueba (la familia "Cadena de
-- plata..." y sus variantes) durante las pruebas, esto NO los borra —
-- se van a quedar como productos sueltos normales (pierden el peso y el
-- vínculo a la familia porque esas columnas dejan de existir). Si querés
-- limpiarlos también, hacelo a mano desde la pantalla de Productos antes o
-- después de correr esto.
--
-- Cómo aplicar: pegar en el SQL Editor de Supabase y ejecutar. Seguro de
-- re-ejecutar (usa IF EXISTS / CREATE OR REPLACE).
-- ============================================================================

-- 1) Sacar las columnas nuevas de productos (esto ya se lleva puestos, solo,
--    el índice único productos_padre_peso_unique y la FK
--    productos_id_producto_padre_fkey, que dependen de estas columnas).
ALTER TABLE public.productos
  DROP COLUMN IF EXISTS peso,
  DROP COLUMN IF EXISTS id_producto_padre;

-- 2) Restaurar insertarproductos a su firma y cuerpo original (10 args).
DROP FUNCTION IF EXISTS public.insertarproductos(text, numeric, numeric, integer, text, text, integer, text, boolean, boolean, numeric, integer);
CREATE OR REPLACE FUNCTION public.insertarproductos(_nombre text, _precio_venta numeric, _precio_compra numeric, _id_categoria integer, _codigo_barras text, _codigo_interno text, _id_empresa integer, _sevende_por text, _maneja_inventarios boolean, _maneja_multiprecios boolean) RETURNS integer
    LANGUAGE plpgsql
    AS $$
declare nuevo_id int;
begin
 perform 1 from productos where nombre=_nombre and id_empresa=_id_empresa;
 if found then
   raise exception 'Nombre de producto duplicado';
 else
    perform 1 from productos where codigo_interno=_codigo_interno or
    codigo_barras=_codigo_barras
     and id_empresa=_id_empresa ;
    if found then
     raise exception 'Codigo de barra ó interno duplicado';
    else
     insert into productos(nombre,precio_venta,precio_compra,id_categoria,codigo_barras,codigo_interno,id_empresa,sevende_por,maneja_inventarios,maneja_multiprecios)
     values(_nombre,_precio_venta,_precio_compra,_id_categoria,_codigo_barras,_codigo_interno,_id_empresa,_sevende_por,_maneja_inventarios,_maneja_multiprecios)
     returning id into nuevo_id;
     return nuevo_id;
     end if;
  end if;
end;
$$;

-- 3) Restaurar editarproductos a su firma y cuerpo original (10 args).
DROP FUNCTION IF EXISTS public.editarproductos(integer, text, numeric, numeric, integer, text, text, integer, text, boolean, numeric, integer);
CREATE OR REPLACE FUNCTION public.editarproductos(_id integer, _nombre text, _precio_venta numeric, _precio_compra numeric, _id_categoria integer, _codigo_barras text, _codigo_interno text, _id_empresa integer, _sevende_por text, _maneja_inventarios boolean) RETURNS void
    LANGUAGE plpgsql
    AS $$
begin
 perform 1 from productos where nombre=_nombre and id_empresa=_id_empresa and id!=_id;
 if found then
   raise exception 'Nombre de producto duplicado';
 else
    perform 1 from productos where (codigo_interno=_codigo_interno and id_empresa=_id_empresa and id!=_id) or
    (codigo_barras=_codigo_barras
     and id_empresa=_id_empresa and id!=_id);
    if found then
     raise exception 'Codigo de barra ó interno duplicado';
    else
     update  productos set nombre=_nombre,precio_venta=_precio_venta,precio_compra=_precio_compra,id_categoria=_id_categoria,codigo_barras=_codigo_barras,codigo_interno=_codigo_interno,sevende_por=_sevende_por,maneja_inventarios=_maneja_inventarios
     where id=_id;
     end if;
  end if;
end;
$$;

-- 4) Restaurar mostrarproductos / buscarproductos / buscarproductoslectora
--    a su RETURNS TABLE y cuerpo original (sin peso / id_producto_padre).
DROP FUNCTION IF EXISTS public.mostrarproductos(integer);
CREATE OR REPLACE FUNCTION public.mostrarproductos(_id_empresa integer) RETURNS TABLE(id integer, nombre text, precio_venta numeric, precio_compra numeric, id_categoria integer, sevende_por text, codigo_barras text, codigo_interno text, id_empresa integer, maneja_inventarios boolean, maneja_multiprecios boolean, p_venta text, p_compra text, categoria text)
    LANGUAGE sql
    AS $$
select p.id,
 p.nombre,p.precio_venta,p.precio_compra,p.id_categoria,p.sevende_por,p.codigo_barras,p.codigo_interno,p.id_empresa,p.maneja_inventarios,p.maneja_multiprecios,concat(e.simbolo_moneda,' ', p.precio_venta) as p_venta,concat(e.simbolo_moneda,' ', p.precio_compra) as p_compra,c.nombre as categoria
  from productos as p inner join empresa as e on e.id=p.id_empresa
  inner join categorias as c on c.id=p.id_categoria
  where p.id_empresa=_id_empresa;
$$;

DROP FUNCTION IF EXISTS public.buscarproductos(integer, text);
CREATE OR REPLACE FUNCTION public.buscarproductos(_id_empresa integer, buscador text) RETURNS TABLE(id integer, nombre text, precio_venta numeric, precio_compra numeric, id_categoria integer, sevende_por text, codigo_barras text, codigo_interno text, id_empresa integer, maneja_inventarios boolean, maneja_multiprecios boolean, p_venta text, p_compra text, categoria text)
    LANGUAGE sql
    AS $$
select p.id,
 p.nombre,p.precio_venta,p.precio_compra,p.id_categoria,p.sevende_por,p.codigo_barras,p.codigo_interno,p.id_empresa,p.maneja_inventarios,p.maneja_multiprecios,concat(e.simbolo_moneda,' ', p.precio_venta) as p_venta,concat(e.simbolo_moneda,' ', p.precio_compra) as p_compra,c.nombre as categoria
  from productos as p inner join empresa as e on e.id=p.id_empresa
  inner join categorias as c on c.id=p.id_categoria
  where (LOWER(p.nombre) LIKE '%' || LOWER(buscador) || '%'
    OR LOWER(p.codigo_barras) LIKE '%' || LOWER(buscador) || '%'
    OR LOWER(p.codigo_interno) LIKE '%' || LOWER(buscador) || '%')
    AND p.id_empresa = _id_empresa
    ORDER BY p.nombre ASC
    LIMIT 10;
$$;

DROP FUNCTION IF EXISTS public.buscarproductoslectora(integer, text);
CREATE OR REPLACE FUNCTION public.buscarproductoslectora(_id_empresa integer, buscador text) RETURNS TABLE(id integer, nombre text, precio_venta numeric, precio_compra numeric, id_categoria integer, sevende_por text, codigo_barras text, codigo_interno text, id_empresa integer, maneja_inventarios boolean, maneja_multiprecios boolean, p_venta text, p_compra text, categoria text)
    LANGUAGE sql
    AS $$
select p.id,
 p.nombre,p.precio_venta,p.precio_compra,p.id_categoria,p.sevende_por,p.codigo_barras,p.codigo_interno,p.id_empresa,p.maneja_inventarios,p.maneja_multiprecios,concat(e.simbolo_moneda,' ', p.precio_venta) as p_venta,concat(e.simbolo_moneda,' ', p.precio_compra) as p_compra,c.nombre as categoria
  from productos as p inner join empresa as e on e.id=p.id_empresa
  inner join categorias as c on c.id=p.id_categoria
  where
    ( LOWER(p.codigo_barras) = LOWER(buscador)
    OR LOWER(p.codigo_interno) = LOWER(buscador))
    AND p.id_empresa = _id_empresa;
$$;

-- ============================================================================
-- Verificación rápida después de aplicar:
--
-- 1) select column_name from information_schema.columns
--    where table_name='productos' and column_name in ('peso','id_producto_padre');
--    -> no debe devolver ninguna fila
--
-- 2) select indexname from pg_indexes
--    where tablename='productos' and indexname='productos_padre_peso_unique';
--    -> no debe devolver ninguna fila
--
-- 3) select proname, pronargs from pg_proc
--    where proname in ('insertarproductos','editarproductos') order by 1;
--    -> insertarproductos debe volver a tener 10 argumentos, editarproductos 10
--
-- 4) Probar en la app: dar de alta un producto normal como antes, tiene que
--    funcionar igual que antes de todo este cambio.
-- ============================================================================
