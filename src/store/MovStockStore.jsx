import { create } from "zustand";
import {
  InsertarMovStock,
  MostrarMovStock,
} from "../supabaseCrud/crudMovStock";

export const useMovStockStore = create((set) => ({
  tipo: "ingreso",
  setTipo: (p) => {
    set({ tipo: p });
  },
  // Talla/color elegida para la entrada o salida ({ id, id_producto, talla,
  // color }); null en productos sin combinaciones.
  combinacion: null,
  setCombinacion: (p) => {
    set({ combinacion: p });
  },
  insertarMovStock: async (p) => {
    await InsertarMovStock(p);
  },
  mostrarMovStock: async (p) => {
    const result = await MostrarMovStock(p);
    return result;
  },
}));
