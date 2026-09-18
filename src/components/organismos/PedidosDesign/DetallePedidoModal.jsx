import styled from "styled-components";
import { Icon } from "@iconify/react/dist/iconify.js";
import { BtnClose } from "../../ui/buttons/BtnClose";
import { useDetallePedidoEcommerceQuery } from "../../../tanstack/PedidosEcommerceStack";

const METODOS_PAGO = {
  credit_card: "Tarjeta de crédito",
  debit_card: "Tarjeta de débito",
  prepaid_card: "Tarjeta prepaga",
  account_money: "Dinero en cuenta de Mercado Pago",
  ticket: "Efectivo / Ticket",
  bank_transfer: "Transferencia bancaria",
  digital_currency: "Billetera digital",
};

function lineaDireccion(d) {
  if (!d) return "-";
  const numero = d.numero_interior
    ? `${d.numero_exterior} int. ${d.numero_interior}`
    : d.numero_exterior;
  return `${d.calle} ${numero}, ${d.colonia}, ${d.municipio}, ${d.estado}, CP ${d.cp}`;
}

export function DetallePedidoModal({ pedido, onClose }) {
  const { data, isLoading } = useDetallePedidoEcommerceQuery(pedido?.id);

  return (
    <Overlay onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <BtnClose funcion={onClose} />

        <header>
          <Icon icon="solar:box-bold-duotone" width="34" />
          <div>
            <h2>{pedido.nro_comprobante ?? "Pedido"}</h2>
            <span className="fecha">
              {new Date(pedido.fecha).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {isLoading && <p className="cargando">Cargando detalle...</p>}

        {data && (
          <>
            <section className="bloque">
              <h3>
                <Icon icon="solar:user-bold" /> Comprador
              </h3>
              <p>
                <strong>{data.destinatario ?? "-"}</strong>
              </p>
              <p className="suave">{data.telefono ?? "-"}</p>
              <p className="suave">{data.email ?? "-"}</p>
            </section>

            <section className="bloque">
              <h3>
                <Icon icon="solar:map-point-bold" /> Dirección de envío
              </h3>
              <p className="suave">{lineaDireccion(data)}</p>
              {data.entre_calles && (
                <p className="suave">Entre calles: {data.entre_calles}</p>
              )}
              {data.referencias && (
                <p className="suave">Referencias: {data.referencias}</p>
              )}
            </section>

            <section className="bloque">
              <h3>
                <Icon icon="solar:card-bold" /> Pago
              </h3>
              <p className="suave">
                {METODOS_PAGO[pedido.metodo_pago] ?? pedido.metodo_pago ?? "-"}
              </p>
            </section>

            <section className="bloque">
              <h3>
                <Icon icon="solar:bag-4-bold" /> Productos
              </h3>
              <ul className="items">
                {data.items?.map((item, i) => (
                  <li key={i}>
                    <span>
                      {item.nombre} x{item.cantidad}
                    </span>
                    <span>$ {Number(item.total).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              <div className="total">
                Total: $ {Number(pedido.monto_total).toLocaleString()}
              </div>
            </section>
          </>
        )}
      </Card>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 20, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
`;

const Card = styled.div`
  position: relative;
  width: 100%;
  max-width: 460px;
  max-height: 85vh;
  overflow-y: auto;
  background: ${({ theme }) => theme.bgtotal};
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 16px;
  padding: 26px 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);

  header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};

    h2 {
      margin: 0;
      font-size: 19px;
    }
    .fecha {
      font-size: 12.5px;
      color: ${({ theme }) => theme.text};
      opacity: 0.6;
    }
  }

  .cargando {
    text-align: center;
    opacity: 0.7;
  }

  .bloque {
    margin-bottom: 18px;

    h3 {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #f88533;
      margin: 0 0 8px;
    }
    p {
      margin: 0 0 3px;
      font-size: 14px;
    }
    .suave {
      opacity: 0.75;
      font-size: 13px;
    }
  }

  .items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;

    li {
      display: flex;
      justify-content: space-between;
      font-size: 13.5px;
      opacity: 0.85;
    }
  }

  .total {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed ${({ theme }) => theme.color2};
    text-align: right;
    font-weight: 700;
    font-size: 16px;
  }
`;
