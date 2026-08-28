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

  /** @type {import("../supabase/crudJoyeria").DisenoJoyeria|null} */
  disenoSelect: null,
  setDisenoSelect: (p) => set({ disenoSelect: p }),

  /** @type {import("../supabase/crudJoyeria").VarianteJoyeria|null} */
  varianteSelect: null,
  setVarianteSelect: (p) => set({ varianteSelect: p }),

  // Control de modales del catálogo: 'diseno' | 'variante' | null
  modal: null,
  accion: "Nuevo", // 'Nuevo' | 'Editar'
  abrirModal: (modal, accion = "Nuevo") => set({ modal, accion }),
  cerrarModal: () => set({ modal: null }),
}));
