import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEmpresaStore } from "../store/EmpresaStore";
import {
  EliminarAtributo,
  EliminarValorAtributo,
  InsertarAtributo,
  InsertarValorAtributo,
  MostrarAtributos,
  RenombrarAtributo,
} from "../supabaseCrud/crudAtributos";

export const K_ATRIBUTOS = "atributos";

export const useAtributosQuery = () => {
  const { dataempresa } = useEmpresaStore();
  return useQuery({
    queryKey: [K_ATRIBUTOS, dataempresa?.id],
    queryFn: () => MostrarAtributos({ id_empresa: dataempresa.id }),
    enabled: !!dataempresa?.id,
  });
};

// Una mutación por acción del administrador de atributos; todas refrescan la
// lista y avisan del error.
const useMutacionAtributos = (fn, mensaje) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onError: (e) => toast.error(e.message),
    onSuccess: () => {
      if (mensaje) toast.success(mensaje);
      qc.invalidateQueries({ queryKey: [K_ATRIBUTOS] });
    },
  });
};

export const useInsertarAtributoMutation = () => {
  const { dataempresa } = useEmpresaStore();
  return useMutacionAtributos(
    (p) => InsertarAtributo({ id_empresa: dataempresa.id, ...p }),
    "Atributo creado"
  );
};
export const useRenombrarAtributoMutation = () =>
  useMutacionAtributos(RenombrarAtributo, "Atributo renombrado");
export const useEliminarAtributoMutation = () =>
  useMutacionAtributos(EliminarAtributo, "Atributo eliminado");
export const useInsertarValorMutation = () =>
  useMutacionAtributos(InsertarValorAtributo);
export const useEliminarValorMutation = () =>
  useMutacionAtributos(EliminarValorAtributo);
