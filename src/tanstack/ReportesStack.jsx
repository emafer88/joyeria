import { useQuery } from "@tanstack/react-query";
import { useEmpresaStore } from "../store/EmpresaStore";

import { useDashboardStore } from "../store/DashboardStore";
import { useReportesStore } from "../store/ReportesStore";
import { useReportStore } from "../store/ReportStore";
import { useReportesFiltrosStore } from "../store/ReportesFiltrosStore";
import { DesgloseVentasDashboard } from "../supabaseCrud/crudDashboard";
export const useMostrarVentasDashboardQuery = () => {
  const { dataempresa } = useEmpresaStore();
  const { fechaInicio, fechaFin } = useDashboardStore();
  const { mostrarVentasDashboard } = useReportesStore();
  return useQuery({
    queryKey: [
      "mostrar Ventas Dashboard",
      {
        _id_empresa: dataempresa?.id,
        _fecha_inicio: fechaInicio,
        _fecha_fin: fechaFin,
      },
    ],
    queryFn: () =>
      mostrarVentasDashboard({
        _id_empresa: dataempresa?.id,
        _fecha_inicio: fechaInicio,
        _fecha_fin: fechaFin,
      }),
    enabled: !!dataempresa,
  });
};
export const useMostrarCantidadDetalleVentaDashboardQuery = () => {
  const { dataempresa } = useEmpresaStore();
  const { fechaInicio, fechaFin } = useDashboardStore();
  const { mostrarVentasDashboard, mostrarCantidadDetalleVentasDashboard } =
    useReportesStore();
  return useQuery({
    queryKey: [
      "mostrar cantidad detalle Ventas Dashboard",
      {
        _id_empresa: dataempresa?.id,
        _fecha_inicio: fechaInicio,
        _fecha_fin: fechaFin,
      },
    ],
    queryFn: () =>
      mostrarCantidadDetalleVentasDashboard({
        _id_empresa: dataempresa?.id,
        _fecha_inicio: fechaInicio,
        _fecha_fin: fechaFin,
      }),
    enabled: !!dataempresa,
  });
};
export const useMostrarCantidadDetalleVentaPeriodoAnteriorDashboardQuery =
  () => {
    const { dataempresa } = useEmpresaStore();
    const { setFechasAnteriores } = useDashboardStore();
    const { mostrarCantidadDetalleVentasDashboard } = useReportesStore();
    const fechasAnteriores = setFechasAnteriores();
    return useQuery({
      queryKey: [
        "mostrar cantidad detalle Ventas Dashboard",
        {
          _id_empresa: dataempresa?.id,
          _fecha_inicio: fechasAnteriores?.fechaAnteriorInicio,
          _fecha_fin: fechasAnteriores?.fechaAnteriorFin,
        },
      ],
      queryFn: () =>
        mostrarCantidadDetalleVentasDashboard({
          _id_empresa: dataempresa?.id,
          _fecha_inicio: fechasAnteriores?.fechaAnteriorInicio,
          _fecha_fin: fechasAnteriores?.fechaAnteriorFin,
        }),
      enabled: !!dataempresa,
    });
  };
export const useMostrarVentasDashboardPeriodoAnteriorQuery = () => {
  const { dataempresa } = useEmpresaStore();
  const { fechaInicio, fechaFin, setFechasAnteriores } = useDashboardStore();

  const {
    mostrarVentasDashboardPeriodoAnterior,
    mostrarVentasDashboard,
    sinPeriodoAnterior,
  } = useReportesStore();
  const fechasAnteriores = setFechasAnteriores();
  return useQuery({
    queryKey: [
      "mostrar Ventas Dashboard periodo anterior",
      {
        _id_empresa: dataempresa?.id,
        _fecha_inicio: fechasAnteriores?.fechaAnteriorInicio,
        _fecha_fin: fechasAnteriores?.fechaAnteriorFin,
      },
    ],
    queryFn: () =>
      fechasAnteriores?.fechaAnteriorInicio
        ? mostrarVentasDashboardPeriodoAnterior({
            _id_empresa: dataempresa?.id,
            _fecha_inicio: fechasAnteriores?.fechaAnteriorInicio,
            _fecha_fin: fechasAnteriores?.fechaAnteriorFin,
          })
        : sinPeriodoAnterior(),
    enabled: !!dataempresa,
    refetchOnWindowFocus: false,
  });
};
export const useGananciasDetalleVentaQuery = () => {
  const { dataempresa } = useEmpresaStore();
  const { fechaInicio, fechaFin } = useDashboardStore();

  const { mostrarGananciasDetalleVenta } = useReportesStore();

  return useQuery({
    queryKey: [
      "mostrar ganancias detalle venta",
      {
        _id_empresa: dataempresa?.id,
        _fecha_inicio: fechaInicio,
        _fecha_fin: fechaFin,
      },
    ],
    queryFn: () =>
      mostrarGananciasDetalleVenta({
        _id_empresa: dataempresa?.id,
        _fecha_inicio: fechaInicio,
        _fecha_fin: fechaFin,
      }),
    enabled: !!dataempresa,
    refetchOnWindowFocus: false,
  });
};
export const useReporteInventarioValoradoQuery = () => {
  const { dataempresa } = useEmpresaStore();
  const { reportStockPorAlmacenSucursal } = useReportStore();
  const { sucursalSel, almacenSel } = useReportesFiltrosStore();
  const params = {
    _id_empresa: dataempresa?.id,
    sucursal_id: sucursalSel?.id ?? null,
    almacen_id: almacenSel?.id ?? null,
  };

  return useQuery({
    queryKey: ["reporte de inventario valorado", params],
    queryFn: () => reportStockPorAlmacenSucursal(params),
    enabled: !!dataempresa?.id,
    refetchOnWindowFocus: false,
  });
};
// Número de ventas, ticket promedio y desglose por método de pago y canal.
export const useDesgloseVentasDashboardQuery = () => {
  const { dataempresa } = useEmpresaStore();
  const { fechaInicio, fechaFin } = useDashboardStore();
  const params = {
    _id_empresa: dataempresa?.id,
    _fecha_inicio: fechaInicio,
    _fecha_fin: fechaFin,
  };
  return useQuery({
    queryKey: ["desglose ventas dashboard", params],
    queryFn: () => DesgloseVentasDashboard(params),
    enabled: !!dataempresa?.id && !!fechaInicio && !!fechaFin,
    refetchOnWindowFocus: false,
  });
};
