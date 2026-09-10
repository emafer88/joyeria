import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEmpresaStore } from "../store/EmpresaStore";
import {
  MostrarBanners,
  InsertarBanner,
  EditarBanner,
  EliminarBanner,
} from "../supabaseCrud/crudBanners";

export const K_BANNERS = "banners";

export const useBannersQuery = () => {
  const { dataempresa } = useEmpresaStore();
  return useQuery({
    queryKey: [K_BANNERS, dataempresa?.id],
    queryFn: () => MostrarBanners({ id_empresa: dataempresa.id }),
    enabled: !!dataempresa?.id,
    refetchOnWindowFocus: false,
  });
};

export const useGuardarBannerMutation = () => {
  const qc = useQueryClient();
  const { dataempresa } = useEmpresaStore();
  return useMutation({
    mutationFn: async ({ accion, values, file }) => {
      if (accion === "Editar") {
        return EditarBanner(
          {
            id: values.id,
            titulo: values.titulo,
            subtitulo: values.subtitulo || null,
            link_destino: values.link_destino || null,
            orden: Number(values.orden) || 0,
            activo: values.activo,
            imagen_path_anterior: values.imagen_path,
          },
          file
        );
      }
      return InsertarBanner(
        {
          titulo: values.titulo,
          subtitulo: values.subtitulo || null,
          link_destino: values.link_destino || null,
          orden: Number(values.orden) || 0,
          activo: values.activo,
          id_empresa: dataempresa.id,
        },
        file
      );
    },
    onError: (e) => toast.error(e.message),
    onSuccess: () => {
      toast.success("Banner guardado");
      qc.invalidateQueries({ queryKey: [K_BANNERS] });
    },
  });
};

export const useEliminarBannerMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (banner) => EliminarBanner(banner),
    onError: (e) => toast.error(e.message),
    onSuccess: () => {
      toast.success("Banner eliminado");
      qc.invalidateQueries({ queryKey: [K_BANNERS] });
    },
  });
};
