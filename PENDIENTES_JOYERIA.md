# Módulo de inventario de joyería — estado y pendientes

> Retomar acá. Inventario serializado: cada **pieza física** es un registro con
> SKU y código de barras únicos. Jerarquía: Categoría → Diseño (`productos`) →
> Variante (`producto_variantes`) → Pieza (`piezas_inventario`) → Movimientos
> (`movimientos_piezas`).

## Cómo levantar

```
npm run dev
```

- **Catálogo / Inventario de joyería:** Configuración → **Productos** → pestaña **Joyería**
  (sub-pestañas *Catálogo* e *Inventario*).
- **Venta de piezas:** **POS** → botón flotante abajo a la izquierda (ícono de código de barras).

`npm run build` compila OK con todas las etapas 1–6.

---

## Estado por etapa

| Etapa | Qué es | Estado | Probado en dev |
|---|---|---|---|
| 1 | SQL (tablas, RPC, triggers, RLS) | Aplicado en Supabase por el usuario | ✅ (verificación SQL OK) |
| 2 | Catálogo: alta/edición de diseños y variantes | Código listo, compila | ⬜ pendiente |
| 3 | Alta masiva de piezas | Código listo, compila | ⬜ pendiente |
| 4 | Etiquetas con código de barras (EAN-13) | Código listo, compila | ⬜ pendiente |
| 5 | Pantalla de inventario (TanStack Table) | Código listo, compila | ⬜ pendiente |
| 6 | POS: escanear pieza y agregar al carrito | Código listo, compila | ⬜ pendiente |
| 7 | Movimientos manuales (ajuste / pérdida / daño / devolución) + historial | **NO iniciado** | — |

### SQL aplicado
- `sql/2026-08-27_modulo_joyeria.sql` (corrido y verificado en Supabase).
- Rollback disponible: `sql/2026-08-27_rollback_modulo_joyeria.sql`.

### Archivos del frontend (etapas 2–6)
- `src/supabase/crudJoyeria.jsx` — todos los wrappers de RPC / queries.
- `src/store/JoyeriaStore.jsx` — selección compartida + control de modales.
- `src/tanstack/JoyeriaStack.jsx` — queries y mutations con invalidación.
- `src/components/organismos/joyeria/`
  - `FormProductoJoyeria.jsx`, `FormVariante.jsx` — alta/edición.
  - `FormAltaMasivaPiezas.jsx` — alta masiva (modal 2 fases).
  - `ListaProductosJoyeria.jsx`, `DetalleProductoJoyeria.jsx` — catálogo expandible.
  - `EtiquetaPieza.jsx` — etiqueta (preview).
  - `TablaInventarioJoyeria.jsx`, `FiltrosInventario.jsx` — pantalla de inventario.
  - `EscanerCodigoBarras.jsx`, `EscanerPiezaPos.jsx` — POS.
- `src/utils/codigoBarras.jsx` — codificador EAN-13 → SVG + `imprimirEtiquetas`.
- `src/components/template/JoyeriaTemplate.jsx` — pestaña con sub-tabs.
- Modificados: `src/components/template/ProductosTemplate.jsx` (pestaña Joyería),
  `src/components/template/POSTemplate.jsx` (`<EscanerPiezaPos />`),
  `src/index.js` (3–4 exports nuevos).
- `src/pages/Inventario.jsx` quedó **sin cambios** (se revirtió).

---

## PRUEBAS PENDIENTES (hacer en `npm run dev`)

### Etapa 2 — Catálogo (Productos → Joyería → Catálogo)
1. **Nuevo diseño**: “Cadena Cartier”, categoría “Cadenas”, descripción libre → Guardar.
2. Expandir el diseño (▸) → **+ variante**: material “Oro”, pureza “10K”,
   prefijo “CAR10” (o vacío → se deriva) → Guardar.
3. La variante aparece con `0 disp. / 0 piezas` y su prefijo.
4. Editar y eliminar diseño / variante. (Eliminar una variante/diseño con piezas
   debe fallar por el FK RESTRICT — todavía sin piezas, borra OK.)

### Etapa 3 — Alta masiva (en una variante, botón “+ piezas”)
1. Cargar 3 filas: `7.8 / 4200 / 6500 / 5`, `8.1 / 4350 / 6700 / 3`,
   `10.4 / 5800 / 8900 / 2` → **Generar piezas**.
2. Deben salir **10 piezas** `CAR10-0001` … `CAR10-0010`, cada una con un
   barcode EAN-13 distinto (aunque el peso se repita).
3. **Cerrar** → el contador de la variante dice `10 disp. / 10 piezas`;
   el toggle despliega la tabla de piezas.

### Etapa 4 — Etiquetas
1. En la fase de resultado del alta masiva se ve la **etiqueta de ejemplo**
   con el código de barras dibujado. **“Imprimir etiquetas”** abre la hoja
   con todas + diálogo de impresión.
2. Desde el toggle de piezas de una variante: tildar algunas →
   **“Imprimir selección”**; o **“Imprimir todas”**.
3. Escanear una etiqueta impresa con un lector: debe leer los 13 dígitos.
4. Si el navegador bloquea la ventana emergente, sale un aviso para habilitarla.

### Etapa 5 — Inventario (Productos → Joyería → Inventario)
1. Se ve el árbol Categoría → Diseño → Variante → Piezas, expandido.
2. Probar: filtro por **Estado = Disponible**; **orden** por Peso y por Precio
   (clic en cabecera); **búsqueda** `CAR10-0005` (usa el buscador de arriba);
   **Expandir / Colapsar todo**; **Imprimir** una variante.
3. Resumen arriba: total / disponibles / reservadas / vendidas.
4. **Nota:** esta tabla solo lista variantes **con piezas** (INNER JOIN en el RPC).
   Las variantes vacías se ven en la sub-pestaña *Catálogo*.

### Etapa 6 — POS (botón flotante de código de barras)
1. Abrir caja → abrir el panel → escanear (o teclear + Enter) el `barcode` de
   una pieza **disponible** → ficha → **Agregar al carrito** → aparece en el
   detalle de venta.
2. Volver a escanear la misma pieza → estado **Reservada**, botón deshabilitado.
3. Quitar la línea del carrito → volver a escanear → **Disponible** otra vez.
4. Agregar y **cobrar** la venta → en Joyería → Inventario la pieza queda
   **Vendida**.
5. En dos pestañas, intentar cobrar la misma pieza a la vez: la segunda falla.
6. Venta abandonada: agregar pieza, no cobrar, recargar el POS → la venta
   pendiente se borra y la pieza vuelve a **Disponible**.

---

## SIGUIENTE PASO — Etapa 7: movimientos manuales + historial

RPCs ya creados en el SQL (etapa 1), falta solo el frontend:

- **`ajustar_pieza`** — corregir peso / costo / precio de una pieza no vendida.
- **`marcar_pieza`** — marcar `perdida` / `danada`, o volver a `disponible`.
- **`devolver_pieza`** — devolución post-venta (pieza `vendida` → `disponible` o `danada`).
- **`joyeria_movimientos_pieza(_id_pieza)`** — historial de la pieza.

A construir:
1. `crudJoyeria.jsx`: wrappers `AjustarPieza`, `MarcarPieza`, `DevolverPieza`,
   `MostrarMovimientosPieza`.
2. `JoyeriaStack.jsx`: mutations (invalidar `K_PIEZAS`, `K_INV_LISTADO`,
   `K_RESUMEN_PIEZAS`) + query del historial.
3. Componentes:
   - `FormAjustePieza.jsx` — modal para ajuste / marcar / devolver (según estado
     de la pieza).
   - `HistorialPieza.jsx` — timeline de `movimientos_piezas` (tipo,
     estado anterior → nuevo, fecha, usuario, notas).
4. Enganche: en `TablaInventarioJoyeria.jsx` (fila de pieza) y/o en la lista de
   piezas de `DetalleProductoJoyeria.jsx`, agregar acciones “Ajustar”,
   “Marcar” y “Ver historial”.

No hace falta correr más SQL para la etapa 7.

---

## Notas / gotchas

- El diseño de joyería es una fila de `productos` con `es_joyeria = true` y
  `maneja_inventarios = false`, así el trigger legacy de stock por cantidad no lo toca.
- La integración con el POS es sólo la columna `detalle_venta.id_pieza` + triggers;
  el flujo de venta normal (productos por cantidad) quedó intacto.
- Toda la app está en **JavaScript/JSX** (no TypeScript) — se siguió ese patrón.
- Etiquetas: codificador EAN-13 propio, sin dependencias nuevas.
