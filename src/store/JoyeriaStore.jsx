import { create } from "zustand";

/**
 * Estado global MÍNIMO del módulo de joyería: solo lo que necesitan compartir
 * varias pantallas (la selección de diseño/variante y el control de modales
 * del catálogo). Todo el fetching/cache vive en TanStack Query
 * (src/tanstack/JoyeriaStack.jsx), no acá.
 */
export const useJoyeriaStore = create((set) => ({
  buscador: "",
  setBuscador: (p) => set({ buscador: p }),

  /** @type {import("../supabaseCrud/crudJoyeria").DisenoJoyeria|null} */
  disenoSelect: null,
  setDisenoSelect: (p) => set({ disenoSelect: p }),

  /** @type {import("../supabaseCrud/crudJoyeria").VarianteJoyeria|null} */
  varianteSelect: null,
  setVarianteSelect: (p) => set({ varianteSelect: p }),

  /** @type {any|null} pieza sobre la que se abre un modal de movimiento/historial */
  piezaSelect: null,
  setPiezaSelect: (p) => set({ piezaSelect: p }),

  // Control de modales:
  //  catálogo:      'diseno' | 'variante' | 'piezas_masivo'
  //  pieza (etapa 7): 'mov_pieza' | 'historial_pieza'
  modal: null,
  accion: "Nuevo", // 'Nuevo' | 'Editar'
  abrirModal: (modal, accion = "Nuevo") => set({ modal, accion }),
  abrirModalPieza: (modal, pieza) => set({ modal, piezaSelect: pieza }),
  cerrarModal: () => set({ modal: null, piezaSelect: null }),
}));
