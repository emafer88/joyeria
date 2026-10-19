import { useEffect, useState } from "react";
import { MostrarVisibleEcommerce } from "../supabaseCrud/crudProductos";

// Estado del switch "Mostrar en la tienda en línea" de un formulario de
// producto: true para uno nuevo; al editar, lo que tiene guardado.
export function useVisibleEcommerce(idProducto) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (idProducto) MostrarVisibleEcommerce(idProducto).then(setVisible);
  }, [idProducto]);
  return [visible, setVisible];
}
