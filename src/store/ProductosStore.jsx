import { create } from "zustand";
import {
  BuscarProductos,MostrarProductos,EliminarProductos,InsertarProductos,EditarProductos, Generarcodigo,
  MostrarImagenesProducto,SubirImagenesProducto,EliminarImagenProducto,ReordenarImagenesProducto,
  supabase
} from "../index";
const tabla ="productos"
export const useProductosStore = create((set, get) => ({
  refetchs:null,
  buscador: "",
  setBuscador: (p) => {
    set({ buscador: p });
  },
  dataProductos: [],
  productosItemSelect: {
    id:1
  },
  parametros: {},
  mostrarProductos: async (p) => {
    const response = await MostrarProductos(p);
    set({ parametros: p });
    set({ dataProductos: response });
    set({ productosItemSelect: response[0] });
    set({refetchs:p.refetchs})
    return response;
  },
  selectProductos: (p) => {
   
    set({ productosItemSelect: p });

  },
  resetProductosItemSelect: () => {
    set({ productosItemSelect: null });
  },
  insertarProductos: async (p) => {
  const response=  await InsertarProductos(p);
    const { mostrarProductos } = get();
    const { parametros } = get();
    set(mostrarProductos(parametros));
    return response;
  },
  eliminarProductos: async (p) => {
    await EliminarProductos(p);
    const { mostrarProductos } = get();
    const { parametros } = get();
    set(mostrarProductos(parametros));
  },
  editarProductos: async (p) => {
    await EditarProductos(p);
    const { mostrarProductos } = get();
    const { parametros } = get();
    set(mostrarProductos(parametros));
  },
  buscarProductos: async (p) => {
    const response = await BuscarProductos(p);
    set({ dataProductos: response });
    return response;
  },
  codigogenerado:0,
  generarCodigo:()=>{
  const response=  Generarcodigo({id:2})
  set({codigogenerado:response})
  
 
  },
  editarPreciosProductos: async (p) => {
    const { error } = await supabase.from(tabla).update(p).eq("id", p.id);
    if (error) {
      throw new Error(error.message);
    }
  },
  imagenesProducto: [],
  mostrarImagenesProducto: async (idProducto) => {
    const response = await MostrarImagenesProducto(idProducto);
    set({ imagenesProducto: response });
    return response;
  },
  subirImagenesProducto: async (idProducto, files, ordenInicial) => {
    const subidas = await SubirImagenesProducto(idProducto, files, ordenInicial);
    const { imagenesProducto } = get();
    set({ imagenesProducto: [...imagenesProducto, ...subidas] });
    return subidas;
  },
  eliminarImagenProducto: async (imagen) => {
    await EliminarImagenProducto(imagen);
    const { imagenesProducto } = get();
    set({ imagenesProducto: imagenesProducto.filter((img) => img.id !== imagen.id) });
  },
  reordenarImagenesProducto: async (imagenes) => {
    await ReordenarImagenesProducto(imagenes);
    const nuevoOrden = new Map(imagenes.map((img) => [img.id, img.orden]));
    const { imagenesProducto } = get();
    set({
      imagenesProducto: imagenesProducto
        .map((img) => ({ ...img, orden: nuevoOrden.get(img.id) ?? img.orden }))
        .sort((a, b) => a.orden - b.orden),
    });
  },
}));
