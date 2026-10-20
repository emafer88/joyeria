import { useState } from "react";
import styled from "styled-components";
import { Icon } from "@iconify/react";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCierreCajaStore } from "../../../store/CierreCajaStore";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useMetodosPagoStore } from "../../../store/MetodosPagoStore";
import { useUsuariosStore } from "../../../store/UsuariosStore";
import { useFormattedDate } from "../../../hooks/useFormattedDate";
import {
  AbonarApartado,
  CancelarApartado,
  MostrarApartados,
  abonadoDe,
} from "../../../supabaseCrud/crudApartados";
import { MostrarDetalleVenta } from "../../../supabaseCrud/crudDetalleVenta";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import { tablaTarjetasMovil } from "../../../styles/tablaMovil";
import ticket from "../../../reports/TicketVenta";
import { fechaCorta, metodosAbono } from "./ModalApartar";

// Fecha local YYYY-MM-DD (en-CA usa ese formato).
const hoy = () => new Date().toLocaleDateString("en-CA");

/**
 * Apartados activos: cliente, vencimiento, total, abonado y saldo, con
 * Abonar (si cubre el saldo se liquida), Imprimir comprobante y Cancelar
 * (clave de autorización y cuánto se devuelve).
 */
export function PanelApartados() {
  const { dataCierreCaja, setStateApartados } = useCierreCajaStore();
  const { dataempresa } = useEmpresaStore();
  const { dataMetodosPago } = useMetodosPagoStore();
  const { datausuarios } = useUsuariosStore();
  const fecha = useFormattedDate();
  const queryClient = useQueryClient();
  const [buscador, setBuscador] = useState("");
  const metodos = metodosAbono(dataMetodosPago);

  const { data: apartados = [], isLoading, error } = useQuery({
    queryKey: ["apartados"],
    queryFn: MostrarApartados,
  });
  const dinero = (n) =>
    FormatearNumeroDinero(Number(n) || 0, dataempresa?.currency, dataempresa?.iso);
  const q = buscador.trim().toLowerCase();
  const filtrados = apartados.filter(
    (a) =>
      !q ||
      [a.cliente?.nombres, a.nro_comprobante].some((x) =>
        String(x || "").toLowerCase().includes(q)
      )
  );
  const refrescar = () => {
    queryClient.invalidateQueries({ queryKey: ["apartados"] });
    queryClient.invalidateQueries({ queryKey: ["ventas del turno"] });
  };

  async function imprimir(apartado, venta, pago, titulo) {
    try {
      const productos = await MostrarDetalleVenta({ id_venta: apartado.id });
      const abonado = abonadoDe(venta?.pagos ?? apartado.pagos);
      await ticket("print", {
        dataempresa,
        productos,
        dataventas: { ...apartado, ...venta },
        nombreComprobante: titulo,
        nombrecajero: datausuarios?.nombres,
        dataCliente: apartado.cliente,
        metodosPago: pago ? [pago] : [],
        apartado: {
          abonado,
          saldo: Math.max(apartado.monto_total - abonado, 0),
          vence: venta?.estado === "confirmada" ? null : fechaCorta(apartado.apartado_vence),
        },
      });
    } catch (e) {
      toast.error(`No se pudo imprimir: ${e.message}`);
    }
  }

  const abonar = useMutation({
    mutationFn: AbonarApartado,
    onError: (e) => toast.error(e.message),
    onSuccess: async (venta, vars) => {
      const liquidado = venta?.estado === "confirmada";
      toast.success(
        liquidado
          ? `Apartado ${vars.apartado.nro_comprobante} liquidado: ya es una venta`
          : "Abono registrado"
      );
      const pagos = [
        ...(vars.apartado.pagos ?? []),
        {
          tipo_movimiento: "ingreso",
          monto: vars.monto,
          vuelto: 0,
          metodos_pago: { nombre: vars.metodo },
        },
      ];
      await imprimir(
        vars.apartado,
        { ...venta, pagos },
        { tipo: vars.metodo, monto: vars.monto, vuelto: 0 },
        liquidado ? "Apartado liquidado" : "Abono a apartado"
      );
      refrescar();
    },
  });

  async function pedirAbono(a) {
    const opciones = metodos
      .map((m) => `<option value="${m.id}">${m.nombre}</option>`)
      .join("");
    const { value, isConfirmed } = await Swal.fire({
      title: `Abonar a ${a.nro_comprobante}`,
      html: `
        <p>${a.cliente?.nombres ?? ""} · saldo ${dinero(a.saldo)}</p>
        <input id="swal-monto" class="swal2-input" type="number" step="0.01" min="0"
               value="${a.saldo}" placeholder="Monto del abono">
        <select id="swal-metodo" class="swal2-select">${opciones}</select>`,
      focusConfirm: false,
      preConfirm: () => {
        const monto = parseFloat(document.getElementById("swal-monto").value);
        const idMetodo = Number(document.getElementById("swal-metodo").value);
        if (!(monto > 0)) return Swal.showValidationMessage("Escribe el monto");
        if (monto > a.saldo)
          return Swal.showValidationMessage(`El saldo es ${dinero(a.saldo)}`);
        return { monto, idMetodo };
      },
      showCancelButton: true,
      cancelButtonText: "No",
      confirmButtonText: "Abonar",
    });
    if (!isConfirmed) return;
    abonar.mutate({
      apartado: a,
      id_venta: a.id,
      monto: value.monto,
      id_metodo_pago: value.idMetodo,
      metodo: metodos.find((m) => m.id === value.idMetodo)?.nombre,
      id_cierre_caja: dataCierreCaja?.id,
      fecha,
    });
  }

  const cancelar = useMutation({
    mutationFn: CancelarApartado,
    onError: (e) => toast.error(e.message),
    onSuccess: (resultado) => {
      if (resultado === "clave_incorrecta") {
        toast.error("Clave de autorización incorrecta");
        return;
      }
      if (resultado === "bloqueado") {
        toast.error("Demasiados intentos con clave incorrecta. Espera 15 minutos.");
        return;
      }
      toast.success("Apartado cancelado: los productos regresaron al inventario");
      refrescar();
    },
  });

  async function pedirCancelacion(a) {
    const { value, isConfirmed } = await Swal.fire({
      title: `¿Cancelar el apartado ${a.nro_comprobante}?`,
      html: `
        <p>${a.cliente?.nombres ?? ""} abonó ${dinero(a.abonado)}. Los productos regresan al inventario.</p>
        <input id="swal-motivo" class="swal2-input" placeholder="Motivo (ej. venció el plazo)">
        <label style="display:block;margin-top:10px">¿Cuánto se le devuelve en efectivo? (0 a ${dinero(a.abonado)})</label>
        <input id="swal-devolver" class="swal2-input" type="number" step="0.01" min="0"
               max="${a.abonado}" value="${a.abonado}">
        <input id="swal-clave" class="swal2-input" type="password" inputmode="numeric"
               autocomplete="off" maxlength="8" placeholder="Clave de autorización">`,
      focusConfirm: false,
      preConfirm: () => {
        const motivo = document.getElementById("swal-motivo").value.trim();
        const devolver = parseFloat(document.getElementById("swal-devolver").value);
        const clave = document.getElementById("swal-clave").value.trim();
        if (!motivo) return Swal.showValidationMessage("Escribe el motivo");
        if (!(devolver >= 0) || devolver > a.abonado)
          return Swal.showValidationMessage(
            `Lo que se devuelve debe ser de 0 a ${dinero(a.abonado)}`
          );
        if (!/^[0-9]{4,8}$/.test(clave))
          return Swal.showValidationMessage(
            "La clave de autorización son de 4 a 8 números"
          );
        return { motivo, devolver, clave };
      },
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonText: "No",
      confirmButtonText: "Sí, cancelar apartado",
    });
    if (!isConfirmed) return;
    cancelar.mutate({ id_venta: a.id, id_cierre_caja: dataCierreCaja?.id, ...value });
  }

  const ocupado = abonar.isPending || cancelar.isPending;
  const totalSaldo = apartados.reduce((s, a) => s + a.saldo, 0);
  return (
    <Fondo onClick={() => setStateApartados(false)}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <h2>Apartados</h2>
            <span className="resumen">
              {apartados.length} activo{apartados.length === 1 ? "" : "s"} · por
              cobrar <strong>{dinero(totalSaldo)}</strong>
            </span>
          </div>
          <button className="cerrar" title="Cerrar" onClick={() => setStateApartados(false)}>
            <Icon icon="mdi:close" />
          </button>
        </header>
        <label className="buscar">
          <Icon icon="mdi:magnify" />
          <input
            type="search"
            placeholder="Buscar por cliente o número"
            value={buscador}
            onChange={(e) => setBuscador(e.target.value)}
          />
        </label>

        {isLoading ? (
          <p className="vacio">Cargando…</p>
        ) : error ? (
          <p className="vacio">Error: {error.message}</p>
        ) : filtrados.length === 0 ? (
          <p className="vacio">
            {apartados.length === 0
              ? 'No hay apartados activos. Se crean con "Apartar" desde el carrito.'
              : "Ningún apartado coincide con la búsqueda."}
          </p>
        ) : (
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>Apartado</th>
                  <th>Vence</th>
                  <th className="num">Total</th>
                  <th className="num">Abonado</th>
                  <th className="num">Saldo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((a) => {
                  const vencido = a.apartado_vence && a.apartado_vence < hoy();
                  return (
                    <tr key={a.id}>
                      <td className="celda-principal">
                        <span className="cliente">{a.cliente?.nombres}</span>
                        <span className="nro">{a.nro_comprobante}</span>
                      </td>
                      <td data-title="Vence">
                        {fechaCorta(a.apartado_vence)}
                        {vencido && <span className="badge">Vencido</span>}
                      </td>
                      <td data-title="Total" className="num">
                        {dinero(a.monto_total)}
                      </td>
                      <td data-title="Abonado" className="num">
                        {dinero(a.abonado)}
                      </td>
                      <td data-title="Saldo" className="num saldo">
                        {dinero(a.saldo)}
                      </td>
                      <td className="celda-acciones">
                        <div className="acciones">
                          <button
                            className="principal"
                            disabled={ocupado}
                            onClick={() => pedirAbono(a)}
                          >
                            <Icon icon="mdi:cash-plus" /> Abonar
                          </button>
                          <button
                            title="Imprimir comprobante"
                            disabled={ocupado}
                            onClick={() => imprimir(a, null, null, "Apartado")}
                          >
                            <Icon icon="mdi:printer-outline" />
                          </button>
                          <button
                            className="peligro"
                            disabled={ocupado}
                            onClick={() => pedirCancelacion(a)}
                          >
                            <Icon icon="mdi:cancel" /> Cancelar
                          </button>
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
  max-width: 960px;
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
  .buscar {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
    padding: 6px 10px;
    input {
      border: none;
      outline: none;
      background: none;
      color: ${({ theme }) => theme.text};
      font-size: 14px;
      width: 100%;
    }
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
  .saldo {
    font-weight: 700;
  }
  .cliente {
    display: block;
    font-weight: 600;
  }
  .nro {
    font-family: monospace;
    font-size: 12px;
    opacity: 0.7;
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
