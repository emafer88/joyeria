-- ============================================================================
-- Familias de producto con variantes por peso (joyería vendida por gramos).
-- ============================================================================
-- Contexto: para productos como cadenas de plata, el mismo diseño puede
-- tener varias variantes según cuánto pese cada pieza, cada una con su
-- propio precio y código de barras/interno. Hasta ahora "productos" es
-- plana: cada fila es un SKU suelto, sin forma de decir "esta cadena de 1gr
-- del modelo torzal ya tiene código X, reusalo" en vez de generar uno nuevo
-- cada vez que se carga otra cadena del mismo peso y diseño.
--
-- La tabla "multiprecios" (id_producto, precio_venta, cantidad) ya existe
-- pero está sin usar en el frontend y no tiene columnas de código, así que
-- no cubre el caso. Se decidió no reciclarla: en cambio, se agrega el
-- concepto de "familia" (producto padre) + "variantes por peso" sobre la
-- misma tabla productos, para que cada variante siga siendo un producto
-- normal con su propio stock/kardex/imágenes (esas tablas tienen FK a
-- productos.id, así que esto evita un refactor mucho más grande).
--
-- Modelo:
--   - Una fila "familia" representa un diseño concreto (ej. "Cadena de
--     plata modelo torzal"). Se marca con maneja_multiprecios = true y
--     id_producto_padre IS NULL. Se reutiliza esa columna existente, que
--     hoy no se usa desde el frontend.
--   - Una fila "variante" es un producto común y corriente (propio precio,
--     código, stock) que además tiene id_producto_padre apuntando a su
--     familia y peso seteado.
--   - El índice único (id_producto_padre, peso) impide cargar dos códigos
--     distintos para el mismo peso dentro de la misma familia — es a
--     propósito por familia y no global, porque dos diseños distintos
--     pueden tener una variante del mismo peso sin problema.
--
-- Cómo aplicar: pegar en el SQL Editor de Supabase y ejecutar. Seguro de
-- re-ejecutar (usa IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================================

-- 1) Columnas nuevas en productos.
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS peso numeric NULL,
  ADD COLUMN IF NOT EXISTS id_producto_padre bigint NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'productos_id_producto_padre_fkey'
  ) THEN
    ALTER TABLE public.productos
      ADD CONSTRAINT productos_id_producto_padre_fkey
      FOREIGN KEY (id_producto_padre) REFERENCES public.productos(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2) No duplicar código para el mismo peso dentro de la misma familia.
CREATE UNIQUE INDEX IF NOT EXISTS productos_padre_peso_unique
  ON public.productos (id_producto_padre, peso)
  WHERE id_producto_padre IS NOT NULL;

-- 3) insertarproductos: agrega _peso / _id_producto_padre al final,
--    ambos opcionales (DEFAULT NULL) para no romper llamadas existentes.
--    Postgres identifica una función por nombre + tipos de parámetros, así
--    que agregar parámetros no es algo que CREATE OR REPLACE pueda hacer
--    "en el lugar" (dejaría la función vieja de 10 args conviviendo con
--    esta de 12, y eso rompe la resolución de la llamada RPC porque ambas
--    firmas matchean un llamado con los 10 args originales). Por eso se
--    borra la firma vieja antes de crear la nueva en el mismo script.
DROP FUNCTION IF EXISTS public.insertarproductos(text, numeric, numeric, integer, text, text, integer, text, boolean, boolean);
CREATE OR REPLACE FUNCTION public.insertarproductos(
  _nombre text,
  _precio_venta numeric,
  _precio_compra numeric,
  _id_categoria integer,
  _codigo_barras text,
  _codigo_interno text,
  _id_empresa integer,
  _sevende_por text,
  _maneja_inventarios boolean,
  _maneja_multiprecios boolean,
  _peso numeric DEFAULT NULL,
  _id_producto_padre integer DEFAULT NULL
) RETURNS integer
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
     insert into productos(nombre,precio_venta,precio_compra,id_categoria,codigo_barras,codigo_interno,id_empresa,sevende_por,maneja_inventarios,maneja_multiprecios,peso,id_producto_padre)
     values(_nombre,_precio_venta,_precio_compra,_id_categoria,_codigo_barras,_codigo_interno,_id_empresa,_sevende_por,_maneja_inventarios,_maneja_multiprecios,_peso,_id_producto_padre)
     returning id into nuevo_id;
     return nuevo_id;
     end if;
  end if;
end;
$$;

-- 4) editarproductos: mismos dos parámetros nuevos, mismo motivo de DROP.
DROP FUNCTION IF EXISTS public.editarproductos(integer, text, numeric, numeric, integer, text, text, integer, text, boolean);
CREATE OR REPLACE FUNCTION public.editarproductos(
  _id integer,
  _nombre text,
  _precio_venta numeric,
  _precio_compra numeric,
  _id_categoria integer,
  _codigo_barras text,
  _codigo_interno text,
  _id_empresa integer,
  _sevende_por text,
  _maneja_inventarios boolean,
  _peso numeric DEFAULT NULL,
  _id_producto_padre integer DEFAULT NULL
) RETURNS void
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
     update  productos set nombre=_nombre,precio_venta=_precio_venta,precio_compra=_precio_compra,id_categoria=_id_categoria,codigo_barras=_codigo_barras,codigo_interno=_codigo_interno,sevende_por=_sevende_por,maneja_inventarios=_maneja_inventarios,peso=_peso,id_producto_padre=_id_producto_padre
     where id=_id;
     end if;
  end if;
end;
$$;

-- 5) mostrarproductos / buscarproductos / buscarproductoslectora: mismo
--    cuerpo que ya tenían (misma tabla "empresa", mismos INNER JOIN, mismo
--    LIKE/ORDER BY/LIMIT), solo agregando peso e id_producto_padre al final
--    de RETURNS TABLE y del SELECT, para que el frontend pueda filtrar
--    familias/variantes desde la data que ya trae sin una consulta nueva.
--    Postgres no permite cambiar las columnas de salida de una función con
--    CREATE OR REPLACE, así que también hace falta borrar primero.
DROP FUNCTION IF EXISTS public.mostrarproductos(integer);
CREATE OR REPLACE FUNCTION public.mostrarproductos(_id_empresa integer) RETURNS TABLE(id integer, nombre text, precio_venta numeric, precio_compra numeric, id_categoria integer, sevende_por text, codigo_barras text, codigo_interno text, id_empresa integer, maneja_inventarios boolean, maneja_multiprecios boolean, p_venta text, p_compra text, categoria text, peso numeric, id_producto_padre integer)
    LANGUAGE sql
    AS $$
select p.id,
 p.nombre,p.precio_venta,p.precio_compra,p.id_categoria,p.sevende_por,p.codigo_barras,p.codigo_interno,p.id_empresa,p.maneja_inventarios,p.maneja_multiprecios,concat(e.simbolo_moneda,' ', p.precio_venta) as p_venta,concat(e.simbolo_moneda,' ', p.precio_compra) as p_compra,c.nombre as categoria,p.peso,p.id_producto_padre
  from productos as p inner join empresa as e on e.id=p.id_empresa
  inner join categorias as c on c.id=p.id_categoria
  where p.id_empresa=_id_empresa;
$$;

DROP FUNCTION IF EXISTS public.buscarproductos(integer, text);
CREATE OR REPLACE FUNCTION public.buscarproductos(_id_empresa integer, buscador text) RETURNS TABLE(id integer, nombre text, precio_venta numeric, precio_compra numeric, id_categoria integer, sevende_por text, codigo_barras text, codigo_interno text, id_empresa integer, maneja_inventarios boolean, maneja_multiprecios boolean, p_venta text, p_compra text, categoria text, peso numeric, id_producto_padre integer)
    LANGUAGE sql
    AS $$
select p.id,
 p.nombre,p.precio_venta,p.precio_compra,p.id_categoria,p.sevende_por,p.codigo_barras,p.codigo_interno,p.id_empresa,p.maneja_inventarios,p.maneja_multiprecios,concat(e.simbolo_moneda,' ', p.precio_venta) as p_venta,concat(e.simbolo_moneda,' ', p.precio_compra) as p_compra,c.nombre as categoria,p.peso,p.id_producto_padre
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
CREATE OR REPLACE FUNCTION public.buscarproductoslectora(_id_empresa integer, buscador text) RETURNS TABLE(id integer, nombre text, precio_venta numeric, precio_compra numeric, id_categoria integer, sevende_por text, codigo_barras text, codigo_interno text, id_empresa integer, maneja_inventarios boolean, maneja_multiprecios boolean, p_venta text, p_compra text, categoria text, peso numeric, id_producto_padre integer)
    LANGUAGE sql
    AS $$
select p.id,
 p.nombre,p.precio_venta,p.precio_compra,p.id_categoria,p.sevende_por,p.codigo_barras,p.codigo_interno,p.id_empresa,p.maneja_inventarios,p.maneja_multiprecios,concat(e.simbolo_moneda,' ', p.precio_venta) as p_venta,concat(e.simbolo_moneda,' ', p.precio_compra) as p_compra,c.nombre as categoria,p.peso,p.id_producto_padre
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
--    -> deben aparecer ambas columnas
--
-- 2) select indexname from pg_indexes
--    where tablename='productos' and indexname='productos_padre_peso_unique';
--    -> debe existir
--
-- 3) select proname, pronargs from pg_proc
--    where proname in ('insertarproductos','editarproductos') order by 1;
--    -> insertarproductos debe tener 12 argumentos, editarproductos 12
--
-- 4) Probar el flujo real desde la app: crear una familia, crear una
--    variante de 1gr, y volver a intentar crear otra variante de 1gr en la
--    misma familia debería fallar por el índice único si se intenta
--    insertar sin pasar por el chequeo del frontend.
-- ============================================================================
