import { useEffect, useState } from "react";
import {
  MostrarOpcionesProducto,
  OPCIONES_PRODUCTO_DEFAULT,
} from "../supabaseCrud/crudProductos";

// Switches de un formulario de producto ("Mostrar en la tienda en línea",
// "Se puede apartar"): los valores por defecto para uno nuevo; al editar, lo
// que tiene guardado. cambiar("permite_apartado") invierte ese switch.
export function useOpcionesProducto(idProducto) {
  const [opciones, setOpciones] = useState(OPCIONES_PRODUCTO_DEFAULT);
  useEffect(() => {
    if (idProducto) MostrarOpcionesProducto(idProducto).then(setOpciones);
  }, [idProducto]);
  const cambiar = (campo) => setOpciones((o) => ({ ...o, [campo]: !o[campo] }));
  return [opciones, cambiar];
}
