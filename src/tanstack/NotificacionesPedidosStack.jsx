import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MarcarNotificacionLeida,
  MostrarNotificacionesPedidos,
} from "../supabaseCrud/crudNotificacionesPedidos";
import { useSupabaseSubscription } from "../hooks/useSupabaseSubscription";

const K_NOTIFICACIONES_PEDIDOS = ["notificaciones pedidos"];

export const useNotificacionesPedidosQuery = () => {
  const query = useQuery({
    queryKey: K_NOTIFICACIONES_PEDIDOS,
    queryFn: MostrarNotificacionesPedidos,
  });

  useSupabaseSubscription({
    channelName: "public:ventas",
    options: { event: "*", schema: "public", table: "ventas" },
    queryKey: K_NOTIFICACIONES_PEDIDOS,
  });

  return query;
};

export const useMarcarNotificacionLeidaMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: MarcarNotificacionLeida,
    onSuccess: () => queryClient.invalidateQueries(K_NOTIFICACIONES_PEDIDOS),
  });
};
