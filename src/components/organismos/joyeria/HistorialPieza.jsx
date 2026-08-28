import styled from "styled-components";
import { useJoyeriaStore } from "../../../store/JoyeriaStore";
import { useMovimientosPiezaQuery } from "../../../tanstack/JoyeriaStack";

const TIPO_LABEL = {
  entrada: "Entrada",
  venta: "Venta",
  devolucion: "Devolución",
  ajuste: "Ajuste",
  perdida: "Pérdida",
  dano: "Daño",
  reserva: "Reserva",
  cancelacion_reserva: "Cancelación de reserva",
};

const ESTADO_LABEL = {
  disponible: "Disponible",
  vendida: "Vendida",
  reservada: "Reservada",
  danada: "Dañada",
  perdida: "Perdida",
};

const fmtFecha = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString();
};
const estado = (e) => (e ? ESTADO_LABEL[e] ?? e : "—");

/** Timeline de `movimientos_piezas` de una pieza (más reciente arriba). */
export function HistorialPieza({ onClose }) {
  const { piezaSelect: pieza } = useJoyeriaStore();
  const {
    data: movs = [],
    isLoading,
    error,
  } = useMovimientosPiezaQuery(pieza?.id_pieza ?? pieza?.id);

  if (!pieza) return null;

  return (
    <Container>
      <div className="sub-contenedor">
        <div className="headers">
          <h1>
            Historial de la pieza
            <small> · {pieza.sku}</small>
          </h1>
          <span onClick={onClose}>x</span>
        </div>

        {isLoading && <p className="msg">Cargando historial…</p>}
        {error && <p className="msg err">Error: {error.message}</p>}
        {!isLoading && !error && movs.length === 0 && (
          <p className="msg">Esta pieza todavía no tiene movimientos.</p>
        )}

        {movs.length > 0 && (
          <ul className="timeline">
            {movs.map((m) => (
              <li key={m.id}>
                <div className="linea">
                  <span className={`tipo t-${m.tipo}`}>
                    {TIPO_LABEL[m.tipo] ?? m.tipo}
                  </span>
                  <span className="fecha">{fmtFecha(m.created_at)}</span>
                </div>
                <div className="detalle">
                  {m.estado_anterior || m.estado_nuevo ? (
                    <span className="cambio">
                      {estado(m.estado_anterior)} → {estado(m.estado_nuevo)}
                    </span>
                  ) : null}
                  {m.id_usuario ? (
                    <span className="user">usuario #{m.id_usuario}</span>
                  ) : null}
                </div>
                {m.notas && <div className="notas">{m.notas}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
}

const Container = styled.div`
  transition: 0.5s;
  top: 0;
  left: 0;
  position: fixed;
  background-color: rgba(10, 9, 9, 0.5);
  display: flex;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  .sub-contenedor {
    position: relative;
    width: 560px;
    max-width: 92%;
    max-height: 82vh;
    overflow-y: auto;
    border-radius: 20px;
    background: ${({ theme }) => theme.bgtotal};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
    padding: 13px 32px 22px 32px;
  }
  .headers {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    h1 {
      font-size: 19px;
      font-weight: 500;
    }
    small {
      color: #9b9b9b;
      font-family: monospace;
    }
    span {
      font-size: 20px;
      cursor: pointer;
    }
  }
  .msg {
    opacity: 0.7;
    font-style: italic;
  }
  .msg.err {
    color: #f46943;
    font-style: normal;
  }
  .timeline {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .timeline li {
    border: 1px solid ${({ theme }) => theme.color2};
    border-left: 3px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
    padding: 9px 12px;
  }
  .timeline .linea {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
  .timeline .tipo {
    font-weight: 700;
    font-size: 13px;
  }
  .timeline .tipo.t-venta {
    color: #555;
  }
  .timeline .tipo.t-ajuste {
    color: #1c6ea4;
  }
  .timeline .tipo.t-perdida,
  .timeline .tipo.t-dano {
    color: #a5342a;
  }
  .timeline .tipo.t-devolucion,
  .timeline .tipo.t-entrada {
    color: #1c7a45;
  }
  .timeline .fecha {
    font-size: 12px;
    opacity: 0.6;
  }
  .timeline .detalle {
    display: flex;
    gap: 12px;
    margin-top: 4px;
    font-size: 12.5px;
    opacity: 0.85;
  }
  .timeline .notas {
    margin-top: 6px;
    font-size: 12.5px;
    opacity: 0.75;
    white-space: pre-wrap;
  }
`;
