import { useState } from "react";
import styled from "styled-components";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Btn1 } from "../../moleculas/Btn1";
import { InputText2 } from "../formularios/InputText2";
import { RegistrarClientesProveedores } from "../formularios/RegistrarClientesProveedores";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useVentasStore } from "../../../store/VentasStore";
import { useDetalleVentasStore } from "../../../store/DetalleVentasStore";
import { useMetodosPagoStore } from "../../../store/MetodosPagoStore";
import { useCierreCajaStore } from "../../../store/CierreCajaStore";
import { useUsuariosStore } from "../../../store/UsuariosStore";
import { useClientesProveedoresStore } from "../../../store/ClientesProveedoresStore";
import { useFormattedDate } from "../../../hooks/useFormattedDate";
import { BuscarClientesProveedores } from "../../../supabaseCrud/crudClientesProveedores";
import { CrearApartado } from "../../../supabaseCrud/crudApartados";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import ticket from "../../../reports/TicketVenta";

// Métodos con los que se puede dar un anticipo o abono.
export const metodosAbono = (metodos) =>
  (metodos ?? []).filter((m) => !["Credito", "Mixto"].includes(m.nombre));

export const fechaCorta = (f) =>
  f
    ? new Date(`${f}T12:00:00`).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

/**
 * Apartar la venta del carrito: cliente (obligatorio), anticipo (mínimo el %
 * configurado en Empresa) y cómo lo paga. La base valida todo de nuevo en
 * crear_apartado.
 */
export function ModalApartar() {
  const { setStateApartar } = useCierreCajaStore();
  const { dataempresa } = useEmpresaStore();
  const { idventa, resetState } = useVentasStore();
  const { datadetalleventa, total } = useDetalleVentasStore();
  const { dataMetodosPago } = useMetodosPagoStore();
  const { datausuarios } = useUsuariosStore();
  const fecha = useFormattedDate();
  const queryClient = useQueryClient();

  const pct = Number(dataempresa?.apartado_anticipo_pct ?? 20);
  const minimo = Math.round(total * pct) / 100;
  const metodos = metodosAbono(dataMetodosPago);
  const [buscador, setBuscador] = useState("");
  const [cliente, setCliente] = useState(null);
  const [nuevoCliente, setNuevoCliente] = useState(false);
  const [anticipo, setAnticipo] = useState(minimo ? String(minimo) : "");
  const [idMetodo, setIdMetodo] = useState(metodos[0]?.id ?? null);

  const { data: clientes = [] } = useQuery({
    queryKey: ["buscar cliente apartado", buscador],
    queryFn: () =>
      BuscarClientesProveedores({
        id_empresa: dataempresa?.id,
        tipo: "cliente",
        buscador,
      }),
    enabled: !!dataempresa && !cliente,
  });

  const dinero = (n) =>
    FormatearNumeroDinero(Number(n) || 0, dataempresa?.currency, dataempresa?.iso);
  const monto = parseFloat(anticipo) || 0;

  const { mutate, isPending } = useMutation({
    mutationFn: CrearApartado,
    onError: (e) => toast.error(e.message),
    onSuccess: async (venta) => {
      toast.success(`Apartado ${venta.nro_comprobante} guardado`);
      const metodo = metodos.find((m) => m.id === idMetodo);
      try {
        await ticket("print", {
          dataempresa,
          productos: datadetalleventa,
          dataventas: venta,
          nombreComprobante: "Apartado",
          nombrecajero: datausuarios?.nombres,
          dataCliente: cliente,
          metodosPago: [{ tipo: metodo?.nombre, monto, vuelto: 0 }],
          apartado: {
            abonado: monto,
            saldo: venta.monto_total - monto,
            vence: fechaCorta(venta.apartado_vence),
          },
        });
      } catch (e) {
        toast.error(`No se pudo imprimir: ${e.message}`);
      }
      resetState();
      setStateApartar(false);
      queryClient.invalidateQueries({ queryKey: ["mostrar detalle venta"] });
      queryClient.invalidateQueries({ queryKey: ["apartados"] });
    },
  });

  function guardar(e) {
    e.preventDefault();
    if (!cliente) return toast.error("Elige el cliente que aparta");
    if (monto < minimo)
      return toast.error(`El anticipo mínimo es ${dinero(minimo)} (${pct}%)`);
    if (monto >= total)
      return toast.error("Si paga el total, cóbrala como venta normal");
    mutate({
      id_venta: idventa,
      id_cliente: cliente.id,
      anticipo: monto,
      id_metodo_pago: idMetodo,
      fecha,
    });
  }

  return (
    <Fondo onClick={() => setStateApartar(false)}>
      <Caja onSubmit={guardar} onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>Apartar</h2>
          <button type="button" className="cerrar" onClick={() => setStateApartar(false)}>
            <Icon icon="mdi:close" />
          </button>
        </header>

        <div className="totales">
          <span>
            Total <strong>{dinero(total)}</strong>
          </span>
          <span>
            Anticipo mínimo ({pct}%) <strong>{dinero(minimo)}</strong>
          </span>
        </div>

        <label className="etiqueta">Cliente</label>
        {cliente ? (
          <div className="cliente-elegido">
            <span>{cliente.nombres}</span>
            <button type="button" onClick={() => setCliente(null)}>
              Cambiar
            </button>
          </div>
        ) : (
          <>
            <div className="fila">
              <InputText2>
                <input
                  className="form__field"
                  placeholder="buscar cliente por nombre"
                  value={buscador}
                  onChange={(e) => setBuscador(e.target.value)}
                />
              </InputText2>
              <button
                type="button"
                className="nuevo"
                onClick={() => {
                  // El alta usa el tipo del store (cliente/proveedor).
                  useClientesProveedoresStore.getState().setTipo("cliente");
                  setNuevoCliente(true);
                }}
              >
                <Icon icon="mdi:account-plus-outline" /> Nuevo
              </button>
            </div>
            <ul className="lista">
              {clientes.slice(0, 6).map((c) => (
                <li key={c.id} onClick={() => setCliente(c)}>
                  {c.nombres}
                  {c.telefono && c.telefono !== "-" && <small> · {c.telefono}</small>}
                </li>
              ))}
              {clientes.length === 0 && (
                <li className="vacio">Sin clientes con ese nombre</li>
              )}
            </ul>
          </>
        )}

        <label className="etiqueta">Anticipo</label>
        <div className="fila">
          <InputText2>
            <input
              className="form__field"
              type="number"
              step="0.01"
              min="0"
              value={anticipo}
              onChange={(e) => setAnticipo(e.target.value)}
            />
          </InputText2>
          <select value={idMetodo ?? ""} onChange={(e) => setIdMetodo(Number(e.target.value))}>
            {metodos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>
        <span className="saldo">
          Queda por pagar: <strong>{dinero(Math.max(total - monto, 0))}</strong> · plazo{" "}
          {dataempresa?.apartado_dias ?? 30} días
        </span>

        <Btn1
          type="submit"
          bgcolor="#0930bb"
          color="#fff"
          width="100%"
          disabled={isPending}
          titulo={isPending ? "Guardando..." : "Apartar e imprimir comprobante"}
        />
      </Caja>
      {nuevoCliente && (
        <div onClick={(e) => e.stopPropagation()}>
          <RegistrarClientesProveedores
            setIsExploding={() => {}}
            accion="Nuevo"
            onClose={() => {
              setNuevoCliente(false);
              queryClient.invalidateQueries({ queryKey: ["buscar cliente apartado"] });
            }}
          />
        </div>
      )}
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
const Caja = styled.form`
  width: 100%;
  max-width: 440px;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    h2 {
      margin: 0;
      font-size: 22px;
    }
  }
  .cerrar {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: ${({ theme }) => theme.text};
    display: flex;
  }
  .totales {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 15px;
  }
  .totales span {
    display: flex;
    justify-content: space-between;
  }
  .etiqueta {
    font-weight: 600;
    margin-top: 6px;
  }
  .fila {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .fila > :first-child {
    flex: 1;
  }
  .nuevo,
  .cliente-elegido button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: none;
    color: ${({ theme }) => theme.text};
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 13px;
    cursor: pointer;
    white-space: nowrap;
  }
  .cliente-elegido {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 700;
    padding: 8px 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
  }
  .lista {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
    max-height: 180px;
    overflow-y: auto;
  }
  .lista li {
    padding: 8px 10px;
    cursor: pointer;
  }
  .lista li:hover {
    background: ${({ theme }) => theme.color2};
  }
  .lista li.vacio {
    opacity: 0.6;
    cursor: default;
    font-style: italic;
  }
  select {
    padding: 10px;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: none;
    color: ${({ theme }) => theme.text};
    font-size: 14px;
  }
  .saldo {
    font-size: 14px;
    opacity: 0.85;
  }
`;
