import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmpresaStore } from "..";
import { toast } from "sonner";
import { useGlobalStore } from "../store/GlobalStore";
import { GuardarDisenoTienda, GuardarPaletaAdmin } from "../supabaseCrud/crudEmpresa";

export const useUpdateEmpresaMutation = ( ) => {
  const queyClient = useQueryClient();
  const { dataempresa, editarEmpresa } = useEmpresaStore();
  const {file} = useGlobalStore()
  return useMutation({
    mutationKey: ["editar empresa"],
    mutationFn: async (data) => {
 
    const p = {
        id: dataempresa?.id,
        nombre: data.nombre,
        direccion_fiscal: data.direccion,
        impuesto: data.impuesto,
        valor_impuesto: parseFloat(data.valor_impuesto),
        apartado_anticipo_pct: parseFloat(data.apartado_anticipo_pct),
        apartado_dias: parseInt(data.apartado_dias, 10),
      };
      await editarEmpresa(p,dataempresa?.logo,file);
    },
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Datos guardados");
      queyClient.invalidateQueries(["mostrar empresa"]);
    },
  });
};
export const useUpdateEmpresaEnvioMutation = () => {
  const {file} = useGlobalStore()
  const queyClient = useQueryClient();
  const { dataempresa, editarEmpresa } = useEmpresaStore();
  return useMutation({
    mutationKey: ["editar empresa"],
    mutationFn: async (data) => {
      const p = {
        id: dataempresa?.id,
        costo_envio: parseFloat(data.costo_envio),
      };
      await editarEmpresa(p, dataempresa?.logo, file);
    },
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Datos guardados");
      queyClient.invalidateQueries(["mostrar empresa"]);
    },
  });
};
export const useUpdateEmpresaTicketMutation = () => {
  const {file} = useGlobalStore()
    const queyClient = useQueryClient();
    const { dataempresa, editarEmpresa } = useEmpresaStore();
    return useMutation({
      mutationKey: ["editar empresa"],
      mutationFn: async (data) => {
        const p = {
          id: dataempresa?.id,
          nombre: data?.nombre,
          id_fiscal: data?.id_fiscal,
          direccion_fiscal: data?.direccion_fiscal,
          nombre_moneda: data?.nombre_moneda,
          pie_pagina_ticket: data?.pie_pagina_ticket,
        };
    
        await editarEmpresa(p,dataempresa?.logo,file);
      },
      onError: (error) => toast.error(error.message),
      onSuccess: () => {
        toast.success("Datos guardados");
        queyClient.invalidateQueries(["mostrar empresa"]);
      },
    });
  };
export const useGuardarPaletaMutation = () => {
  const queyClient = useQueryClient();
  const { dataempresa } = useEmpresaStore();
  return useMutation({
    mutationKey: ["guardar paleta"],
    mutationFn: (paleta) =>
      GuardarPaletaAdmin({ _id_empresa: dataempresa?.id, _paleta: paleta }),
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Paleta guardada");
      queyClient.invalidateQueries(["mostrar empresa"]);
    },
  });
};
// Funciones del giro apagadas (Configuración → Empresa → Funciones).
export const useGuardarFuncionesMutation = () => {
  const queyClient = useQueryClient();
  const { dataempresa, editarEmpresa } = useEmpresaStore();
  return useMutation({
    mutationKey: ["guardar funciones"],
    mutationFn: (apagadas) =>
      editarEmpresa({ id: dataempresa?.id, funciones_apagadas: apagadas }, "-", "-"),
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Funciones guardadas");
      queyClient.invalidateQueries(["mostrar empresa"]);
    },
  });
};
export const useGuardarDisenoTiendaMutation = () => {
  const queyClient = useQueryClient();
  const { dataempresa } = useEmpresaStore();
  return useMutation({
    mutationKey: ["guardar diseno tienda"],
    mutationFn: (diseno) =>
      GuardarDisenoTienda({ _id_empresa: dataempresa?.id, _diseno: diseno }),
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Diseño publicado en la tienda");
      queyClient.invalidateQueries(["mostrar empresa"]);
    },
  });
};
