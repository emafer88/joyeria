-- ============================================================================
-- Módulo de inventario serializado para joyería
-- ============================================================================
-- Objetivo: manejar joyería donde un mismo DISEÑO (ej. "Cadena Cartier")
-- tiene VARIANTES (ej. "Oro 10K") y cada variante tiene N PIEZAS FÍSICAS
-- individuales, cada una con su propio id, SKU y código de barras únicos,
-- su peso, su costo y su precio. Dos piezas pueden tener exactamente el
-- mismo peso / diseño / precio y seguir siendo registros independientes.
-- El peso NUNCA identifica una pieza.
--
-- Jerarquía:
--   categorias (existente, adaptada)
--     -> productos (existente, adaptada)   = Diseño / modelo
--          -> producto_variantes (NUEVA)   = material + pureza (Oro 10K)
--               -> piezas_inventario (NUEVA) = la pieza física, barcode único
--                    -> movimientos_piezas (NUEVA) = historial por pieza
--
-- No rompe el flujo actual:
--   - Un diseño de joyería es una fila normal de "productos" con
--     maneja_inventarios = false, así que el trigger legacy validarstock()
--     (que descuenta la tabla "stock" por cantidad) NO lo toca. No hace
--     falta ninguna fila en "stock" para estas piezas.
--   - El POS integra la pieza a través de una columna nueva
--     detalle_venta.id_pieza (nullable). Si es NULL, todo el flujo viejo
--     queda EXACTAMENTE igual.
--   - No se modifica ninguna función existente. La promoción de piezas a
--     "vendida" al confirmar la venta se hace con un trigger nuevo sobre
--     "ventas" (AFTER UPDATE), no tocando confirmar_venta().
--
-- Independiente de sql/2026-08-27_familias_variantes_peso.sql: este script
-- NO usa ni depende de las columnas productos.peso / productos.id_producto_padre.
-- Si aquel script se aplicó, esas columnas quedan sin uso para joyería (se
-- pueden revertir con su propio rollback, aparte).
--
-- Cómo aplicar: pegar TODO este script en el SQL Editor de Supabase
-- (Dashboard > SQL Editor) y ejecutarlo. Es seguro re-ejecutar: usa
-- IF NOT EXISTS / CREATE OR REPLACE / DROP ... IF EXISTS / bloques DO que
-- verifican antes de crear.
--
-- Rollback: sql/2026-08-27_rollback_modulo_joyeria.sql
-- ============================================================================


-- ############################################################################
-- SECCIÓN 0 - Helper de updated_at
-- ############################################################################

CREATE OR REPLACE FUNCTION public.joyeria_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


-- ############################################################################
-- SECCIÓN 1 - Adaptar tablas existentes (todo aditivo y nullable / con default)
-- ############################################################################

-- 1.1) categorias: descripción + timestamps
ALTER TABLE public.categorias
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS joyeria_categorias_set_updated_at ON public.categorias;
CREATE TRIGGER joyeria_categorias_set_updated_at
  BEFORE UPDATE ON public.categorias
  FOR EACH ROW EXECUTE FUNCTION public.joyeria_set_updated_at();

-- 1.2) productos: marca (opcional), descripción, flag de joyería, timestamps.
--      "brand_id" del spec = id_marca -> tabla "marca" (si existe en esta base).
ALTER TABLE public.productos
  ADD COLUMN IF NOT EXISTS id_marca    bigint,
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS es_joyeria  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF to_regclass('public.marca') IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'productos_id_marca_fkey') THEN
    ALTER TABLE public.productos
      ADD CONSTRAINT productos_id_marca_fkey
      FOREIGN KEY (id_marca) REFERENCES public.marca(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS productos_es_joyeria_idx
  ON public.productos (id_empresa, es_joyeria);

DROP TRIGGER IF EXISTS joyeria_productos_set_updated_at ON public.productos;
CREATE TRIGGER joyeria_productos_set_updated_at
  BEFORE UPDATE ON public.productos
  FOR EACH ROW EXECUTE FUNCTION public.joyeria_set_updated_at();

-- 1.3) detalle_venta: puente opcional a la pieza física vendida.
ALTER TABLE public.detalle_venta
  ADD COLUMN IF NOT EXISTS id_pieza bigint;

CREATE INDEX IF NOT EXISTS detalle_venta_id_pieza_idx
  ON public.detalle_venta (id_pieza) WHERE id_pieza IS NOT NULL;


-- ############################################################################
-- SECCIÓN 2 - Tablas nuevas
-- ############################################################################

-- 2.1) producto_variantes  = "Variante" (material + pureza de un diseño)
CREATE TABLE IF NOT EXISTS public.producto_variantes (
  id                    bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  id_producto           bigint NOT NULL,
  id_empresa            bigint NOT NULL,
  material              text   NOT NULL,
  pureza                text,
  sku_prefijo           text,
  ultimo_correlativo    bigint NOT NULL DEFAULT 0,
  precio_venta_sugerido  numeric(12,2),
  precio_compra_sugerido numeric(12,2),
  notas                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'producto_variantes_id_producto_fkey') THEN
    ALTER TABLE public.producto_variantes
      ADD CONSTRAINT producto_variantes_id_producto_fkey
      FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'producto_variantes_id_empresa_fkey') THEN
    ALTER TABLE public.producto_variantes
      ADD CONSTRAINT producto_variantes_id_empresa_fkey
      FOREIGN KEY (id_empresa) REFERENCES public.empresa(id) ON DELETE CASCADE;
  END IF;
END $$;

-- no duplicar variante (material + pureza) dentro del mismo diseño.
-- Se usa coalesce(pureza,'') para que dos variantes del mismo material sin
-- pureza también choquen (UNIQUE normal trataría los NULL como distintos).
CREATE UNIQUE INDEX IF NOT EXISTS producto_variantes_prod_mat_pur_uq
  ON public.producto_variantes (id_producto, material, coalesce(pureza, ''));

-- prefijo de SKU único por empresa (para que "CAR10-0001" no se repita entre variantes)
CREATE UNIQUE INDEX IF NOT EXISTS producto_variantes_prefijo_uq
  ON public.producto_variantes (id_empresa, sku_prefijo)
  WHERE sku_prefijo IS NOT NULL;

CREATE INDEX IF NOT EXISTS producto_variantes_id_producto_idx ON public.producto_variantes (id_producto);
CREATE INDEX IF NOT EXISTS producto_variantes_material_idx    ON public.producto_variantes (id_empresa, material);
CREATE INDEX IF NOT EXISTS producto_variantes_pureza_idx      ON public.producto_variantes (id_empresa, pureza);

DROP TRIGGER IF EXISTS joyeria_variantes_set_updated_at ON public.producto_variantes;
CREATE TRIGGER joyeria_variantes_set_updated_at
  BEFORE UPDATE ON public.producto_variantes
  FOR EACH ROW EXECUTE FUNCTION public.joyeria_set_updated_at();


-- 2.2) piezas_inventario  = la PIEZA FÍSICA individual
--      estado: disponible | vendida | reservada | danada | perdida
--      (mapea a available | sold | reserved | damaged | lost del spec)
CREATE TABLE IF NOT EXISTS public.piezas_inventario (
  id                bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  id_variante       bigint NOT NULL,
  id_producto       bigint NOT NULL,     -- desnormalizado (evita 2 saltos en POS/reportes)
  id_empresa        bigint NOT NULL,
  id_almacen        bigint,              -- dónde está físicamente la pieza
  sku               text   NOT NULL,
  barcode           text   NOT NULL,     -- EAN-13 numérico, lo que escanea el POS
  peso              numeric(10,3) NOT NULL,
  costo             numeric(12,2) NOT NULL DEFAULT 0,
  precio_venta      numeric(12,2) NOT NULL,
  estado            text   NOT NULL DEFAULT 'disponible',
  id_detalle_venta  bigint,              -- qué línea de venta consumió la pieza
  id_venta_reserva  bigint,              -- venta pendiente que la tiene reservada
  nota              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT piezas_inventario_barcode_uq UNIQUE (barcode),
  CONSTRAINT piezas_inventario_sku_uq     UNIQUE (id_empresa, sku),
  CONSTRAINT piezas_inventario_estado_chk
    CHECK (estado IN ('disponible','vendida','reservada','danada','perdida')),
  CONSTRAINT piezas_inventario_peso_chk         CHECK (peso > 0),
  CONSTRAINT piezas_inventario_costo_chk        CHECK (costo >= 0),
  CONSTRAINT piezas_inventario_precio_venta_chk CHECK (precio_venta >= 0)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'piezas_inventario_id_variante_fkey') THEN
    ALTER TABLE public.piezas_inventario
      ADD CONSTRAINT piezas_inventario_id_variante_fkey
      FOREIGN KEY (id_variante) REFERENCES public.producto_variantes(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'piezas_inventario_id_producto_fkey') THEN
    ALTER TABLE public.piezas_inventario
      ADD CONSTRAINT piezas_inventario_id_producto_fkey
      FOREIGN KEY (id_producto) REFERENCES public.productos(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'piezas_inventario_id_empresa_fkey') THEN
    ALTER TABLE public.piezas_inventario
      ADD CONSTRAINT piezas_inventario_id_empresa_fkey
      FOREIGN KEY (id_empresa) REFERENCES public.empresa(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'piezas_inventario_id_almacen_fkey') THEN
    ALTER TABLE public.piezas_inventario
      ADD CONSTRAINT piezas_inventario_id_almacen_fkey
      FOREIGN KEY (id_almacen) REFERENCES public.almacen(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'piezas_inventario_id_detalle_venta_fkey') THEN
    ALTER TABLE public.piezas_inventario
      ADD CONSTRAINT piezas_inventario_id_detalle_venta_fkey
      FOREIGN KEY (id_detalle_venta) REFERENCES public.detalle_venta(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'piezas_inventario_id_venta_reserva_fkey') THEN
    ALTER TABLE public.piezas_inventario
      ADD CONSTRAINT piezas_inventario_id_venta_reserva_fkey
      FOREIGN KEY (id_venta_reserva) REFERENCES public.ventas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Una línea de venta no puede quedar vinculada a dos piezas.
CREATE UNIQUE INDEX IF NOT EXISTS piezas_inventario_detalle_venta_uq
  ON public.piezas_inventario (id_detalle_venta)
  WHERE id_detalle_venta IS NOT NULL;

CREATE INDEX IF NOT EXISTS piezas_inventario_variante_idx     ON public.piezas_inventario (id_variante);
CREATE INDEX IF NOT EXISTS piezas_inventario_producto_idx     ON public.piezas_inventario (id_producto);
CREATE INDEX IF NOT EXISTS piezas_inventario_almacen_idx      ON public.piezas_inventario (id_almacen);
CREATE INDEX IF NOT EXISTS piezas_inventario_estado_idx       ON public.piezas_inventario (id_empresa, estado);
CREATE INDEX IF NOT EXISTS piezas_inventario_estado_precio_idx ON public.piezas_inventario (id_empresa, estado, precio_venta);
CREATE INDEX IF NOT EXISTS piezas_inventario_estado_costo_idx  ON public.piezas_inventario (id_empresa, estado, costo);
CREATE INDEX IF NOT EXISTS piezas_inventario_estado_peso_idx   ON public.piezas_inventario (id_empresa, estado, peso);
CREATE INDEX IF NOT EXISTS piezas_inventario_sku_lower_idx     ON public.piezas_inventario (lower(sku));
CREATE INDEX IF NOT EXISTS piezas_inventario_barcode_lower_idx ON public.piezas_inventario (lower(barcode));

DROP TRIGGER IF EXISTS joyeria_piezas_set_updated_at ON public.piezas_inventario;
CREATE TRIGGER joyeria_piezas_set_updated_at
  BEFORE UPDATE ON public.piezas_inventario
  FOR EACH ROW EXECUTE FUNCTION public.joyeria_set_updated_at();

-- FK de detalle_venta.id_pieza (se agrega acá, cuando piezas_inventario ya existe).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'detalle_venta_id_pieza_fkey') THEN
    ALTER TABLE public.detalle_venta
      ADD CONSTRAINT detalle_venta_id_pieza_fkey
      FOREIGN KEY (id_pieza) REFERENCES public.piezas_inventario(id) ON DELETE SET NULL;
  END IF;
END $$;


-- 2.3) movimientos_piezas  = historial / kardex por pieza (audit log)
CREATE TABLE IF NOT EXISTS public.movimientos_piezas (
  id               bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  id_pieza         bigint NOT NULL,
  id_empresa       bigint NOT NULL,
  tipo             text   NOT NULL,
  cantidad         numeric NOT NULL DEFAULT 1,
  estado_anterior  text,
  estado_nuevo     text,
  id_referencia    bigint,
  referencia_tipo  text,
  id_usuario       bigint,
  notas            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT movimientos_piezas_tipo_chk CHECK (tipo IN
    ('entrada','venta','devolucion','ajuste','perdida','dano','reserva','cancelacion_reserva'))
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'movimientos_piezas_id_pieza_fkey') THEN
    ALTER TABLE public.movimientos_piezas
      ADD CONSTRAINT movimientos_piezas_id_pieza_fkey
      FOREIGN KEY (id_pieza) REFERENCES public.piezas_inventario(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'movimientos_piezas_id_empresa_fkey') THEN
    ALTER TABLE public.movimientos_piezas
      ADD CONSTRAINT movimientos_piezas_id_empresa_fkey
      FOREIGN KEY (id_empresa) REFERENCES public.empresa(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'movimientos_piezas_id_usuario_fkey') THEN
    ALTER TABLE public.movimientos_piezas
      ADD CONSTRAINT movimientos_piezas_id_usuario_fkey
      FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS movimientos_piezas_pieza_idx  ON public.movimientos_piezas (id_pieza, created_at);
CREATE INDEX IF NOT EXISTS movimientos_piezas_tipo_idx   ON public.movimientos_piezas (id_empresa, tipo, created_at);
CREATE INDEX IF NOT EXISTS movimientos_piezas_ref_idx    ON public.movimientos_piezas (id_referencia);


-- ############################################################################
-- SECCIÓN 3 - Generación de código de barras (EAN-13)
-- ############################################################################
-- El barcode es lo que se escanea en el POS: 100% numérico, lo lee cualquier
-- lector sin configurar nada. Se arma desde una secuencia global, así que es
-- único por construcción. Formato de los 12 dígitos de datos:
--   '2' (uso interno) + id_empresa(4) + correlativo global(7) + dígito verificador.

CREATE SEQUENCE IF NOT EXISTS public.joyeria_barcode_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION public.joyeria_ean13(_id_empresa bigint, _seq bigint)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  base12 text;
  s int := 0;
  i int;
  d int;
BEGIN
  base12 := '2'
         || lpad((_id_empresa % 10000)::text, 4, '0')
         || lpad((_seq % 10000000)::text, 7, '0');
  FOR i IN 1..12 LOOP
    d := substr(base12, i, 1)::int;
    IF i % 2 = 1 THEN s := s + d;        -- posiciones impares x1
    ELSE               s := s + d * 3;   -- posiciones pares  x3
    END IF;
  END LOOP;
  RETURN base12 || ((10 - (s % 10)) % 10)::text;
END;
$$;


-- ############################################################################
-- SECCIÓN 4 - RPC: alta de diseño y variante
-- ############################################################################

-- 4.1) crear_producto_joyeria: crea el DISEÑO como fila de productos con
--      maneja_inventarios = false (para que el stock legacy no lo toque).
CREATE OR REPLACE FUNCTION public.crear_producto_joyeria(
  _nombre       text,
  _descripcion  text,
  _id_categoria integer,
  _id_marca     integer,
  _id_empresa   integer
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE nuevo_id int;
BEGIN
  IF _nombre IS NULL OR btrim(_nombre) = '' THEN
    RAISE EXCEPTION 'El nombre del producto es obligatorio';
  END IF;

  PERFORM 1 FROM productos WHERE nombre = _nombre AND id_empresa = _id_empresa;
  IF FOUND THEN
    RAISE EXCEPTION 'Nombre de producto duplicado';
  END IF;

  INSERT INTO productos (
    nombre, descripcion, precio_venta, precio_compra, id_categoria, id_marca,
    id_empresa, sevende_por, maneja_inventarios, maneja_multiprecios, es_joyeria
  ) VALUES (
    _nombre, _descripcion, 0, 0, _id_categoria, _id_marca,
    _id_empresa, 'unidad', false, false, true
  )
  RETURNING id INTO nuevo_id;

  RETURN nuevo_id;
END;
$$;


-- 4.2) crear_variante: material + pureza + prefijo de SKU.
--      Si _sku_prefijo viene NULL/vacío se deriva uno de nombre+pureza y se
--      resuelve la colisión agregando un sufijo numérico.
CREATE OR REPLACE FUNCTION public.crear_variante(
  _id_producto            integer,
  _id_empresa             integer,
  _material               text,
  _pureza                 text,
  _sku_prefijo            text,
  _precio_venta_sugerido  numeric,
  _precio_compra_sugerido numeric
) RETURNS integer LANGUAGE plpgsql AS $$
DECLARE
  v_prefijo_base text;
  v_prefijo      text;
  v_nombre_prod  text;
  v_intento      int := 0;
  nuevo_id       int;
BEGIN
  IF _material IS NULL OR btrim(_material) = '' THEN
    RAISE EXCEPTION 'El material de la variante es obligatorio';
  END IF;

  IF _sku_prefijo IS NOT NULL AND btrim(_sku_prefijo) <> '' THEN
    v_prefijo_base := upper(regexp_replace(_sku_prefijo, '[^A-Za-z0-9]', '', 'g'));
  ELSE
    SELECT nombre INTO v_nombre_prod FROM productos WHERE id = _id_producto;
    v_prefijo_base :=
      upper(substr(regexp_replace(coalesce(v_nombre_prod,'PRD'), '[^A-Za-z0-9]', '', 'g'), 1, 3))
      || upper(regexp_replace(coalesce(_pureza,''), '[^A-Za-z0-9]', '', 'g'));
    IF v_prefijo_base = '' THEN v_prefijo_base := 'VAR'; END IF;
  END IF;

  LOOP
    v_prefijo := CASE WHEN v_intento = 0 THEN v_prefijo_base
                      ELSE v_prefijo_base || v_intento::text END;
    BEGIN
      INSERT INTO producto_variantes (
        id_producto, id_empresa, material, pureza, sku_prefijo,
        precio_venta_sugerido, precio_compra_sugerido
      ) VALUES (
        _id_producto, _id_empresa, _material, _pureza, v_prefijo,
        _precio_venta_sugerido, _precio_compra_sugerido
      )
      RETURNING id INTO nuevo_id;
      RETURN nuevo_id;
    EXCEPTION
      WHEN unique_violation THEN
        -- ¿chocó por (id_producto, material, pureza) o por el prefijo?
        IF EXISTS (SELECT 1 FROM producto_variantes
                    WHERE id_producto = _id_producto
                      AND material = _material
                      AND pureza IS NOT DISTINCT FROM _pureza) THEN
          RAISE EXCEPTION 'Ya existe una variante % % para este producto', _material, coalesce(_pureza,'');
        END IF;
        v_intento := v_intento + 1;
        IF v_intento > 50 THEN
          RAISE EXCEPTION 'No se pudo generar un prefijo de SKU único a partir de "%"', v_prefijo_base;
        END IF;
    END;
  END LOOP;
END;
$$;


-- ############################################################################
-- SECCIÓN 5 - RPC: alta de piezas (individual y masiva)
-- ############################################################################

-- 5.1) crear_piezas_masivo: la función central del alta masiva.
--   _lineas = jsonb array, un objeto por combinación peso/costo/precio:
--     [{ "peso":7.8, "costo":4200, "precio_venta":6500, "cantidad":5 },
--      { "peso":8.1, "costo":4350, "precio_venta":6700, "cantidad":3 }, ...]
--   Todo en UNA transacción: si algo falla no queda un lote a medias.
--   Toma FOR UPDATE la fila de la variante -> el correlativo del SKU es
--   atómico aunque dos usuarios generen piezas de la misma variante a la vez.
CREATE OR REPLACE FUNCTION public.crear_piezas_masivo(
  _id_variante integer,
  _id_empresa  integer,
  _id_almacen  integer,
  _id_usuario  integer,
  _lineas      jsonb
) RETURNS SETOF public.piezas_inventario LANGUAGE plpgsql AS $$
DECLARE
  v_prefijo    text;
  v_id_producto bigint;
  v_last       bigint;
  v_total      int := 0;
  v_counter    bigint;
  v_linea      jsonb;
  v_cant       int;
  v_peso       numeric;
  v_costo      numeric;
  v_precio     numeric;
  i            int;
  v_id         bigint;
  v_sku        text;
  v_barcode    text;
  v_estado_ant text;
  v_ids        bigint[] := '{}';
BEGIN
  IF _lineas IS NULL OR jsonb_typeof(_lineas) <> 'array' OR jsonb_array_length(_lineas) = 0 THEN
    RAISE EXCEPTION 'Se requiere al menos una línea de piezas';
  END IF;

  SELECT id_producto, sku_prefijo
    INTO v_id_producto, v_prefijo
    FROM producto_variantes
   WHERE id = _id_variante AND id_empresa = _id_empresa
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variante % no encontrada para la empresa %', _id_variante, _id_empresa;
  END IF;
  IF v_prefijo IS NULL THEN
    RAISE EXCEPTION 'La variante % no tiene prefijo de SKU configurado', _id_variante;
  END IF;

  -- Validar líneas y contar el total de piezas a crear.
  FOR v_linea IN SELECT * FROM jsonb_array_elements(_lineas) LOOP
    v_cant   := coalesce((v_linea->>'cantidad')::int, 0);
    v_peso   := (v_linea->>'peso')::numeric;
    v_costo  := coalesce((v_linea->>'costo')::numeric, 0);
    v_precio := (v_linea->>'precio_venta')::numeric;
    IF v_cant < 1 THEN RAISE EXCEPTION 'cantidad debe ser >= 1 en cada línea'; END IF;
    IF v_peso IS NULL OR v_peso <= 0 THEN RAISE EXCEPTION 'peso debe ser > 0 en cada línea'; END IF;
    IF v_precio IS NULL OR v_precio < 0 THEN RAISE EXCEPTION 'precio_venta inválido en una línea'; END IF;
    IF v_costo < 0 THEN RAISE EXCEPTION 'costo inválido en una línea'; END IF;
    v_total := v_total + v_cant;
  END LOOP;

  -- Reservar el rango de correlativos de una sola vez (atómico bajo el lock).
  UPDATE producto_variantes
     SET ultimo_correlativo = ultimo_correlativo + v_total,
         updated_at = now()
   WHERE id = _id_variante
   RETURNING ultimo_correlativo INTO v_last;
  v_counter := v_last - v_total + 1;

  -- Crear cada pieza.
  FOR v_linea IN SELECT * FROM jsonb_array_elements(_lineas) LOOP
    v_cant   := (v_linea->>'cantidad')::int;
    v_peso   := (v_linea->>'peso')::numeric;
    v_costo  := coalesce((v_linea->>'costo')::numeric, 0);
    v_precio := (v_linea->>'precio_venta')::numeric;

    FOR i IN 1..v_cant LOOP
      v_sku     := v_prefijo || '-' || lpad(v_counter::text, 4, '0');
      v_barcode := public.joyeria_ean13(_id_empresa, nextval('public.joyeria_barcode_seq'));

      INSERT INTO piezas_inventario (
        id_variante, id_producto, id_empresa, id_almacen,
        sku, barcode, peso, costo, precio_venta, estado
      ) VALUES (
        _id_variante, v_id_producto, _id_empresa, _id_almacen,
        v_sku, v_barcode, v_peso, v_costo, v_precio, 'disponible'
      )
      RETURNING id INTO v_id;

      INSERT INTO movimientos_piezas (
        id_pieza, id_empresa, tipo, estado_nuevo, id_usuario, notas
      ) VALUES (
        v_id, _id_empresa, 'entrada', 'disponible', _id_usuario, 'alta masiva'
      );

      v_ids := v_ids || v_id;
      v_counter := v_counter + 1;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT * FROM piezas_inventario WHERE id = ANY(v_ids) ORDER BY id;
END;
$$;


-- 5.2) crear_pieza: alta individual (una sola pieza). Reusa el motor de arriba.
CREATE OR REPLACE FUNCTION public.crear_pieza(
  _id_variante integer,
  _id_empresa  integer,
  _id_almacen  integer,
  _id_usuario  integer,
  _peso        numeric,
  _costo       numeric,
  _precio_venta numeric,
  _nota        text
) RETURNS SETOF public.piezas_inventario LANGUAGE plpgsql AS $$
DECLARE r public.piezas_inventario;
BEGIN
  FOR r IN
    SELECT * FROM public.crear_piezas_masivo(
      _id_variante, _id_empresa, _id_almacen, _id_usuario,
      jsonb_build_array(jsonb_build_object(
        'peso', _peso, 'costo', coalesce(_costo,0),
        'precio_venta', _precio_venta, 'cantidad', 1))
    )
  LOOP
    IF _nota IS NOT NULL AND btrim(_nota) <> '' THEN
      UPDATE piezas_inventario SET nota = _nota WHERE id = r.id;
      r.nota := _nota;
    END IF;
    RETURN NEXT r;
  END LOOP;
END;
$$;


-- ############################################################################
-- SECCIÓN 6 - RPC: POS (buscar, reservar, liberar)
-- ############################################################################

-- 6.1) pos_buscar_pieza: el vendedor escanea barcode (o teclea el SKU).
CREATE OR REPLACE FUNCTION public.pos_buscar_pieza(_codigo text, _id_empresa integer)
RETURNS TABLE (
  id_pieza      bigint,
  id_variante   bigint,
  id_producto   bigint,
  producto      text,
  categoria     text,
  material      text,
  pureza        text,
  sku           text,
  barcode       text,
  peso          numeric,
  costo         numeric,
  precio_venta  numeric,
  estado        text,
  id_almacen    bigint
) LANGUAGE sql STABLE AS $$
  SELECT pi.id, pi.id_variante, pi.id_producto,
         p.nombre, c.nombre, v.material, v.pureza,
         pi.sku, pi.barcode, pi.peso, pi.costo, pi.precio_venta, pi.estado, pi.id_almacen
    FROM piezas_inventario pi
    JOIN producto_variantes v ON v.id = pi.id_variante
    JOIN productos p          ON p.id = pi.id_producto
    LEFT JOIN categorias c    ON c.id = p.id_categoria
   WHERE pi.id_empresa = _id_empresa
     AND (lower(pi.barcode) = lower(btrim(_codigo))
          OR lower(pi.sku) = lower(btrim(_codigo)))
   LIMIT 1;
$$;


-- 6.2) reservar_pieza: al agregar la pieza al carrito. Atómico: solo pasa de
--      'disponible' a 'reservada'. Si otra caja ya la tomó -> excepción.
CREATE OR REPLACE FUNCTION public.reservar_pieza(
  _id_pieza integer, _id_venta integer, _id_empresa integer, _id_usuario integer
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE piezas_inventario
     SET estado = 'reservada', id_venta_reserva = _id_venta, updated_at = now()
   WHERE id = _id_pieza
     AND id_empresa = _id_empresa
     AND estado = 'disponible';

  IF FOUND THEN
    INSERT INTO movimientos_piezas (id_pieza, id_empresa, tipo, estado_anterior, estado_nuevo,
                                    id_referencia, referencia_tipo, id_usuario, notas)
    VALUES (_id_pieza, _id_empresa, 'reserva', 'disponible', 'reservada',
            _id_venta, 'venta', _id_usuario, 'reserva desde el POS');
    RETURN;
  END IF;

  -- Ya estaba reservada por ESTA misma venta -> idempotente, no es error.
  IF EXISTS (SELECT 1 FROM piezas_inventario
              WHERE id = _id_pieza AND estado = 'reservada'
                AND id_venta_reserva = _id_venta) THEN
    RETURN;
  END IF;

  RAISE EXCEPTION 'La pieza % ya no está disponible', _id_pieza;
END;
$$;


-- 6.3) liberar_pieza: al quitar la pieza del carrito o cancelar la venta.
CREATE OR REPLACE FUNCTION public.liberar_pieza(
  _id_pieza integer, _id_empresa integer, _id_usuario integer
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE piezas_inventario
     SET estado = 'disponible', id_venta_reserva = NULL, id_detalle_venta = NULL, updated_at = now()
   WHERE id = _id_pieza
     AND id_empresa = _id_empresa
     AND estado = 'reservada';

  IF FOUND THEN
    INSERT INTO movimientos_piezas (id_pieza, id_empresa, tipo, estado_anterior, estado_nuevo, id_usuario, notas)
    VALUES (_id_pieza, _id_empresa, 'cancelacion_reserva', 'reservada', 'disponible', _id_usuario, 'liberada desde el POS');
  END IF;
END;
$$;


-- ############################################################################
-- SECCIÓN 7 - RPC: movimientos manuales (ajuste / pérdida / daño / devolución)
-- ############################################################################

-- 7.1) ajustar_pieza: corregir peso / costo / precio de una pieza NO vendida.
CREATE OR REPLACE FUNCTION public.ajustar_pieza(
  _id_pieza integer, _id_empresa integer, _id_usuario integer,
  _peso numeric, _costo numeric, _precio_venta numeric, _nota text
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_ant piezas_inventario;
BEGIN
  SELECT * INTO v_ant FROM piezas_inventario
   WHERE id = _id_pieza AND id_empresa = _id_empresa FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pieza % no encontrada', _id_pieza; END IF;
  IF v_ant.estado = 'vendida' THEN
    RAISE EXCEPTION 'No se puede ajustar una pieza vendida (id %)', _id_pieza;
  END IF;
  IF _peso IS NOT NULL AND _peso <= 0 THEN RAISE EXCEPTION 'peso debe ser > 0'; END IF;

  UPDATE piezas_inventario
     SET peso         = coalesce(_peso, peso),
         costo        = coalesce(_costo, costo),
         precio_venta = coalesce(_precio_venta, precio_venta),
         nota         = coalesce(_nota, nota)
   WHERE id = _id_pieza;

  INSERT INTO movimientos_piezas (id_pieza, id_empresa, tipo, estado_anterior, estado_nuevo, id_usuario, notas)
  VALUES (_id_pieza, _id_empresa, 'ajuste', v_ant.estado, v_ant.estado, _id_usuario,
          format('ajuste: peso %s->%s, costo %s->%s, precio %s->%s. %s',
                 v_ant.peso, coalesce(_peso, v_ant.peso),
                 v_ant.costo, coalesce(_costo, v_ant.costo),
                 v_ant.precio_venta, coalesce(_precio_venta, v_ant.precio_venta),
                 coalesce(_nota,'')));
END;
$$;


-- 7.2) marcar_pieza: pérdida / daño, o volver a poner disponible.
CREATE OR REPLACE FUNCTION public.marcar_pieza(
  _id_pieza integer, _id_empresa integer, _id_usuario integer,
  _estado text, _nota text
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_ant text;
  v_tipo text;
BEGIN
  IF _estado NOT IN ('perdida','danada','disponible') THEN
    RAISE EXCEPTION 'estado inválido: % (usar perdida | danada | disponible)', _estado;
  END IF;

  SELECT estado INTO v_ant FROM piezas_inventario
   WHERE id = _id_pieza AND id_empresa = _id_empresa FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pieza % no encontrada', _id_pieza; END IF;
  IF v_ant = 'vendida' THEN
    RAISE EXCEPTION 'La pieza % está vendida; usá devolver_pieza primero', _id_pieza;
  END IF;

  UPDATE piezas_inventario
     SET estado = _estado, id_venta_reserva = NULL, id_detalle_venta = NULL,
         nota = coalesce(_nota, nota)
   WHERE id = _id_pieza;

  v_tipo := CASE _estado WHEN 'perdida' THEN 'perdida'
                         WHEN 'danada'  THEN 'dano'
                         ELSE 'ajuste' END;
  INSERT INTO movimientos_piezas (id_pieza, id_empresa, tipo, estado_anterior, estado_nuevo, id_usuario, notas)
  VALUES (_id_pieza, _id_empresa, v_tipo, v_ant, _estado, _id_usuario, _nota);
END;
$$;


-- 7.3) devolver_pieza: revierte una venta a nivel pieza (sin borrar la línea).
--      _destino: 'disponible' (vuelve al stock) o 'danada'.
CREATE OR REPLACE FUNCTION public.devolver_pieza(
  _id_pieza integer, _id_empresa integer, _id_usuario integer,
  _destino text, _nota text
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE v_ant text;
BEGIN
  IF coalesce(_destino,'disponible') NOT IN ('disponible','danada') THEN
    RAISE EXCEPTION 'destino inválido: % (usar disponible | danada)', _destino;
  END IF;

  SELECT estado INTO v_ant FROM piezas_inventario
   WHERE id = _id_pieza AND id_empresa = _id_empresa FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pieza % no encontrada', _id_pieza; END IF;
  IF v_ant <> 'vendida' THEN
    RAISE EXCEPTION 'La pieza % no está vendida (estado %)', _id_pieza, v_ant;
  END IF;

  UPDATE piezas_inventario
     SET estado = coalesce(_destino,'disponible'),
         id_detalle_venta = NULL, id_venta_reserva = NULL,
         nota = coalesce(_nota, nota)
   WHERE id = _id_pieza;

  INSERT INTO movimientos_piezas (id_pieza, id_empresa, tipo, estado_anterior, estado_nuevo, id_usuario, notas)
  VALUES (_id_pieza, _id_empresa, 'devolucion', 'vendida', coalesce(_destino,'disponible'), _id_usuario, _nota);
END;
$$;


-- ############################################################################
-- SECCIÓN 8 - Triggers de integración con la venta (detalle_venta / ventas)
-- ############################################################################

-- 8.1) BEFORE INSERT/UPDATE en detalle_venta: si la línea trae id_pieza,
--      "consume" la pieza de forma atómica. Solo acepta piezas 'disponible'
--      o 'reservada por ESTA misma venta'. Cualquier otro caso -> excepción,
--      lo que aborta el INSERT de la línea (regla: no vender 2 veces).
--      Para líneas sin id_pieza no hace absolutamente nada (flujo viejo intacto).
CREATE OR REPLACE FUNCTION public.joyeria_detalle_venta_biu()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_emp bigint;
BEGIN
  IF NEW.id_pieza IS NULL THEN
    RETURN NEW;
  END IF;

  NEW.cantidad := 1;  -- una pieza serializada es siempre 1 unidad

  IF TG_OP = 'INSERT' OR NEW.id_pieza IS DISTINCT FROM OLD.id_pieza THEN
    UPDATE piezas_inventario pi
       SET estado = 'reservada',
           id_detalle_venta = NEW.id,
           id_venta_reserva = NEW.id_venta,
           updated_at = now()
     WHERE pi.id = NEW.id_pieza
       AND (
             pi.estado = 'disponible'
          OR (pi.estado = 'reservada' AND pi.id_venta_reserva = NEW.id_venta)
          OR (pi.estado = 'reservada' AND EXISTS (
                SELECT 1 FROM detalle_venta dv
                 WHERE dv.id = pi.id_detalle_venta AND dv.id_venta = NEW.id_venta))
           )
     RETURNING pi.id_empresa INTO v_emp;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'La pieza % no está disponible (vendida, reservada por otra venta, perdida o dañada)', NEW.id_pieza;
    END IF;

    INSERT INTO movimientos_piezas (id_pieza, id_empresa, tipo, estado_nuevo,
                                    id_referencia, referencia_tipo, notas)
    VALUES (NEW.id_pieza, v_emp, 'reserva', 'reservada',
            NEW.id_venta, 'venta', 'reserva por línea de venta');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_joyeria_detalle_venta_biu ON public.detalle_venta;
CREATE TRIGGER zz_joyeria_detalle_venta_biu
  BEFORE INSERT OR UPDATE ON public.detalle_venta
  FOR EACH ROW EXECUTE FUNCTION public.joyeria_detalle_venta_biu();


-- 8.2) AFTER DELETE en detalle_venta: si la línea borrada tenía pieza, la
--      libera (o la marca devuelta si la venta ya estaba confirmada).
CREATE OR REPLACE FUNCTION public.joyeria_detalle_venta_ad()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v piezas_inventario;
  v_tipo text;
  v_destino text;
BEGIN
  IF OLD.id_pieza IS NULL THEN RETURN OLD; END IF;

  SELECT * INTO v FROM piezas_inventario WHERE id = OLD.id_pieza;
  IF NOT FOUND THEN RETURN OLD; END IF;

  IF v.estado = 'vendida' THEN
    v_tipo := 'devolucion'; v_destino := 'disponible';
  ELSE
    v_tipo := 'cancelacion_reserva'; v_destino := 'disponible';
  END IF;

  UPDATE piezas_inventario
     SET estado = v_destino, id_detalle_venta = NULL, id_venta_reserva = NULL, updated_at = now()
   WHERE id = OLD.id_pieza;

  INSERT INTO movimientos_piezas (id_pieza, id_empresa, tipo, estado_anterior, estado_nuevo,
                                  id_referencia, referencia_tipo, notas)
  VALUES (OLD.id_pieza, v.id_empresa, v_tipo, v.estado, v_destino,
          OLD.id_venta, 'venta', 'línea de venta eliminada');

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS zz_joyeria_detalle_venta_ad ON public.detalle_venta;
CREATE TRIGGER zz_joyeria_detalle_venta_ad
  AFTER DELETE ON public.detalle_venta
  FOR EACH ROW EXECUTE FUNCTION public.joyeria_detalle_venta_ad();


-- 8.3) AFTER UPDATE en ventas: cuando la venta pasa a 'confirmada', promueve
--      todas sus piezas reservadas a 'vendida'. No se toca confirmar_venta().
CREATE OR REPLACE FUNCTION public.joyeria_ventas_confirmar_au()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado AND NEW.estado = 'confirmada' THEN
    INSERT INTO movimientos_piezas (id_pieza, id_empresa, tipo, estado_anterior, estado_nuevo,
                                    id_referencia, referencia_tipo, notas)
    SELECT pi.id, pi.id_empresa, 'venta', pi.estado, 'vendida',
           NEW.id, 'venta', concat('venta confirmada ', NEW.nro_comprobante)
      FROM piezas_inventario pi
      JOIN detalle_venta dv ON dv.id = pi.id_detalle_venta
     WHERE dv.id_venta = NEW.id
       AND pi.estado = 'reservada';

    UPDATE piezas_inventario pi
       SET estado = 'vendida', id_venta_reserva = NULL, updated_at = now()
      FROM detalle_venta dv
     WHERE dv.id = pi.id_detalle_venta
       AND dv.id_venta = NEW.id
       AND pi.estado = 'reservada';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zzz_joyeria_ventas_confirmar_au ON public.ventas;
CREATE TRIGGER zzz_joyeria_ventas_confirmar_au
  AFTER UPDATE ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.joyeria_ventas_confirmar_au();


-- 8.4) BEFORE DELETE en piezas_inventario: nunca borrar una pieza vendida
--      (defensa extra, incluso contra un DELETE manual con service_role).
CREATE OR REPLACE FUNCTION public.joyeria_pieza_bd()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.estado = 'vendida' THEN
    RAISE EXCEPTION 'No se puede eliminar una pieza vendida (id %). Registrá una devolución.', OLD.id;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS joyeria_pieza_bd ON public.piezas_inventario;
CREATE TRIGGER joyeria_pieza_bd
  BEFORE DELETE ON public.piezas_inventario
  FOR EACH ROW EXECUTE FUNCTION public.joyeria_pieza_bd();


-- ############################################################################
-- SECCIÓN 9 - RPC de lectura para las pantallas
-- ############################################################################

-- 9.1) joyeria_inventario_listado: filas planas para la pantalla de inventario
--      (TanStack Table agrupa/expande/filtra/ordena del lado del cliente).
CREATE OR REPLACE FUNCTION public.joyeria_inventario_listado(_id_empresa integer)
RETURNS TABLE (
  id_categoria bigint, categoria text,
  id_producto  bigint, producto  text, id_marca bigint,
  id_variante  bigint, material  text, pureza text, sku_prefijo text,
  id_pieza     bigint, sku text, barcode text,
  peso numeric, costo numeric, precio_venta numeric, estado text,
  id_almacen bigint, almacen text,
  created_at timestamptz
) LANGUAGE sql STABLE AS $$
  SELECT c.id, c.nombre,
         p.id, p.nombre, p.id_marca,
         v.id, v.material, v.pureza, v.sku_prefijo,
         pi.id, pi.sku, pi.barcode,
         pi.peso, pi.costo, pi.precio_venta, pi.estado,
         pi.id_almacen, a.nombre,
         pi.created_at
    FROM piezas_inventario pi
    JOIN producto_variantes v ON v.id = pi.id_variante
    JOIN productos p          ON p.id = pi.id_producto
    LEFT JOIN categorias c    ON c.id = p.id_categoria
    LEFT JOIN almacen a       ON a.id = pi.id_almacen
   WHERE pi.id_empresa = _id_empresa
   ORDER BY c.nombre, p.nombre, v.material, v.pureza, pi.id;
$$;

-- 9.2) joyeria_movimientos_pieza: historial de una pieza.
CREATE OR REPLACE FUNCTION public.joyeria_movimientos_pieza(_id_pieza integer)
RETURNS SETOF public.movimientos_piezas LANGUAGE sql STABLE AS $$
  SELECT * FROM movimientos_piezas WHERE id_pieza = _id_pieza ORDER BY created_at DESC, id DESC;
$$;


-- ############################################################################
-- SECCIÓN 10 - RLS en las tablas nuevas
-- ############################################################################
-- Mismo criterio que categorias (RLS ON, políticas permisivas para
-- 'authenticated'; el filtrado por empresa lo hace la capa de queries, igual
-- que el resto de la app). Diferencia clave: piezas_inventario NO tiene
-- política de DELETE -> ningún cliente con la anon/authenticated key puede
-- borrar piezas. movimientos_piezas es solo lectura + inserción (audit log).

ALTER TABLE public.producto_variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piezas_inventario  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_piezas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pv_select ON public.producto_variantes;
DROP POLICY IF EXISTS pv_insert ON public.producto_variantes;
DROP POLICY IF EXISTS pv_update ON public.producto_variantes;
DROP POLICY IF EXISTS pv_delete ON public.producto_variantes;
CREATE POLICY pv_select ON public.producto_variantes FOR SELECT TO authenticated USING (true);
CREATE POLICY pv_insert ON public.producto_variantes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY pv_update ON public.producto_variantes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY pv_delete ON public.producto_variantes FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS pi_select ON public.piezas_inventario;
DROP POLICY IF EXISTS pi_insert ON public.piezas_inventario;
DROP POLICY IF EXISTS pi_update ON public.piezas_inventario;
CREATE POLICY pi_select ON public.piezas_inventario FOR SELECT TO authenticated USING (true);
CREATE POLICY pi_insert ON public.piezas_inventario FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY pi_update ON public.piezas_inventario FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
-- (sin CREATE POLICY ... FOR DELETE a propósito)

DROP POLICY IF EXISTS mp_select ON public.movimientos_piezas;
DROP POLICY IF EXISTS mp_insert ON public.movimientos_piezas;
CREATE POLICY mp_select ON public.movimientos_piezas FOR SELECT TO authenticated USING (true);
CREATE POLICY mp_insert ON public.movimientos_piezas FOR INSERT TO authenticated WITH CHECK (true);


-- ############################################################################
-- SECCIÓN 11 - Menú / permisos
-- ############################################################################
-- NO se toca la tabla "modulos": ya existe la fila id 23 ('Inventarios',
-- link '/inventario', grupo '#operacion') y el módulo de joyería vive dentro
-- de esa misma ruta (una pestaña nueva). Así se evita el problema conocido
-- de secuencias desincronizadas en modulos/permisos.


-- ============================================================================
-- VERIFICACIÓN RÁPIDA (ejecutar en el SQL Editor después de aplicar)
-- ============================================================================
-- 1) Tablas nuevas:
--    select table_name from information_schema.tables
--     where table_schema='public'
--       and table_name in ('producto_variantes','piezas_inventario','movimientos_piezas');
--    -> 3 filas
--
-- 2) Columnas nuevas:
--    select table_name, column_name from information_schema.columns
--     where (table_name='detalle_venta' and column_name='id_pieza')
--        or (table_name='productos' and column_name in ('id_marca','es_joyeria'))
--        or (table_name='categorias' and column_name='descripcion');
--
-- 3) EAN-13 correcto (dígito verificador):
--    select public.joyeria_ean13(1, 1);   -- debe devolver 13 dígitos
--
-- 4) Flujo mínimo (ajustar ids a datos reales de tu empresa):
--    select crear_producto_joyeria('Cadena Cartier','estilo Cartier', <id_categoria>, NULL, <id_empresa>);
--    select crear_variante(<id_producto>, <id_empresa>, 'Oro', '10K', 'CAR10', 6500, 4200);
--    select * from crear_piezas_masivo(<id_variante>, <id_empresa>, <id_almacen>, <id_usuario>,
--      '[{"peso":7.8,"costo":4200,"precio_venta":6500,"cantidad":5},
--        {"peso":8.1,"costo":4350,"precio_venta":6700,"cantidad":3},
--        {"peso":10.4,"costo":5800,"precio_venta":8900,"cantidad":2}]'::jsonb);
--    -> 10 filas: CAR10-0001 .. CAR10-0010, cada una con barcode EAN-13 distinto.
--
-- 5) Escaneo:
--    select * from pos_buscar_pieza('<barcode de una pieza>', <id_empresa>);
--
-- 6) Doble venta imposible: reservá una pieza (reservar_pieza) y volvé a
--    reservarla con OTRO _id_venta -> debe tirar 'La pieza X ya no está disponible'.
--
-- 7) Borrado protegido: intentá  delete from piezas_inventario where id = <una vendida>;
--    -> debe tirar 'No se puede eliminar una pieza vendida'.
-- ============================================================================
