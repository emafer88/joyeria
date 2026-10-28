import styled from "styled-components";
import { formatearCantidad } from "../../../utils/granel";
import { tablaTarjetasMovil } from "../../../styles/tablaMovil";
import { nombreCombinacion } from "../../../supabaseCrud/crudCombinaciones";

const fechaHora = (f) =>
  new Date(f).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// "registro de inventario manual" es lo que guarda el formulario de
// entrada/salida; lo demás (ventas) ya viene con un texto legible.
const motivo = (m) =>
  m.origen === "inventario" && m.detalle === "registro de inventario manual"
    ? "Registro manual"
    : m.detalle || m.origen;

/** Historial (kardex) de un producto, del más reciente al más viejo. */
export function MovimientosProducto({ data, producto }) {
  const filas = [...(data ?? [])].sort((a, b) => b.id - a.id);
  const conCombinaciones = filas.some((m) => m.combinacion);
  return (
    <Container>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Movimiento</th>
            {conCombinaciones && <th>Talla y color</th>}
            <th>Motivo</th>
            <th>Almacén</th>
            <th className="num">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {filas.length === 0 && (
            <tr>
              <td colSpan={6} className="vacio">
                Este producto todavía no tiene movimientos.
              </td>
            </tr>
          )}
          {filas.map((m) => {
            const entra = m.tipo_movimiento === "ingreso";
            return (
              <tr key={m.id}>
                <td className="celda-principal">{fechaHora(m.fecha)}</td>
                <td data-title="Movimiento">
                  <span className={`badge ${entra ? "entra" : "sale"}`}>
                    {entra ? "Entrada" : "Salida"}
                  </span>
                </td>
                {conCombinaciones && (
                  <td data-title="Talla y color">
                    {nombreCombinacion(m.combinacion) || "—"}
                  </td>
                )}
                <td data-title="Motivo">{motivo(m)}</td>
                <td data-title="Almacén">
                  {m.almacen?.sucursales?.nombre} · {m.almacen?.nombre}
                </td>
                <td
                  data-title="Cantidad"
                  className={`num cant ${entra ? "entra" : "sale"}`}
                >
                  {entra ? "+" : "−"}
                  {formatearCantidad(m.cantidad, producto)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Container>
  );
}

const Container = styled.div`
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 12px;
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
  .cant {
    font-weight: 700;
  }
  .cant.entra {
    color: #1c7a45;
  }
  .cant.sale {
    color: #a5342a;
  }
  .vacio {
    text-align: center;
    opacity: 0.6;
    font-style: italic;
  }
  .badge {
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
  }
  .badge.entra {
    background: #d8f5e3;
    color: #1c7a45;
  }
  .badge.sale {
    background: #fbdad6;
    color: #a5342a;
  }

  ${tablaTarjetasMovil}
  @media (max-width: 767.98px) {
    td.celda-principal {
      font-weight: 700;
    }
    td.vacio {
      justify-content: center;
      padding: 20px 0;
    }
  }
`;
