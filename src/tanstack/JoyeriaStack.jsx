import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEmpresaStore } from "../store/EmpresaStore";
import { useUsuariosStore } from "../store/UsuariosStore";
import { useVentasStore } from "../store/VentasStore";
import { useCierreCajaStore } from "../store/CierreCajaStore";
import { useProductosStore } from "../store/ProductosStore";
import {
  CrearProductoJoyeria,
  MostrarProductosJoyeria,
  EditarProductoJoyeria,
  EliminarProductoJoyeria,
  CrearVariante,
  MostrarVariantes,
  EditarVariante,
  EliminarVariante,
  ResumenPiezasPorDiseno,
  MostrarMarcasJoyeria,
  MostrarCategoriasJoyeria,
  CrearPiezasMasivo,
  MostrarPiezasVariante,
  MostrarAlmacenesJoyeria,
  MostrarInventarioListado,
  PosBuscarPiezasTexto,
  ReservarPieza,
  InsertarLineaPieza,
  AjustarPieza,
  MarcarPieza,
  DevolverPieza,
  MostrarMovimientosPieza,
  MostrarImagenesVariante,
  SubirImagenesVariante,
  EliminarImagenVariante,
  ReordenarImagenesVariante,
} from "../supabaseCrud/crudJoyeria";

export const K_DISENOS = "joyeria_disenos";
export const K_VARIANTES = "joyeria_variantes";
export const K_RESUMEN_PIEZAS = "joyeria_resumen_piezas";
export const K_PIEZAS = "joyeria_piezas";
export const K_INV_LISTADO = "joyeria_inv_listado";
export const K_MOV_PIEZA = "joyeria_mov_pieza";
export const K_IMG_VARIANTE = "joyeria_img_variante";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const useProductosJoyeriaQuery = () => {
  const { dataempresa } = useEmpresaStore();
  return useQuery({
    queryKey: [K_DISENOS, dataempresa?.id],
    queryFn: () => MostrarProductosJoyeria({ id_empresa: dataempresa.id }),
    enabled: !!dataempresa?.id,
    refetchOnWindowFocus: false,
  });
};

export const useVariantesQuery = (idProducto) =>
  useQuery({
    queryKey: [K_VARIANTES, idProducto],
    queryFn: () => MostrarVariantes({ id_producto: idProducto }),
    enabled: !!idProducto,
    refetchOnWindowFocus: false,
  });

export const useResumenPiezasQuery = (idProducto) =>
  useQuery({
    queryKey: [K_RESUMEN_PIEZAS, idProducto],
    queryFn: () => ResumenPiezasPorDiseno({ id_producto: idProducto }),
    enabled: !!idProducto,
    refetchOnWindowFocus: false,
  });

export const useMarcasJoyeriaQuery = () => {
  const { dataempresa } = useEmpresaStore();
  return useQuery({
    queryKey: ["joyeria_marcas", dataempresa?.id],
    queryFn: () => MostrarMarcasJoyeria({ id_empresa: dataempresa.id }),
    enabled: !!dataempresa?.id,
    refetchOnWindowFocus: false,
  });
};

export const useCategoriasJoyeriaQuery = () => {
  const { dataempresa } = useEmpresaStore();
  return useQuery({
    queryKey: ["joyeria_categorias", dataempresa?.id],
    queryFn: () => MostrarCategoriasJoyeria({ id_empresa: dataempresa.id }),
    enabled: !!dataempresa?.id,
    refetchOnWindowFocus: false,
  });
};

/**
 * Búsqueda de piezas por texto (nombre/SKU/código) para el buscador
 * principal del POS. Usa el mismo texto que la búsqueda de productos
 * normales (ProductosStore.buscador) para que ambas listas se combinen.
 */
export const useBuscarPiezasPosQuery = () => {
  const { dataempresa } = useEmpresaStore();
  const { buscador } = useProductosStore();
  return useQuery({
    queryKey: [K_PIEZAS, "pos_texto", dataempresa?.id, buscador],
    queryFn: () =>
      PosBuscarPiezasTexto({ id_empresa: dataempresa?.id, buscador }),
    enabled: !!dataempresa?.id,
    refetchOnWindowFocus: false,
  });
};

export const usePiezasVarianteQuery = (idVariante) =>
  useQuery({
    queryKey: [K_PIEZAS, idVariante],
    queryFn: () => MostrarPiezasVariante({ id_variante: idVariante }),
    enabled: !!idVariante,
    refetchOnWindowFocus: false,
  });

export const useAlmacenesJoyeriaQuery = () => {
  const { dataempresa } = useEmpresaStore();
  return useQuery({
    queryKey: ["joyeria_almacenes", dataempresa?.id],
    queryFn: () => MostrarAlmacenesJoyeria({ id_empresa: dataempresa.id }),
    enabled: !!dataempresa?.id,
    refetchOnWindowFocus: false,
  });
};

export const useInventarioListadoQuery = () => {
  const { dataempresa } = useEmpresaStore();
  return useQuery({
    queryKey: [K_INV_LISTADO, dataempresa?.id],
    queryFn: () => MostrarInventarioListado({ id_empresa: dataempresa.id }),
    enabled: !!dataempresa?.id,
    refetchOnWindowFocus: false,
  });
};

/** Historial (kardex) de una pieza. Se carga solo cuando hay idPieza. */
export const useMovimientosPiezaQuery = (idPieza) =>
  useQuery({
    queryKey: [K_MOV_PIEZA, idPieza],
    queryFn: () => MostrarMovimientosPieza({ id_pieza: idPieza }),
    enabled: !!idPieza,
    refetchOnWindowFocus: false,
  });

/** Galería de imágenes de una variante (se carga solo cuando hay idVariante). */
export const useImagenesVarianteQuery = (idVariante) =>
  useQuery({
    queryKey: [K_IMG_VARIANTE, idVariante],
    queryFn: () => MostrarImagenesVariante(idVariante),
    enabled: !!idVariante,
    refetchOnWindowFocus: false,
  });

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const num = (v) =>
  v === "" || v === null || v === undefined ? null : Number(v);

export const useGuardarDisenoMutation = () => {
  const qc = useQueryClient();
  const { dataempresa } = useEmpresaStore();
  return useMutation({
    mutationFn: async ({ accion, values }) => {
      if (accion === "Editar") {
        await EditarProductoJoyeria({
          id: values.id,
          nombre: values.nombre,
          descripcion: values.descripcion || null,
          id_categoria: num(values.id_categoria),
          id_marca: num(values.id_marca),
        });
        return values.id;
      }
      return CrearProductoJoyeria({
        _nombre: values.nombre,
        _descripcion: values.descripcion || null,
        _id_categoria: num(values.id_categoria),
        _id_marca: num(values.id_marca),
        _id_empresa: dataempresa.id,
      });
    },
    onError: (e) => toast.error(e.message),
    onSuccess: () => {
      toast.success("Diseño guardado");
      qc.invalidateQueries({ queryKey: [K_DISENOS] });
    },
  });
};

export const useEliminarDisenoMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => EliminarProductoJoyeria({ id }),
    onError: (e) =>
      toast.error(
        "No se pudo eliminar el diseño (¿tiene piezas cargadas?): " + e.message,
      ),
    onSuccess: () => {
      toast.success("Diseño eliminado");
      qc.invalidateQueries({ queryKey: [K_DISENOS] });
    },
  });
};

export const useGuardarVarianteMutation = () => {
  const qc = useQueryClient();
  const { dataempresa } = useEmpresaStore();
  return useMutation({
    mutationFn: async ({ accion, values, idProducto }) => {
      if (accion === "Editar") {
        await EditarVariante({
          id: values.id,
          material: values.material,
          pureza: values.pureza || null,
          precio_venta_sugerido: num(values.precio_venta_sugerido),
          precio_compra_sugerido: num(values.precio_compra_sugerido),
          notas: values.notas || null,
        });
        return values.id;
      }
      return CrearVariante({
        _id_producto: idProducto,
        _id_empresa: dataempresa.id,
        _material: values.material,
        _pureza: values.pureza || null,
        _sku_prefijo: values.sku_prefijo || null,
        _precio_venta_sugerido: num(values.precio_venta_sugerido),
        _precio_compra_sugerido: num(values.precio_compra_sugerido),
      });
    },
    onError: (e) => toast.error(e.message),
    onSuccess: (_data, vars) => {
      toast.success("Variante guardada");
      qc.invalidateQueries({ queryKey: [K_VARIANTES, vars.idProducto] });
    },
  });
};

export const useEliminarVarianteMutation = (idProducto) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => EliminarVariante({ id }),
    onError: (e) =>
      toast.error(
        "No se pudo eliminar la variante (¿tiene piezas cargadas?): " +
          e.message,
      ),
    onSuccess: () => {
      toast.success("Variante eliminada");
      qc.invalidateQueries({ queryKey: [K_VARIANTES, idProducto] });
    },
  });
};

/**
 * Agrega una pieza escaneada al carrito del POS: si no hay venta pendiente la
 * crea, reserva la pieza (atómico) y crea la línea de venta con id_pieza.
 * No toca el flujo legacy del POS.
 */
export const useAgregarPiezaCarritoMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pieza) => {
      if (pieza?.estado !== "disponible") {
        throw new Error(
          `La pieza no está disponible (${pieza?.estado ?? "desconocido"})`,
        );
      }
      const empresa = useEmpresaStore.getState().dataempresa;
      const usuario = useUsuariosStore.getState().datausuarios;
      const cierre = useCierreCajaStore.getState().dataCierreCaja;
      const ventas = useVentasStore.getState();
      const fecha = new Date(
        Date.now() - new Date().getTimezoneOffset() * 60000,
      )
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      let ventaId = ventas.idventa;
      if (!ventaId || ventaId === 0) {
        const nueva = await ventas.insertarVentas({
          fecha,
          id_usuario: usuario?.id,
          id_sucursal: cierre?.caja?.id_sucursal,
          id_empresa: empresa?.id,
          id_cierre_caja: cierre?.id,
        });
        ventaId = nueva?.id;
      }
      if (!ventaId) throw new Error("No se pudo crear la venta");

      await ReservarPieza({
        id_pieza: pieza.id_pieza,
        id_venta: ventaId,
        id_empresa: empresa?.id,
        id_usuario: usuario?.id,
      });

      await InsertarLineaPieza({
        id_venta: ventaId,
        id_producto: pieza.id_producto,
        id_pieza: pieza.id_pieza,
        precio_venta: pieza.precio_venta,
        costo: pieza.costo,
        descripcion: `${pieza.producto} · ${pieza.material} ${
          pieza.pureza ?? ""
        } · ${pieza.peso} g`
          .replace(/\s+/g, " ")
          .trim(),
        id_sucursal: cierre?.caja?.id_sucursal,
        id_almacen: pieza.id_almacen,
      });
    },
    onError: (e) => toast.error(e.message),
    onSuccess: () => {
      toast.success("Pieza agregada al carrito");
      qc.invalidateQueries({ queryKey: ["mostrar detalle venta"] });
      qc.invalidateQueries({ queryKey: [K_INV_LISTADO] });
    },
  });
};

/**
 * Movimiento manual sobre una pieza: ajuste (peso/costo/precio), marcar
 * (perdida / danada / disponible) o devolución post-venta. `tipo` decide qué
 * RPC se llama; invalida piezas, inventario, resumen e historial de la pieza.
 */
export const useMovimientoPiezaMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tipo, pieza, values }) => {
      const empresa = useEmpresaStore.getState().dataempresa;
      const usuario = useUsuariosStore.getState().datausuarios;
      const base = {
        id_pieza: pieza.id_pieza ?? pieza.id,
        id_empresa: empresa?.id,
        id_usuario: usuario?.id ?? null,
      };
      if (tipo === "ajuste") {
        return AjustarPieza({
          ...base,
          peso: num(values.peso),
          costo: num(values.costo),
          precio_venta: num(values.precio_venta),
          nota: values.nota || null,
        });
      }
      if (tipo === "marcar") {
        return MarcarPieza({ ...base, estado: values.estado, nota: values.nota || null });
      }
      if (tipo === "devolver") {
        return DevolverPieza({
          ...base,
          destino: values.destino,
          nota: values.nota || null,
        });
      }
      throw new Error(`Tipo de movimiento inválido: ${tipo}`);
    },
    onError: (e) => toast.error(e.message),
    onSuccess: (_data, vars) => {
      toast.success("Movimiento registrado");
      qc.invalidateQueries({ queryKey: [K_PIEZAS] });
      qc.invalidateQueries({ queryKey: [K_INV_LISTADO] });
      qc.invalidateQueries({ queryKey: [K_RESUMEN_PIEZAS] });
      qc.invalidateQueries({
        queryKey: [K_MOV_PIEZA, vars.pieza.id_pieza ?? vars.pieza.id],
      });
    },
  });
};

// ---------------------------------------------------------------------------
// Imágenes de la variante
// ---------------------------------------------------------------------------

export const useSubirImagenesVarianteMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ idVariante, files, ordenInicial }) =>
      SubirImagenesVariante(idVariante, files, ordenInicial),
    onError: (e) => toast.error(e.message),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [K_IMG_VARIANTE, vars.idVariante] });
      qc.invalidateQueries({ queryKey: [K_VARIANTES] });
    },
  });
};

export const useEliminarImagenVarianteMutation = (idVariante) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imagen) => EliminarImagenVariante(imagen),
    onError: (e) => toast.error(e.message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [K_IMG_VARIANTE, idVariante] });
      qc.invalidateQueries({ queryKey: [K_VARIANTES] });
    },
  });
};

export const useReordenarImagenesVarianteMutation = (idVariante) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imagenes) => ReordenarImagenesVariante(imagenes),
    onError: (e) => toast.error(e.message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [K_IMG_VARIANTE, idVariante] });
      qc.invalidateQueries({ queryKey: [K_VARIANTES] });
    },
  });
};

export const useCrearPiezasMasivoMutation = () => {
  const qc = useQueryClient();
  const { dataempresa } = useEmpresaStore();
  const { datausuarios } = useUsuariosStore();
  return useMutation({
    mutationFn: ({ idVariante, idAlmacen, lineas }) =>
      CrearPiezasMasivo({
        _id_variante: idVariante,
        _id_empresa: dataempresa.id,
        _id_almacen: idAlmacen ? Number(idAlmacen) : null,
        _id_usuario: datausuarios?.id ?? null,
        _lineas: lineas,
      }),
    onError: (e) => toast.error(e.message),
    onSuccess: (data, vars) => {
      toast.success(`${data.length} pieza(s) generada(s)`);
      qc.invalidateQueries({ queryKey: [K_PIEZAS, vars.idVariante] });
      qc.invalidateQueries({ queryKey: [K_RESUMEN_PIEZAS] });
      qc.invalidateQueries({ queryKey: [K_VARIANTES] });
      qc.invalidateQueries({ queryKey: [K_INV_LISTADO] });
    },
  });
};
