import { create } from "zustand";

/**
 * Filtros de la pantalla de Reportes, AISLADOS de `SucursalesStore` /
 * `AlmacenesStore` / `DashboardStore` (que son globales y los comparten el
 * POS, Inventario, el alta de productos y el Dashboard). Antes abrir Reportes
 * pisaba esa selección global y viceversa, dejando los reportes con
 * sucursal/almacén/fechas cruzados -> 0 filas o datos de otro contexto.
 *
 * `null` = "todas las sucursales" / "todos los almacenes" / "todas las fechas".
 */
export const useReportesFiltrosStore = create((set) => ({
  /** @type {{id:number, nombre:string}|null} */
  sucursalSel: null,
  /** @type {{id:number, nombre:string}|null} */
  almacenSel: null,
  /** @type {string|null} "YYYY-MM-DD" */
  fechaInicio: null,
  /** @type {string|null} "YYYY-MM-DD" */
  fechaFin: null,
  // Cambiar de sucursal invalida el almacén elegido (puede no pertenecerle).
  setSucursalSel: (s) => set({ sucursalSel: s, almacenSel: null }),
  setAlmacenSel: (a) => set({ almacenSel: a }),
  setRangoFechas: (inicio, fin) =>
    set({ fechaInicio: inicio || null, fechaFin: fin || null }),
  resetFiltros: () =>
    set({
      sucursalSel: null,
      almacenSel: null,
      fechaInicio: null,
      fechaFin: null,
    }),
}));
