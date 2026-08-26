-- ============================================================================
-- Fase 1: eliminar condición de carrera en el descuento de stock
-- ============================================================================
-- Problema: reducirstock() y validarstock() hacían "leer stock -> comparar en
-- PL/pgSQL -> recién ahí UPDATE". Entre la lectura y la escritura no había
-- ningún lock, así que dos transacciones concurrentes (dos cajas del POS, o
-- mañana el POS vs. un webhook de e-commerce/Mercado Libre) podían leer el
-- mismo stock ANTES de que cualquiera de las dos confirmara, pasar ambas la
-- validación y dejar el stock en negativo (venta de más).
--
-- Fix: mover la condición de "hay stock suficiente" al WHERE del propio
-- UPDATE (UPDATE ... WHERE stock >= cantidad). Postgres toma el lock de fila
-- en el momento del UPDATE, así que el chequeo y la resta quedan atómicos:
-- ya no hay ventana entre "leer" y "escribir". Se usa la variable implícita
-- FOUND para saber si el UPDATE efectivamente afectó una fila (= había
-- stock suficiente) y lanzar la excepción si no.
--
-- No cambian firmas, nombres de funciones/triggers, ni el resto de la lógica
-- de negocio (movimientos_stock, etiquetas de tipo_movimiento, etc. quedan
-- exactamente igual que en el dump original) para minimizar el riesgo.
--
-- Cómo aplicar: pegar este script completo en el SQL Editor de Supabase
-- (Dashboard > SQL Editor) del proyecto y ejecutarlo. Es seguro re-ejecutar
-- (usa CREATE OR REPLACE FUNCTION).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1) reducirstock: usado por EditarStock() (crudStock.jsx) para movimientos
--    manuales de stock (id de la fila de stock + cantidad a restar).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reducirstock(_id integer, cantidad numeric) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE stock
       SET stock = stock - cantidad
     WHERE id = _id
       AND stock >= cantidad;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stock insuficiente para este producto';
    END IF;
END;
$$;


-- ----------------------------------------------------------------------------
-- 2) validarstock: trigger BEFORE INSERT/UPDATE en detalle_venta. Es la
--    función que descuenta stock cada vez que se agrega/edita un ítem en
--    una venta del POS.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validarstock() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF (SELECT p.maneja_inventarios FROM productos p WHERE p.id = NEW.id_producto) THEN

        -- Incremento de cantidad sobre un detalle_venta existente (UPDATE)
        IF TG_OP = 'UPDATE' AND NEW.cantidad > OLD.cantidad THEN
            UPDATE stock
               SET stock = stock - (NEW.cantidad - OLD.cantidad)
             WHERE id_producto = NEW.id_producto
               AND id_almacen = NEW.id_almacen
               AND stock >= (NEW.cantidad - OLD.cantidad);

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Stock insuficiente para el producto %', NEW.descripcion;
            END IF;

            INSERT INTO movimientos_stock (id_almacen, id_producto, tipo_movimiento, cantidad, fecha, detalle, origen)
            VALUES (NEW.id_almacen, NEW.id_producto, 'salida', NEW.cantidad, now(), 'se edito el detalle de venta', 'ventas');
        END IF;

        -- Decremento de cantidad (se devuelve stock): no requiere chequeo,
        -- sumar siempre es seguro, no hay forma de que "falle por falta de stock".
        IF TG_OP = 'UPDATE' AND NEW.cantidad < OLD.cantidad THEN
            UPDATE stock
               SET stock = stock + (OLD.cantidad - NEW.cantidad)
             WHERE id_producto = NEW.id_producto
               AND id_almacen = NEW.id_almacen;

            INSERT INTO movimientos_stock (id_almacen, id_producto, tipo_movimiento, cantidad, fecha, detalle, origen)
            VALUES (NEW.id_almacen, NEW.id_producto, 'ingreso', NEW.cantidad, now(), 'se edito el detalle de venta', 'ventas');
        END IF;

        -- Nuevo ítem en la venta (INSERT)
        IF TG_OP = 'INSERT' THEN
            UPDATE stock
               SET stock = stock - NEW.cantidad
             WHERE id_producto = NEW.id_producto
               AND id_almacen = NEW.id_almacen
               AND stock >= NEW.cantidad;

            IF NOT FOUND THEN
                RAISE EXCEPTION 'Stock insuficiente para el producto %', NEW.descripcion;
            END IF;

            INSERT INTO movimientos_stock (id_almacen, id_producto, tipo_movimiento, cantidad, fecha, detalle, origen)
            VALUES (NEW.id_almacen, NEW.id_producto, 'ingreso', NEW.cantidad, now(), 'nuevo registro', 'ventas');
        END IF;

    END IF;

    RETURN NEW;
END;
$$;


-- ============================================================================
-- Verificación rápida después de aplicar (opcional, ejecutar en SQL Editor):
--
-- 1) Elegí un producto/almacén con stock conocido, ej. stock = 5:
--      SELECT id, id_producto, id_almacen, stock FROM stock WHERE id_producto = <ID>;
--
-- 2) Intentá insertar un detalle_venta con cantidad MAYOR al stock disponible
--    (usando una venta 'pendiente' de prueba) y confirmá que tira:
--      ERROR: Stock insuficiente para el producto ...
--    y que el stock NO quedó modificado (sigue en 5).
--
-- 3) Insertá un detalle_venta con cantidad <= stock disponible y confirmá que
--    el stock se descuenta correctamente y aparece el movimiento en
--    movimientos_stock.
--
-- No es posible probar la condición de carrera en el SQL Editor (necesita dos
-- transacciones concurrentes reales), pero el cambio elimina estructuralmente
-- la ventana de tiempo que la causaba.
-- ============================================================================
