import { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react/dist/iconify.js";
import { usePermisosDeMenu } from "../../hooks/usePermisosDeMenu";
import {
  useMarcarNotificacionLeidaMutation,
  useNotificacionesPedidosQuery,
} from "../../tanstack/NotificacionesPedidosStack";

export function NotificacionesPedidos() {
  const { puedeVer } = usePermisosDeMenu();
  const { data } = useNotificacionesPedidosQuery();
  const marcarLeida = useMarcarNotificacionLeidaMutation();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);

  if (!puedeVer("/pedidos")) return null;

  const notificaciones = data ?? [];
  const hayNuevas = notificaciones.length > 0;

  const irAlPedido = (idVenta) => {
    marcarLeida.mutate(idVenta);
    setAbierto(false);
    navigate(`/pedidos?pedido=${idVenta}`);
  };

  return (
    <Container>
      <button
        type="button"
        className="campana"
        onClick={() => setAbierto((a) => !a)}
        aria-label="Notificaciones de pedidos"
      >
        <Icon icon="solar:bell-bold" width="22" />
        {hayNuevas && <span className="badge">{notificaciones.length}</span>}
      </button>

      {abierto && (
        <>
          <div className="backdrop" onClick={() => setAbierto(false)} />
          <div className="dropdown">
            <h3>Pedidos nuevos</h3>
            {!hayNuevas && <p className="vacio">No hay pedidos nuevos.</p>}
            <ul>
              {notificaciones.map((n) => (
                <li key={n.id} onClick={() => irAlPedido(n.id)}>
                  <span className="comprobante">{n.nro_comprobante ?? "Pedido"}</span>
                  <span className="destinatario">{n.destinatario ?? "-"}</span>
                  <span className="monto">$ {Number(n.monto_total).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Container>
  );
}

const Container = styled.div`
  position: relative;

  .campana {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid ${({ theme }) => theme.color2};
    background: transparent;
    color: ${({ theme }) => theme.text};
    cursor: pointer;
    transition: 0.15s;
    &:hover {
      border-color: #f88533;
      color: #f88533;
    }
  }

  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 4px;
    border-radius: 10px;
    background: #e0245e;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 30;
  }

  .dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 10px);
    z-index: 31;
    width: 300px;
    max-height: 360px;
    overflow-y: auto;
    padding: 10px;
    border-radius: 12px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);

    h3 {
      margin: 4px 6px 8px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #f88533;
    }

    .vacio {
      margin: 10px 6px;
      font-size: 13px;
      opacity: 0.6;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    li {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 8px 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: 0.15s;
      &:hover {
        background: ${({ theme }) => theme.bgAlpha};
      }
    }

    .comprobante {
      font-weight: 700;
      font-size: 13px;
    }
    .destinatario {
      font-size: 12px;
      opacity: 0.7;
    }
    .monto {
      font-size: 12.5px;
      font-weight: 600;
      color: #f88533;
    }
  }
`;
