import { useState } from "react";
import styled from "styled-components";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCierreCajaStore } from "../../../store/CierreCajaStore";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { usePermisosDeMenu } from "../../../hooks/usePermisosDeMenu";
import {
  AnularVenta,
  MostrarNombresComprobante,
  MostrarVentasTurno,
} from "../../../supabaseCrud/crudVenta";
import { MostrarDetalleVenta } from "../../../supabaseCrud/crudDetalleVenta";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import { tablaTarjetasMovil } from "../../../styles/tablaMovil";
import ticket from "../../../reports/TicketVenta";

const hora = (f) =>
  new Date(f).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

// Lo que se cobró por método (efectivo neto del cambio), sin las salidas de
// una cancelación.
const pagosDe = (venta) =>
  (venta.pagos ?? [])
    .filter((p) => p.tipo_movimiento === "ingreso")
    .map((p) => ({
      tipo: p.metodos_pago?.nombre ?? "-",
      monto: Number(p.monto),
      vuelto: Number(p.vuelto) || 0,
    }));

/**
 * Panel "Ventas del turno": las ventas cobradas en el turno de caja abierto,
 * con reimpresión del ticket y cancelación (anular_venta en la base).
 */
export function VentasTurno() {
  const { dataCierreCaja, setStateVentasTurno } = useCierreCajaStore();
  const { dataempresa } = useEmpresaStore();
  const { puedeCancelarVentas } = usePermisosDeMenu();
  const queryClient = useQueryClient();
  const [imprimiendo, setImprimiendo] = useState(null);
  const idCierre = dataCierreCaja?.id;
  const idSucursal = dataCierreCaja?.caja?.id_sucursal;

  const { data: ventas = [], isLoading, error } = useQuery({
    queryKey: ["ventas del turno", idCierre],
    queryFn: () => MostrarVentasTurno({ id_cierre_caja: idCierre }),
    enabled: !!idCierre,
  });
  const { data: comprobantes = {} } = useQuery({
    queryKey: ["nombres comprobante", idSucursal],
    queryFn: () => MostrarNombresComprobante({ id_sucursal: idSucursal }),
    enabled: !!idSucursal,
  });

  const dinero = (n) =>
    FormatearNumeroDinero(Number(n), dataempresa?.currency, dataempresa?.iso);
  const cobradas = ventas.filter((v) => v.estado === "confirmada");
  const totalTurno = cobradas.reduce((s, v) => s + Number(v.monto_total), 0);

  async function reimprimir(venta) {
    setImprimiendo(venta.id);
    try {
      const productos = await MostrarDetalleVenta({ id_venta: venta.id });
      await ticket("print", {
        dataempresa,
        productos,
        dataventas: venta,
        nombreComprobante:
          comprobantes[venta.nro_comprobante?.split("-")[0]] ?? "Comprobante",
        nombrecajero: venta.cajero?.nombres,
        dataCliente: venta.cliente,
        metodosPago: pagosDe(venta),
      });
    } catch (e) {
      toast.error(`No se pudo imprimir: ${e.message}`);
    } finally {
      setImprimiendo(null);
    }
  }

  const { mutate: anular, isPending: anulando } = useMutation({
    mutationFn: AnularVenta,
    onError: (e) => toast.error(e.message),
    onSuccess: () => {
      toast.success("Venta cancelada: se regresó el inventario y el dinero");
      queryClient.invalidateQueries({ queryKey: ["ventas del turno"] });
      queryClient.invalidateQueries({ queryKey: ["mostrar existencias"] });
    },
  });

  async function cancelar(venta) {
    const { value: motivo, isConfirmed } = await Swal.fire({
      title: `¿Cancelar la venta ${venta.nro_comprobante}?`,
      html: `Se devuelven ${dinero(venta.monto_total)} de la caja y los productos regresan al inventario.`,
      input: "text",
      inputPlaceholder: "Motivo (ej. el cliente devolvió la pieza)",
      inputValidator: (v) => (!v?.trim() ? "Escribe el motivo" : undefined),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonText: "No",
      confirmButtonText: "Sí, cancelar venta",
    });
    if (isConfirmed) anular({ id_venta: venta.id, motivo: motivo.trim() });
  }

  return (
    <Fondo onClick={() => setStateVentasTurno(false)}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <h2>Ventas del turno</h2>
            <span className="resumen">
              {cobradas.length} venta{cobradas.length === 1 ? "" : "s"} ·{" "}
              <strong>{dinero(totalTurno)}</strong>
            </span>
          </div>
          <button
            className="cerrar"
            title="Cerrar"
            onClick={() => setStateVentasTurno(false)}
          >
            <Icon icon="mdi:close" />
          </button>
        </header>

        {isLoading ? (
          <p className="vacio">Cargando…</p>
        ) : error ? (
          <p className="vacio">Error: {error.message}</p>
        ) : ventas.length === 0 ? (
          <p className="vacio">Todavía no hay ventas cobradas en este turno.</p>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Comprobante</th>
                  <th>Hora</th>
                  <th>Cliente</th>
                  <th>Pago</th>
                  <th className="num">Total</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => {
                  const anulada = v.estado === "anulada";
                  return (
                    <tr key={v.id} className={anulada ? "anulada" : ""}>
                      <td className="celda-principal">
                        <span className="nro">{v.nro_comprobante}</span>
                        {anulada && (
                          <span className="badge" title={v.motivo_anulacion}>
                            Cancelada
                          </span>
                        )}
                        {anulada && v.motivo_anulacion && (
                          <span className="motivo">{v.motivo_anulacion}</span>
                        )}
                      </td>
                      <td data-title="Hora">{hora(v.fecha)}</td>
                      <td data-title="Cliente">{v.cliente?.nombres ?? "-"}</td>
                      <td data-title="Pago">
                        {pagosDe(v)
                          .map((p) => p.tipo)
                          .join(", ") || "-"}
                      </td>
                      <td data-title="Total" className="num total">
                        {dinero(v.monto_total)}
                      </td>
                      <td className="celda-acciones">
                        <div className="acciones">
                          <button
                            onClick={() => reimprimir(v)}
                            disabled={imprimiendo === v.id}
                          >
                            <Icon icon="mdi:printer-outline" />
                            {imprimiendo === v.id ? "…" : "Reimprimir"}
                          </button>
                          {!anulada && puedeCancelarVentas && (
                            <button
                              className="peligro"
                              onClick={() => cancelar(v)}
                              disabled={anulando}
                            >
                              <Icon icon="mdi:cancel" /> Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
  max-width: 920px;
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
  .nro {
    font-family: monospace;
    font-weight: 600;
  }
  .badge {
    margin-left: 8px;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    background: #fbdad6;
    color: #a5342a;
  }
  .motivo {
    display: block;
    font-size: 12px;
    opacity: 0.7;
    margin-top: 2px;
  }
  tr.anulada .total {
    text-decoration: line-through;
    opacity: 0.6;
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
