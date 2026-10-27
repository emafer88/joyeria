import { useQuery } from "@tanstack/react-query";
import { MostrarEstadoLicencia } from "../supabaseCrud/crudLicencia";

// Mismo criterio que licencia_tiene() en la base.
const FUNCIONES_POR_PLAN = {
  basico: [],
  tienda: ["tienda"],
  completo: ["tienda", "mercadolibre"],
};

// Funciones del ramo que trae cada giro (columna `giro` de `licencia`).
//   piezas:    artículos con número de serie (pestañas Joyería, búsqueda de
//              piezas en el POS)
//   granel:    venta por peso (kg / gramo)
//   apartados: apartar con anticipo
//   tallas:    tallas en el producto
const FUNCIONES_POR_GIRO = {
  joyeria: ["piezas", "granel", "apartados", "tallas"],
  ropa: ["apartados", "tallas"],
  abarrotes: ["granel"],
  generico: ["apartados"],
};

// Rutas (y links de módulos) que solo existen si el plan incluye la función.
const FUNCION_POR_RUTA = {
  "/pedidos": "tienda",
  "/configuracion/envio": "tienda",
  "/configuracion/tienda": "tienda",
  "/mercadolibre": "mercadolibre",
};

export function useLicencia() {
  // Se revisa cada 5 minutos: si suspenden la cuenta con la app abierta, el
  // aviso aparece sin recargar.
  const { data, isLoading } = useQuery({
    queryKey: ["licencia estado"],
    queryFn: MostrarEstadoLicencia,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
  const plan = data?.plan;
  const giro = data?.giro;
  const suspendida = !!data?.suspendida;
  const mensajeSuspension = data?.mensaje;

  // Mientras carga, nada de lo que depende del plan o del giro se muestra.
  const tiene = (funcion) =>
    !!FUNCIONES_POR_PLAN[plan]?.includes(funcion) ||
    !!FUNCIONES_POR_GIRO[giro]?.includes(funcion);

  const rutaPermitida = (to) => {
    const funcion = FUNCION_POR_RUTA[to];
    return !funcion || tiene(funcion);
  };

  return { plan, giro, suspendida, mensajeSuspension, isLoading, tiene, rutaPermitida };
}
