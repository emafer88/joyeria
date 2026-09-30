import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GuardarDisenoML,
  MostrarCuentaML,
  MostrarDisenosML,
  MostrarDisenosSinConfigurarML,
  MostrarOrdenesML,
  MostrarPublicacionesML,
  PrevisualizarDisenoML,
  SincronizarML,
} from "../supabaseCrud/crudMercadoLibre";

// Todas las queries del panel comparten el prefijo "mercadolibre" para
// refrescarlas juntas después de guardar o sincronizar.
const CLAVE = "mercadolibre";

export const useCuentaMLQuery = () =>
  useQuery({ queryKey: [CLAVE, "cuenta"], queryFn: MostrarCuentaML });

export const useDisenosMLQuery = () =>
  useQuery({ queryKey: [CLAVE, "disenos"], queryFn: MostrarDisenosML });

export const useDisenosSinConfigurarMLQuery = (enabled) =>
  useQuery({
    queryKey: [CLAVE, "disenos sin configurar"],
    queryFn: MostrarDisenosSinConfigurarML,
    enabled,
  });

// Lo que se publicaría del diseño (grupos, precios, fotos) para revisarlo
// antes de guardar.
export const usePrevisualizarDisenoMLQuery = (idProducto) =>
  useQuery({
    queryKey: [CLAVE, "previsualizar", idProducto],
    queryFn: () => PrevisualizarDisenoML(idProducto),
    enabled: !!idProducto,
  });

export const usePublicacionesMLQuery = () =>
  useQuery({ queryKey: [CLAVE, "publicaciones"], queryFn: MostrarPublicacionesML });

export const useOrdenesMLQuery = () =>
  useQuery({ queryKey: [CLAVE, "ordenes"], queryFn: MostrarOrdenesML });

// La sincronización con ML corre en segundo plano (Edge Function): se
// vuelve a leer a los pocos segundos para mostrar el resultado.
function refrescarDespues(queryClient) {
  queryClient.invalidateQueries({ queryKey: [CLAVE] });
  setTimeout(() => queryClient.invalidateQueries({ queryKey: [CLAVE] }), 6000);
}

export const useGuardarDisenoMLMutation = ({ onSuccess } = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: GuardarDisenoML,
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Guardado. Mercado Libre se actualiza en unos segundos");
      refrescarDespues(queryClient);
      onSuccess?.();
    },
  });
};

export const useSincronizarMLMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: SincronizarML,
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Sincronización pedida");
      refrescarDespues(queryClient);
    },
  });
};
