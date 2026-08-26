-- ============================================================================
-- Fase 2: punto de entrada atómico + idempotente para ventas de canales
-- externos (ecommerce propio, Mercado Libre, etc.)
-- ============================================================================
-- No se toca el flujo del POS (InsertarVentas -> N x insertardetalleventa ->
-- confirmar_venta). Eso se deja como está: la venta "pendiente" persistida
-- en la BD ítem a ítem es intencional, para sobrevivir a un refresh de
-- pantalla, y ya quedó protegida por la Fase 1.
--
-- Para pedidos que llegan COMPLETOS desde afuera (un webhook de e-commerce o
-- de Mercado Libre trae todos los ítems de una), no tiene sentido replicar
-- ese flujo de varios round-trips. Se agrega una única función
-- crear_venta_externa() que crea la venta + todos sus ítems en UNA sola
-- transacción real: si cualquier ítem no tiene stock, el RAISE EXCEPTION
-- revierte automáticamente TODO (venta y los ítems que ya se habían
-- insertado en esa misma llamada) porque toda la función corre dentro de la
-- transacción implícita de una única invocación de Postgres.
--
-- IMPORTANTE - seguridad: ventas/detalle_venta/stock NO tienen Row Level
-- Security habilitado en esta base (a diferencia de categorias/multiprecios,
-- que sí). Esta función genera comprobantes oficiales y confirma ventas
-- directamente (sin pasar por caja), así que NO debe quedar accesible con la
-- anon key del frontend. Al final del script se revoca el permiso de
-- ejecución para anon/authenticated: solo debe llamarse con la service_role
-- key, desde tu backend/webhook handler de e-commerce o Mercado Libre —
-- nunca desde el navegador.
--
-- Cómo aplicar: pegar este script completo en el SQL Editor de Supabase y
-- ejecutarlo. Es seguro re-ejecutar (usa IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1) Columnas nuevas en ventas: de qué canal vino y cuál es su id de orden
--    externa (para idempotencia frente a reintentos de webhook).
-- ----------------------------------------------------------------------------
ALTER TABLE public.ventas
    ADD COLUMN IF NOT EXISTS origen text NOT NULL DEFAULT 'pos',
    ADD COLUMN IF NOT EXISTS id_orden_externa text;

-- Una misma orden externa (por canal) no puede generar dos ventas.
CREATE UNIQUE INDEX IF NOT EXISTS ventas_origen_orden_externa_uq
    ON public.ventas (origen, id_orden_externa)
    WHERE id_orden_externa IS NOT NULL;


-- ----------------------------------------------------------------------------
-- 2) crear_venta_externa: crea la venta + sus ítems en una sola transacción.
--
-- Contrato de los parámetros JSON:
--
-- _venta (objeto):
--   {
--     "id_usuario": <bigint, opcional>,
--     "id_sucursal": <bigint, requerido>,
--     "id_empresa": <bigint, requerido>,
--     "id_cliente": <bigint, opcional>,
--     "id_tipo_comprobante": <integer, requerido>,
--     "serie": "<text, requerido>",       -- serie del comprobante para este canal
--     "fecha": "<timestamp, opcional>",   -- default now()
--     "monto_total": <numeric, requerido>,
--     "sub_total": <numeric, opcional>,
--     "total_impuestos": <numeric, opcional>,
--     "valor_impuesto": <numeric, opcional>,
--     "referencia_tarjeta": "<text, opcional>"
--   }
--
-- _items (array de objetos), uno por producto vendido:
--   [
--     {
--       "id_producto": <bigint, requerido>,
--       "id_almacen": <bigint, requerido>,   -- almacén que representa el stock "online"
--       "cantidad": <numeric, requerido>,
--       "precio_venta": <numeric, requerido>,
--       "precio_compra": <numeric, opcional>,
--       "descripcion": "<text, opcional>"
--     },
--     ...
--   ]
--
-- Recomendación: configurar en serializacion_comprobantes una serie propia
-- para ventas de e-commerce / Mercado Libre (ej. "WEB", "ML"), separada de
-- la serie que usa el POS, así los números de comprobante no se pisan.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.crear_venta_externa(
    _canal text,
    _id_orden_externa text,
    _venta jsonb,
    _items jsonb
) RETURNS SETOF public.ventas
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_venta bigint;
    v_nro_comprobante text;
    v_item jsonb;
BEGIN
    IF _canal IS NULL OR _id_orden_externa IS NULL THEN
        RAISE EXCEPTION 'crear_venta_externa requiere _canal y _id_orden_externa';
    END IF;

    -- Camino rápido de idempotencia: si ya existe una venta para esta orden
    -- externa, devolverla tal cual, sin reprocesar ni volver a tocar stock.
    RETURN QUERY
        SELECT * FROM ventas WHERE origen = _canal AND id_orden_externa = _id_orden_externa;
    IF FOUND THEN
        RETURN;
    END IF;

    SELECT generar_nro_comprobante(
        (_venta->>'id_tipo_comprobante')::integer,
        _venta->>'serie',
        (_venta->>'id_sucursal')::integer
    ) INTO v_nro_comprobante;

    BEGIN
        INSERT INTO ventas (
            fecha, id_usuario, id_sucursal, id_empresa, id_cliente,
            monto_total, sub_total, total_impuestos, valor_impuesto,
            referencia_tarjeta, cantidad_productos,
            estado, nro_comprobante, origen, id_orden_externa
        ) VALUES (
            COALESCE((_venta->>'fecha')::timestamp, now()),
            (_venta->>'id_usuario')::bigint,
            (_venta->>'id_sucursal')::bigint,
            (_venta->>'id_empresa')::bigint,
            (_venta->>'id_cliente')::bigint,
            (_venta->>'monto_total')::numeric,
            COALESCE((_venta->>'sub_total')::numeric, (_venta->>'monto_total')::numeric),
            COALESCE((_venta->>'total_impuestos')::numeric, 0),
            COALESCE((_venta->>'valor_impuesto')::numeric, 0),
            COALESCE(_venta->>'referencia_tarjeta', '-'),
            COALESCE(jsonb_array_length(_items), 0),
            'confirmada',
            v_nro_comprobante,
            _canal,
            _id_orden_externa
        )
        RETURNING id INTO v_id_venta;
    EXCEPTION WHEN unique_violation THEN
        -- Otra llamada concurrente (ej. reintento de webhook llegado casi al
        -- mismo tiempo) ya insertó esta misma orden externa: devolver esa
        -- fila en vez de duplicar la venta.
        RETURN QUERY
            SELECT * FROM ventas WHERE origen = _canal AND id_orden_externa = _id_orden_externa;
        RETURN;
    END;

    -- Insertar cada ítem. El trigger validarstock (ya corregido en la Fase 1)
    -- descuenta el stock de forma atómica y lanza excepción si no alcanza;
    -- al ser todo una sola función, esa excepción revierte también el
    -- INSERT de la venta y los ítems ya insertados en esta misma llamada.
    FOR v_item IN SELECT * FROM jsonb_array_elements(_items)
    LOOP
        INSERT INTO detalle_venta (
            id_venta, id_producto, cantidad, precio_venta,
            precio_compra, descripcion, total, id_sucursal, id_almacen
        ) VALUES (
            v_id_venta,
            (v_item->>'id_producto')::bigint,
            (v_item->>'cantidad')::numeric,
            (v_item->>'precio_venta')::numeric,
            (v_item->>'precio_compra')::numeric,
            v_item->>'descripcion',
            (v_item->>'cantidad')::numeric * (v_item->>'precio_venta')::numeric,
            (_venta->>'id_sucursal')::bigint,
            (v_item->>'id_almacen')::bigint
        );
    END LOOP;

    RETURN QUERY SELECT * FROM ventas WHERE id = v_id_venta;
END;
$$;

-- Solo debe poder llamarla el backend (service_role), nunca el navegador.
REVOKE ALL ON FUNCTION public.crear_venta_externa(text, text, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.crear_venta_externa(text, text, jsonb, jsonb) FROM anon;
REVOKE ALL ON FUNCTION public.crear_venta_externa(text, text, jsonb, jsonb) FROM authenticated;


-- ============================================================================
-- Verificación rápida después de aplicar (SQL Editor):
--
-- 1) Sale exitosa (ajustar ids a datos reales de tu empresa):
--    select * from crear_venta_externa(
--      'ecommerce', 'ORDEN-TEST-001',
--      '{"id_sucursal": 1, "id_empresa": 1, "id_tipo_comprobante": 1,
--        "serie": "WEB", "monto_total": 100}'::jsonb,
--      '[{"id_producto": 1, "id_almacen": 1, "cantidad": 1, "precio_venta": 100}]'::jsonb
--    );
--    -> debe crear la venta, descontar stock del producto 1 en almacén 1, y
--       devolver la fila con estado 'confirmada' y nro_comprobante generado.
--
-- 2) Idempotencia: volver a ejecutar EXACTAMENTE la misma llamada de arriba
--    (mismo 'ORDEN-TEST-001') -> debe devolver la MISMA venta (mismo id),
--    sin crear una segunda ni volver a descontar stock.
--
-- 3) Stock insuficiente: repetir con otra orden ('ORDEN-TEST-002') pidiendo
--    una cantidad mayor al stock disponible -> debe tirar
--    'Stock insuficiente para el producto ...' y NO debe quedar ninguna
--    venta 'ORDEN-TEST-002' en la tabla ventas (todo se revierte).
--
-- 4) Confirmar que un usuario con la anon key (el que usa el frontend) NO
--    puede ejecutar esta función (debe dar error de permiso).
-- ============================================================================
