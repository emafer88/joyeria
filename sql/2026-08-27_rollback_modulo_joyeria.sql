-- ============================================================================
-- ROLLBACK de sql/2026-08-27_modulo_joyeria.sql
-- ============================================================================
-- Deshace el módulo de inventario serializado para joyería.
--
-- OJO CON LOS DATOS: si ya cargaste diseños / variantes / piezas de prueba,
-- este script BORRA las tablas producto_variantes, piezas_inventario y
-- movimientos_piezas con todo su contenido (DROP ... CASCADE). Los diseños
-- creados con crear_producto_joyeria() quedan como filas normales en
-- "productos" (pierden solo la marca es_joyeria); borralos a mano desde la
-- pantalla de Productos si querés.
--
-- NO revierte sql/2026-08-27_familias_variantes_peso.sql (ese tiene su propio
-- rollback y es independiente de este módulo).
--
-- Cómo aplicar: pegar TODO en el SQL Editor de Supabase y ejecutar. Seguro
-- de re-ejecutar (usa IF EXISTS).
-- ============================================================================

-- 1) Triggers de integración con la venta.
DROP TRIGGER IF EXISTS zz_joyeria_detalle_venta_biu   ON public.detalle_venta;
DROP TRIGGER IF EXISTS zz_joyeria_detalle_venta_ad    ON public.detalle_venta;
DROP TRIGGER IF EXISTS zzz_joyeria_ventas_confirmar_au ON public.ventas;

-- 2) Triggers de updated_at / borrado protegido.
DROP TRIGGER IF EXISTS joyeria_categorias_set_updated_at ON public.categorias;
DROP TRIGGER IF EXISTS joyeria_productos_set_updated_at  ON public.productos;
DROP TRIGGER IF EXISTS joyeria_variantes_set_updated_at  ON public.producto_variantes;
DROP TRIGGER IF EXISTS joyeria_piezas_set_updated_at     ON public.piezas_inventario;
DROP TRIGGER IF EXISTS joyeria_pieza_bd                  ON public.piezas_inventario;

-- 3) Funciones / RPC.
DROP FUNCTION IF EXISTS public.joyeria_detalle_venta_biu();
DROP FUNCTION IF EXISTS public.joyeria_detalle_venta_ad();
DROP FUNCTION IF EXISTS public.joyeria_ventas_confirmar_au();
DROP FUNCTION IF EXISTS public.joyeria_pieza_bd();
DROP FUNCTION IF EXISTS public.joyeria_inventario_listado(integer);
DROP FUNCTION IF EXISTS public.joyeria_movimientos_pieza(integer);
DROP FUNCTION IF EXISTS public.pos_buscar_pieza(text, integer);
DROP FUNCTION IF EXISTS public.reservar_pieza(integer, integer, integer, integer);
DROP FUNCTION IF EXISTS public.liberar_pieza(integer, integer, integer);
DROP FUNCTION IF EXISTS public.ajustar_pieza(integer, integer, integer, numeric, numeric, numeric, text);
DROP FUNCTION IF EXISTS public.marcar_pieza(integer, integer, integer, text, text);
DROP FUNCTION IF EXISTS public.devolver_pieza(integer, integer, integer, text, text);
DROP FUNCTION IF EXISTS public.crear_pieza(integer, integer, integer, integer, numeric, numeric, numeric, text);
DROP FUNCTION IF EXISTS public.crear_piezas_masivo(integer, integer, integer, integer, jsonb);
DROP FUNCTION IF EXISTS public.crear_variante(integer, integer, text, text, text, numeric, numeric);
DROP FUNCTION IF EXISTS public.crear_producto_joyeria(text, text, integer, integer, integer);
DROP FUNCTION IF EXISTS public.joyeria_ean13(bigint, bigint);

-- 4) Tablas nuevas (con su contenido).
DROP TABLE IF EXISTS public.movimientos_piezas CASCADE;
DROP TABLE IF EXISTS public.piezas_inventario  CASCADE;
DROP TABLE IF EXISTS public.producto_variantes CASCADE;

-- 5) Secuencia del barcode.
DROP SEQUENCE IF EXISTS public.joyeria_barcode_seq;

-- 6) Columnas agregadas a tablas existentes.
ALTER TABLE public.detalle_venta DROP COLUMN IF EXISTS id_pieza;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'productos_id_marca_fkey') THEN
    ALTER TABLE public.productos DROP CONSTRAINT productos_id_marca_fkey;
  END IF;
END $$;

ALTER TABLE public.productos
  DROP COLUMN IF EXISTS id_marca,
  DROP COLUMN IF EXISTS descripcion,
  DROP COLUMN IF EXISTS es_joyeria,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at;

ALTER TABLE public.categorias
  DROP COLUMN IF EXISTS descripcion,
  DROP COLUMN IF EXISTS created_at,
  DROP COLUMN IF EXISTS updated_at;

-- 7) Helper de updated_at (ya sin usuarios).
DROP FUNCTION IF EXISTS public.joyeria_set_updated_at();

-- ============================================================================
-- Verificación: las 3 tablas nuevas no deben existir, y
--   select column_name from information_schema.columns
--    where table_name='detalle_venta' and column_name='id_pieza';
-- no debe devolver nada.
-- ============================================================================
