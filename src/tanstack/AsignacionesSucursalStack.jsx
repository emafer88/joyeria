import { useQuery } from "@tanstack/react-query";
import { useCajasStore } from "../store/CajasStore";
import { useAsignacionCajaSucursalStore } from "../store/AsignacionCajaSucursalStore";
import { useUsuariosStore } from "../store/UsuariosStore";

export const useMostrarSucursalAsignadasQuery = () => {
  const { mostrarSucursalAsignadas } = useAsignacionCajaSucursalStore();
  const { datausuarios } = useUsuariosStore();
  return useQuery({
    queryKey: [
      "mostrar sucursales asignadas",
      {
        id_usuario: datausuarios?.id,
      },
    ],
    queryFn: () =>
      mostrarSucursalAsignadas({
        id_usuario: datausuarios?.id,
      }),
    // datausuarios arranca como [] (truthy): esperar a que tenga id.
    enabled: !!datausuarios?.id,
  });
};
