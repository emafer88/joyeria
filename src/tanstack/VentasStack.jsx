import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCierreCajaStore } from "../store/CierreCajaStore";
import { useUsuariosStore } from "../store/UsuariosStore";
import { useVentasStore } from "../store/VentasStore";
import { toast } from "sonner";
import { PonerVentaEnEspera } from "../supabaseCrud/crudVenta";
export const useEliminarVentasIncompletasMutate = () => {
  const queryClient = useQueryClient();
  const { eliminarventasIncompletas } = useVentasStore();
  const { datausuarios } = useUsuariosStore();
  const { dataCierreCaja } = useCierreCajaStore();
  return useMutation({
    mutationKey: ["eliminar ventas incompletas"],
    mutationFn: async () => {
      await eliminarventasIncompletas({
        id_usuario: datausuarios?.id,
        id_cierre_caja: dataCierreCaja?.id,
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["mostrar detalle venta"]);
    },
  });
};

// Guarda la venta del carrito en espera y deja el carrito vacío.
export const usePonerEnEsperaMutate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["poner venta en espera"],
    mutationFn: async () => {
      const { idventa, resetState } = useVentasStore.getState();
      await PonerVentaEnEspera({ id: idventa });
      resetState();
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["mostrar detalle venta"]);
      queryClient.invalidateQueries({ queryKey: ["ventas en espera"] });
    },
  });
};
