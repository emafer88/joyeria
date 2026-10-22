import { useState } from "react";
import styled from "styled-components";
import { BarLoader } from "react-spinners";
import { useQuery } from "@tanstack/react-query";
import { Device } from "../../../styles/breakpoints";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useDashboardStore } from "../../../store/DashboardStore";
import { CancelacionesDashboard } from "../../../supabaseCrud/crudDashboard";
import { useDesgloseVentasDashboardQuery } from "../../../tanstack/ReportesStack";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import { tablaTarjetasMovil } from "../../../styles/tablaMovil";
import { ZONA_NAVEGADOR } from "../../../utils/zonaHoraria";

const VISIBLES = 8;

const fechaHora = (f) =>
  new Date(f).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Ventas cobradas que se cancelaron en el periodo del filtro: cuántas, cuánto
 * dinero, de qué tipo (venta del POS, apartado, Mercado Libre) y el detalle
 * con motivo, quién la canceló y quién la autorizó.
 */
export function CancelacionesPeriodo() {
  const { dataempresa } = useEmpresaStore();
  const { fechaInicio, fechaFin } = useDashboardStore();
  const [todos, setTodos] = useState(false);
  const params = {
    _id_empresa: dataempresa?.id,
    _fecha_inicio: fechaInicio,
    _fecha_fin: fechaFin,
    _zona: ZONA_NAVEGADOR,
  };
  const { data: filas = [], isLoading, error } = useQuery({
    queryKey: ["cancelaciones dashboard", params],
    queryFn: () => CancelacionesDashboard(params),
    enabled: !!dataempresa?.id && !!fechaInicio && !!fechaFin,
    refetchOnWindowFocus: false,
  });
  const { data: desglose } = useDesgloseVentasDashboardQuery();
  const dinero = (n) =>
    FormatearNumeroDinero(Number(n) || 0, dataempresa?.currency, dataempresa?.iso);

  if (isLoading) return <BarLoader color="#6d6d6d" />;
  if (error) return <span>error...{error.message}</span>;

  const monto = filas.reduce((s, f) => s + Number(f.monto), 0);
  const cobradas = desglose?.num_ventas ?? 0;
  const porTipo = ["Venta", "Apartado", "Mercado Libre"]
    .map((t) => [t, filas.filter((f) => f.tipo === t).length])
    .filter(([, n]) => n > 0);
  const visibles = todos ? filas : filas.slice(0, VISIBLES);

  return (
    <Container>
      <header>
        <h3>Cancelaciones</h3>
        <span className="sub">Ventas cobradas que se cancelaron en el periodo</span>
      </header>

      <section className="cifras">
        <div>
          <span className="etiqueta">Canceladas</span>
          <strong>{filas.length}</strong>
          {cobradas > 0 && (
            <span className="nota">
              frente a {cobradas} venta{cobradas === 1 ? "" : "s"} cobrada{cobradas === 1 ? "" : "s"}
            </span>
          )}
        </div>
        <div>
          <span className="etiqueta">Monto cancelado</span>
          <strong>{dinero(monto)}</strong>
        </div>
        <div>
          <span className="etiqueta">Por tipo</span>
          <span className="tipos">
            {porTipo.length === 0
              ? "—"
              : porTipo.map(([t, n]) => `${t}: ${n}`).join(" · ")}
          </span>
        </div>
      </section>

      {filas.length === 0 ? (
        <p className="vacio">No se canceló ninguna venta en este periodo.</p>
      ) : (
        <>
          <div className="tabla">
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Cancelada</th>
                  <th>Cliente</th>
                  <th>Motivo</th>
                  <th>Canceló / autorizó</th>
                  <th className="num">Monto</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((f) => (
                  <tr key={f.id}>
                    <td className="celda-principal">
                      <div className="quien">
                        <span className="folio">{f.nro_comprobante}</span>
                        <span className="tipo">{f.tipo}</span>
                      </div>
                    </td>
                    <td data-title="Cancelada">{fechaHora(f.cancelada)}</td>
                    <td data-title="Cliente">{f.cliente ?? "—"}</td>
                    <td data-title="Motivo" className="motivo">{f.motivo ?? "—"}</td>
                    <td data-title="Canceló / autorizó">
                      {f.cancelo ?? "—"}
                      {f.autorizo && f.autorizo !== f.cancelo && (
                        <span className="autorizo"> · autorizó {f.autorizo}</span>
                      )}
                    </td>
                    <td data-title="Monto" className="num">
                      <strong>{dinero(f.monto)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filas.length > VISIBLES && (
            <button className="mas" onClick={() => setTodos(!todos)}>
              {todos ? "Ver menos" : `Ver las ${filas.length}`}
            </button>
          )}
        </>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: ${({ theme }) => theme.text};
  header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme }) => theme.colortitlecard};
  }
  .sub,
  .etiqueta,
  .nota,
  .tipo,
  .autorizo {
    font-size: 12px;
    color: #6b7280;
  }
  .cifras {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    @media ${Device.tablet} {
      grid-template-columns: repeat(3, 1fr);
    }
    div {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 12px;
      border-radius: 12px;
      background: ${({ theme }) => theme.color2}33;
    }
    strong {
      font-size: 22px;
    }
    div:last-child {
      grid-column: 1 / -1;
      @media ${Device.tablet} {
        grid-column: auto;
      }
    }
    .tipos {
      font-size: 14px;
      font-weight: 600;
      margin-top: 4px;
    }
  }
  .vacio {
    margin: 0;
    opacity: 0.6;
    font-style: italic;
  }
  .tabla {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  thead th {
    text-align: left;
    padding: 8px 10px;
    border-bottom: 2px solid ${({ theme }) => theme.color2};
    white-space: nowrap;
    font-weight: 600;
    opacity: 0.85;
  }
  tbody td {
    padding: 10px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
  }
  .quien {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .folio {
    font-family: monospace;
    font-weight: 600;
  }
  @media ${Device.tablet} {
    .motivo {
      max-width: 260px;
    }
  }
  .num {
    text-align: right;
    white-space: nowrap;
  }
  .mas {
    align-self: flex-start;
    background: none;
    border: none;
    padding: 0;
    font-size: 13px;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
    color: ${({ theme }) => theme.text};
  }

  ${tablaTarjetasMovil}
`;
