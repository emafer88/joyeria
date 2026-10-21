import styled from "styled-components";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCierreCajaStore } from "../../../store/CierreCajaStore";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useUsuariosStore } from "../../../store/UsuariosStore";
import { useVentasStore } from "../../../store/VentasStore";
import { useDetalleVentasStore } from "../../../store/DetalleVentasStore";
import {
  EliminarVenta,
  MostrarVentasEnEspera,
  PonerVentaEnEspera,
  RetomarVentaEnEspera,
} from "../../../supabaseCrud/crudVenta";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import { tablaTarjetasMovil } from "../../../styles/tablaMovil";

const hora = (f) =>
  new Date(f).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

/**
 * Ventas en espera de la sucursal: Retomar (si el carrito tiene productos,
 * ese carrito se pone en espera en su lugar) o Descartar (los productos
 * regresan al inventario).
 */
export function PanelVentasEspera() {
  const { dataCierreCaja, setStateVentasEspera } = useCierreCajaStore();
  const { dataempresa } = useEmpresaStore();
  const { datausuarios } = useUsuariosStore();
  const { idventa, setIdventa } = useVentasStore();
  const { datadetalleventa } = useDetalleVentasStore();
  const queryClient = useQueryClient();
  const idSucursal = dataCierreCaja?.caja?.id_sucursal;

  const { data: ventas = [], isLoading, error } = useQuery({
    queryKey: ["ventas en espera", idSucursal],
    queryFn: () => MostrarVentasEnEspera({ id_sucursal: idSucursal }),
    enabled: !!idSucursal,
  });
  const dinero = (n) =>
    FormatearNumeroDinero(Number(n) || 0, dataempresa?.currency, dataempresa?.iso);
  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ["ventas en espera"] });
    queryClient.invalidateQueries(["mostrar detalle venta"]);
  };

  const retomar = useMutation({
    mutationFn: async (venta) => {
      const carritoConProductos = idventa > 0 && datadetalleventa?.length > 0;
      if (carritoConProductos) {
        await PonerVentaEnEspera({ id: idventa });
      }
      await RetomarVentaEnEspera({
        id: venta.id,
        id_cierre_caja: dataCierreCaja?.id,
        id_usuario: datausuarios?.id,
      });
      return carritoConProductos;
    },
    onError: (e) => {
      toast.error(e.message);
      refrescar();
    },
    onSuccess: (carritoEnEspera, venta) => {
      setIdventa(venta.id);
      toast.success(
        carritoEnEspera
          ? "Venta retomada; la que tenías en el carrito quedó en espera"
          : "Venta retomada"
      );
      refrescar();
      setStateVentasEspera(false);
    },
  });

  const descartar = useMutation({
    mutationFn: (venta) => EliminarVenta({ id: venta.id }),
    onError: (e) => toast.error(e.message),
    onSuccess: () => {
      toast.success("Venta descartada: los productos regresaron al inventario");
      refrescar();
    },
  });

  async function pedirDescarte(venta) {
    const { isConfirmed } = await Swal.fire({
      title: "¿Descartar esta venta en espera?",
      text: `${venta.productos.join(", ")} · ${dinero(venta.total)}. Los productos regresan al inventario.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonText: "No",
      confirmButtonText: "Sí, descartar",
    });
    if (isConfirmed) descartar.mutate(venta);
  }

  const ocupado = retomar.isPending || descartar.isPending;
  const cerrar = () => setStateVentasEspera(false);
  return (
    <Fondo onClick={cerrar}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <h2>Ventas en espera</h2>
            <span className="resumen">
              {ventas.length} en espera
            </span>
          </div>
          <button className="cerrar" title="Cerrar" onClick={cerrar}>
            <Icon icon="mdi:close" />
          </button>
        </header>

        {isLoading ? (
          <p className="vacio">Cargando…</p>
        ) : error ? (
          <p className="vacio">Error: {error.message}</p>
        ) : ventas.length === 0 ? (
          <p className="vacio">
            No hay ventas en espera. Se crean con "En espera" desde el carrito.
          </p>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Productos</th>
                  <th>Hora</th>
                  <th className="num">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => (
                  <tr key={v.id}>
                    <td className="celda-principal">
                      <span className="productos">{v.productos.join(", ")}</span>
                      <span className="cajero">{v.cajero?.nombres}</span>
                    </td>
                    <td data-title="Hora">{hora(v.fecha)}</td>
                    <td data-title="Total" className="num total">
                      {dinero(v.total)}
                    </td>
                    <td className="celda-acciones">
                      <div className="acciones">
                        <button
                          className="principal"
                          disabled={ocupado}
                          onClick={() => retomar.mutate(v)}
                        >
                          <Icon icon="mdi:cart-arrow-down" /> Retomar
                        </button>
                        <button
                          className="peligro"
                          disabled={ocupado}
                          onClick={() => pedirDescarte(v)}
                        >
                          <Icon icon="mdi:delete-outline" /> Descartar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </Fondo>
  );
}

const Fondo = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: rgba(18, 18, 18, 0.5);
`;
const Panel = styled.div`
  width: 100%;
  max-width: 760px;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    h2 {
      margin: 0 0 4px;
      font-size: 22px;
    }
  }
  .resumen {
    opacity: 0.8;
    font-size: 14px;
  }
  .cerrar {
    background: none;
    border: none;
    font-size: 26px;
    cursor: pointer;
    color: ${({ theme }) => theme.text};
    display: flex;
  }
  .vacio {
    text-align: center;
    opacity: 0.6;
    font-style: italic;
    padding: 30px 0;
  }
  .scroll {
    overflow: auto;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  thead th {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 2px solid ${({ theme }) => theme.color2};
    white-space: nowrap;
    opacity: 0.8;
  }
  tbody td {
    padding: 10px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
  }
  .num {
    text-align: right;
    white-space: nowrap;
  }
  .total {
    font-weight: 700;
  }
  .productos {
    display: block;
    font-weight: 600;
  }
  .cajero {
    font-size: 12px;
    opacity: 0.7;
  }
  .acciones {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }
  .acciones button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: none;
    color: ${({ theme }) => theme.text};
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }
  .acciones button.principal {
    background: #0930bb;
    border-color: #0930bb;
    color: #fff;
  }
  .acciones button.peligro {
    color: #c0392b;
    border-color: #f1b7b0;
  }
  .acciones button:disabled {
    opacity: 0.5;
    cursor: wait;
  }

  ${tablaTarjetasMovil}
`;
