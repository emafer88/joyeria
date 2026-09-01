# Módulo de inventario de joyería — estado y pendientes

> **Etapas 1–7 completas y probadas en dev (2026-08-28).** Inventario serializado:
> cada **pieza física** es un registro con SKU y código de barras únicos. Jerarquía:
> Categoría → Diseño (`productos`) → Variante (`producto_variantes`) →
> Pieza (`piezas_inventario`) → Movimientos (`movimientos_piezas`).
> Pendiente opcional: endurecer la venta abandonada en el POS (ver Notas / gotchas).

## Cómo levantar

```
npm run dev
```

- **Catálogo / Inventario de joyería:** Configuración → **Productos** → pestaña **Joyería**
  (sub-pestañas _Catálogo_ e _Inventario_).
- **Venta de piezas:** **POS** → botón flotante abajo a la izquierda (ícono de código de barras).

`npm run build` compila OK con todas las etapas 1–6.

---

## Estado por etapa

| Etapa | Qué es                                                                  | Estado                              | Probado en dev                      |
| ----- | ----------------------------------------------------------------------- | ----------------------------------- | ----------------------------------- |
| 1     | SQL (tablas, RPC, triggers, RLS)                                        | Aplicado en Supabase por el usuario | ✅ (verificación SQL OK)            |
| 2     | Catálogo: alta/edición de diseños y variantes                           | Código listo, compila               | ✅ 2026-08-28                       |
| 3     | Alta masiva de piezas                                                   | Código listo, compila               | ✅ 2026-08-28                       |
| 4     | Etiquetas con código de barras (EAN-13)                                 | Código listo, compila               | ✅ 2026-08-28                       |
| 5     | Pantalla de inventario (TanStack Table)                                 | Código listo, compila               | ✅ 2026-08-28                       |
| 6     | POS: escanear pieza y agregar al carrito                                | Código listo, compila               | ✅ 2026-08-28 (tras fix, ver abajo) |
| 7     | Movimientos manuales (ajuste / pérdida / daño / devolución) + historial | Código listo, compila               | ✅ 2026-08-28                       |

### SQL aplicado

- `sql/2026-08-27_modulo_joyeria.sql` (corrido y verificado en Supabase).
- Rollback disponible: `sql/2026-08-27_rollback_modulo_joyeria.sql`.
- **`supabase/migrations/20260828193000_fix_joyeria_reserva_pieza_after_insert.sql`** (aplicado).
  Bug encontrado probando la Etapa 6: `zz_joyeria_detalle_venta_biu` era `BEFORE INSERT`
  y hacía `UPDATE piezas_inventario SET id_detalle_venta = NEW.id` cuando la fila de
  `detalle_venta` todavía no existía → violación de FK `piezas_inventario_id_detalle_venta_fkey`.
  La línea de venta nunca se creaba y la pieza quedaba `reservada` colgada; además, con
  `id_detalle_venta` en NULL, cobrar tampoco marcaba la pieza como `vendida`.
  Fix: el `BEFORE` solo normaliza `cantidad := 1`; la reserva pasa a un trigger nuevo
  `zz_joyeria_detalle_venta_ai` **`AFTER INSERT OR UPDATE`** + limpieza de piezas trabadas.

### Workflow de SQL nuevo

- A partir de ahora el SQL nuevo va como archivo en **`supabase/migrations/`**
  (`<timestamp>_descripcion.sql`), no en `sql/`. La baseline del esquema remoto está en
  `supabase/migrations/20260828181817_remote_schema.sql` (traída con `supabase db pull`).

### Archivos del frontend (etapas 2–6)

> Nota: la carpeta `src/supabase/` se renombró a **`src/supabaseCrud/`** (refactor
> general de la rama). Todas las rutas de abajo con `src/supabase/...` viven ahora
> en `src/supabaseCrud/...`.

- `src/supabaseCrud/crudJoyeria.jsx` — todos los wrappers de RPC / queries.
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
   Las variantes vacías se ven en la sub-pestaña _Catálogo_.

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

## Etapa 7: movimientos manuales + historial — CÓDIGO LISTO (compila), ⬜ probar en dev

RPCs de la etapa 1 (sin SQL nuevo): `ajustar_pieza`, `marcar_pieza`, `devolver_pieza`,
`joyeria_movimientos_pieza(_id_pieza)`.

Hecho:

- `crudJoyeria.jsx`: `AjustarPieza`, `MarcarPieza`, `DevolverPieza`, `MostrarMovimientosPieza`.
- `JoyeriaStack.jsx`: `useMovimientoPiezaMutation` (un `tipo` = 'ajuste' | 'marcar' | 'devolver'
  → la RPC correspondiente; invalida `K_PIEZAS`, `K_INV_LISTADO`, `K_RESUMEN_PIEZAS`,
  `K_MOV_PIEZA`) + `useMovimientosPiezaQuery(idPieza)`.
- `JoyeriaStore.jsx`: `piezaSelect` + `setPiezaSelect` + `abrirModalPieza(modal, pieza)`;
  `cerrarModal` ahora limpia `piezaSelect`. Modales nuevos: `'mov_pieza'`, `'historial_pieza'`.
- `FormMovimientoPieza.jsx` — modal con pestañas. Si la pieza está `vendida` → solo
  **Devolver** (destino disponible/dañada). Si no → **Ajustar** (peso/costo/precio, campo
  vacío = no toca) o **Marcar** (estado destino = disponible/dañada/perdida menos el actual).
  Nota opcional. Las validaciones fuertes las hace la BD.
- `HistorialPieza.jsx` — timeline de `movimientos_piezas` (tipo, estado ant→nuevo, fecha,
  usuario, notas).
- `JoyeriaTemplate.jsx` — renderiza los 2 modales nuevos.
- Enganche: botones ⚙ (movimiento) e 🕘 (historial) por pieza en la tabla de
  `DetalleProductoJoyeria.jsx` (Catálogo) y en la fila de pieza de `TablaInventarioJoyeria.jsx`
  (Inventario).

### Pruebas pendientes Etapa 7 (en `npm run dev`, Productos → Joyería)

1. **Ajustar**: en una pieza `disponible`, botón ⚙ → pestaña _Ajustar_ → cambiar precio
   → Registrar. El precio se actualiza en la tabla y en el historial aparece un
   movimiento `ajuste` con el "peso x→y, costo…, precio…".
2. **Marcar perdida/dañada**: ⚙ → _Marcar_ → estado `Perdida` + nota → Registrar.
   La pieza pasa a `Perdida`, el resumen de disponibles baja, historial suma `perdida`.
3. **Revertir**: en esa pieza `perdida`, ⚙ → _Marcar_ → `Disponible` → vuelve a stock.
4. **Devolver**: sobre una pieza `vendida` (cobrá una en el POS antes), ⚙ → _Devolver_
   → destino `Disponible` → la pieza vuelve a `disponible`, historial suma `devolucion`.
   Con destino `Dañada` queda `danada`.
5. **Guardas de la BD**: intentar _Ajustar_ o _Marcar_ una pieza `vendida` no debería
   ofrecerse (el modal muestra solo _Devolver_); _Devolver_ una NO vendida debe fallar
   con toast de error.
6. **Historial** (🕘): abre el timeline, más reciente arriba, con fechas locales.

---

## Notas / gotchas

- El diseño de joyería es una fila de `productos` con `es_joyeria = true` y
  `maneja_inventarios = false`, así el trigger legacy de stock por cantidad no lo toca.
- La integración con el POS es sólo la columna `detalle_venta.id_pieza` + triggers;
  el flujo de venta normal (productos por cantidad) quedó intacto.
- Toda la app está en **JavaScript/JSX** (no TypeScript) — se siguió ese patrón.
- Etiquetas: codificador EAN-13 propio, sin dependencias nuevas.
- **Venta abandonada:** si se cierra la app sin cobrar ni cancelar, la pieza queda
  `reservada` hasta que el POS se vuelva a montar y corra `EliminarVentasIncompletas`
  (borra la venta `pendiente` → cascada a `detalle_venta` → trigger
  `zz_joyeria_detalle_venta_ad` libera la pieza). Es el comportamiento del POS legacy,
  no un bug. Endurecimiento opcional pendiente: liberar al quitar del panel del escáner
  o un cleanup por antigüedad de reservas.

claude --resume abef5745-5aed-4803-8b92-b8525338f1e1
