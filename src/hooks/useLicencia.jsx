import { useQuery } from "@tanstack/react-query";
import { MostrarPlanLicencia } from "../supabaseCrud/crudLicencia";

// Mismo criterio que licencia_tiene() en la base.
const FUNCIONES_POR_PLAN = {
  basico: [],
  tienda: ["tienda"],
  completo: ["tienda", "mercadolibre"],
};

// Rutas (y links de módulos) que solo existen si el plan incluye la función.
const FUNCION_POR_RUTA = {
  "/pedidos": "tienda",
  "/configuracion/envio": "tienda",
  "/mercadolibre": "mercadolibre",
};

export function useLicencia() {
  const { data: plan, isLoading } = useQuery({
    queryKey: ["licencia plan"],
    queryFn: MostrarPlanLicencia,
    staleTime: Infinity,
  });

  // Mientras carga, nada de lo que depende del plan se muestra.
  const tiene = (funcion) => !!FUNCIONES_POR_PLAN[plan]?.includes(funcion);

  const rutaPermitida = (to) => {
    const funcion = FUNCION_POR_RUTA[to];
    return !funcion || tiene(funcion);
  };

  return { plan, isLoading, tiene, rutaPermitida };
}
