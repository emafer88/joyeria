import { create } from "zustand";

/** Estado de UI del módulo de banners (selección + control de modal). El
 *  fetching/cache vive en TanStack Query (src/tanstack/BannersStack.jsx). */
export const useBannersStore = create((set) => ({
  bannerSelect: null,
  setBannerSelect: (p) => set({ bannerSelect: p }),

  modal: null, // 'form' | null
  accion: "Nuevo", // 'Nuevo' | 'Editar'
  abrirModal: (modal, accion = "Nuevo") => set({ modal, accion }),
  cerrarModal: () => set({ modal: null, bannerSelect: null }),
}));
