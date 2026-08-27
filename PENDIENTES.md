# Pendientes

## Backend/webhook para ventas de e-commerce y Mercado Libre

**Contexto:** ya está lista la base de datos para soportar ventas que vengan
de canales externos sin arriesgar el stock (ver `sql/2026-08-26_fase1_fix_race_condition_stock.sql`
y `sql/2026-08-26_fase2_venta_externa_atomica.sql`, ambos corridos en Supabase).

**Qué falta (no iniciado):** el servicio/backend que:

1. Reciba los pedidos del ecommerce propio y los webhooks de notificación de
   Mercado Libre.
2. Traduzca cada pedido al contrato que espera `crear_venta_externa`
   (parámetros `_canal`, `_id_orden_externa`, `_venta` jsonb, `_items` jsonb
   — el shape exacto está documentado como comentario arriba de la función
   en `sql/2026-08-26_fase2_venta_externa_atomica.sql`).
3. Llame al RPC `crear_venta_externa` usando la **service_role key** de
   Supabase (nunca la anon key del frontend: la función tiene revocado el
   permiso de ejecución para `anon`/`authenticated` a propósito, porque
   `ventas`/`detalle_venta`/`stock` no tienen Row Level Security habilitado).
4. Antes de esto, definir en `serializacion_comprobantes` una serie de
   comprobante propia por canal (ej. `WEB`, `ML`), separada de la que usa el
   POS, para que no se pisen los números.
5. Decidir qué `id_almacen` representa el stock "online" / disponible para
   venta por estos canales (hoy cada item de `_items` requiere `id_almacen`
   explícito).

No hay fecha definida para arrancar esto — queda anotado para cuando se
retome.
