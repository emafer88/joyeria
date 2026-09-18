import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ActualizarEstadoEnvio,
  MostrarDetallePedidoEcommerce,
  MostrarPedidosEcommerce,
} from "../supabaseCrud/crudPedidosEcommerce";

export const useMostrarPedidosEcommerceQuery = () =>
  useQuery({
    queryKey: ["pedidos ecommerce"],
    queryFn: MostrarPedidosEcommerce,
  });

export const useDetallePedidoEcommerceQuery = (idVenta) =>
  useQuery({
    queryKey: ["detalle pedido ecommerce", idVenta],
    queryFn: () => MostrarDetallePedidoEcommerce(idVenta),
    enabled: idVenta != null,
  });

export const useActualizarEstadoEnvioMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ActualizarEstadoEnvio,
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Estado actualizado");
      queryClient.invalidateQueries(["pedidos ecommerce"]);
    },
  });
};
