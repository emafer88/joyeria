import { useState } from "react";
import styled from "styled-components";
import { BarLoader } from "react-spinners";
import { useQuery } from "@tanstack/react-query";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { AlertasInventarioDashboard } from "../../../supabaseCrud/crudDashboard";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import { formatearCantidad } from "../../../utils/granel";
import { tablaTarjetasMovil } from "../../../styles/tablaMovil";

const DIAS = [30, 60, 90];
const VISIBLES = 8;

const fecha = (f) =>
  f
    ? new Date(f).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
    : "Nunca";

/**
 * Alertas de inventario al día de hoy (no dependen del filtro de fechas):
 * productos agotados, bajo el stock mínimo del almacén y sin ventas en los
 * últimos 30/60/90 días (con lo que hay detenido a precio de venta).
 */
export function AlertasInventario() {
  const { dataempresa } = useEmpresaStore();
  const [dias, setDias] = useState(60);
  const [tipo, setTipo] = useState(null);
  const [todos, setTodos] = useState(false);
  const { data: filas = [], isLoading, error } = useQuery({
    queryKey: ["alertas inventario dashboard", dataempresa?.id, dias],
    queryFn: () =>
      AlertasInventarioDashboard({ _id_empresa: dataempresa?.id, _dias_sin_movimiento: dias }),
    enabled: !!dataempresa?.id,
    refetchOnWindowFocus: false,
    placeholderData: (anterior) => anterior,
  });
  const dinero = (n) =>
    FormatearNumeroDinero(Number(n) || 0, dataempresa?.currency, dataempresa?.iso);

  if (isLoading) return <BarLoader color="#6d6d6d" />;
  if (error) return <span>error...{error.message}</span>;

  const grupos = [
    ["agotado", "Agotados"],
    ["bajo", "Bajo el mínimo"],
    ["sin_movimiento", `Sin ventas en ${dias} días`],
  ].map(([id, texto]) => ({ id, texto, filas: filas.filter((f) => f.tipo === id) }));
  // Por defecto, la primera pestaña que tenga algo.
  const activo = tipo ?? (grupos.find((g) => g.filas.length > 0) ?? grupos[0]).id;
  const grupo = grupos.find((g) => g.id === activo);
  const visibles = todos ? grupo.filas : grupo.filas.slice(0, VISIBLES);
  const detenido = grupos[2].filas.reduce((s, f) => s + Number(f.valor), 0);
  const cambiar = (id) => {
    setTipo(id);
    setTodos(false);
  };

  return (
    <Container>
      <header>
        <div>
          <h3>Alertas de inventario</h3>
          <span className="sub">Al día de hoy · no depende de las fechas</span>
        </div>
        <label className="dias">
          Sin ventas en
          <select value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            {DIAS.map((d) => (
              <option key={d} value={d}>
                {d} días
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="grupos" role="tablist">
        {grupos.map((g) => (
          <button
            key={g.id}
            role="tab"
            aria-selected={g.id === activo}
            className={`${g.id} ${g.id === activo ? "on" : ""}`}
            onClick={() => cambiar(g.id)}
          >
            <strong>{g.filas.length}</strong>
            <span>{g.texto}</span>
          </button>
        ))}
      </div>

      {grupo.filas.length === 0 ? (
        <p className="vacio">
          {activo === "agotado"
            ? "No hay productos agotados."
            : activo === "bajo"
            ? "Ningún producto está por debajo de su stock mínimo."
            : `Todo lo que tiene existencias se vendió en los últimos ${dias} días.`}
        </p>
      ) : (
        <>
          {activo === "sin_movimiento" && (
            <p className="resumen">
              {dinero(detenido)} a precio de venta detenidos en {grupo.filas.length} producto
              {grupo.filas.length === 1 ? "" : "s"}.
            </p>
          )}
          <div className="tabla">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  {activo !== "sin_movimiento" && <th>Almacén</th>}
                  {activo !== "agotado" && <th className="num">Existencias</th>}
                  {activo !== "sin_movimiento" && <th className="num">Mínimo</th>}
                  {activo === "sin_movimiento" && <th className="num">Valor</th>}
                  {activo !== "bajo" && <th className="num">Última venta</th>}
                </tr>
              </thead>
              <tbody>
                {visibles.map((f) => (
                  <tr key={`${f.id_producto}-${f.almacen ?? ""}`}>
                    <td className="celda-principal">
                      <span className="producto">{f.producto}</span>
                    </td>
                    {activo !== "sin_movimiento" && (
                      <td data-title="Almacén">{f.almacen ?? "Piezas de joyería"}</td>
                    )}
                    {activo !== "agotado" && (
                      <td data-title="Existencias" className="num">
                        {formatearCantidad(f.existencias, f)}
                      </td>
                    )}
                    {activo !== "sin_movimiento" && (
                      <td data-title="Mínimo" className="num">
                        {f.stock_minimo > 0 ? formatearCantidad(f.stock_minimo, f) : "—"}
                      </td>
                    )}
                    {activo === "sin_movimiento" && (
                      <td data-title="Valor" className="num">{dinero(f.valor)}</td>
                    )}
                    {activo !== "bajo" && (
                      <td data-title="Última venta" className="num">{fecha(f.ultima_venta)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {grupo.filas.length > VISIBLES && (
            <button className="mas" onClick={() => setTodos(!todos)}>
              {todos ? "Ver menos" : `Ver los ${grupo.filas.length}`}
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
  header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
  }
  header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme }) => theme.colortitlecard};
  }
  .sub,
  .dias {
    font-size: 12px;
    color: #6b7280;
  }
  .dias {
    display: flex;
    align-items: center;
    gap: 6px;
    select {
      padding: 4px 6px;
      border-radius: 8px;
      border: 1px solid ${({ theme }) => theme.color2};
      background: ${({ theme }) => theme.body};
      color: ${({ theme }) => theme.text};
    }
  }
  .grupos {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    button {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 2px solid transparent;
      background: ${({ theme }) => theme.color2}33;
      color: ${({ theme }) => theme.text};
      cursor: pointer;
      text-align: left;
      strong {
        font-size: 22px;
      }
      span {
        font-size: 12px;
        color: #6b7280;
      }
    }
    button.on {
      border-color: ${({ theme }) => theme.text};
    }
    button.agotado strong {
      color: #c0392b;
    }
    button.bajo strong {
      color: #b7791f;
    }
  }
  .vacio {
    margin: 0;
    opacity: 0.6;
    font-style: italic;
  }
  .resumen {
    margin: 0;
    font-size: 14px;
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
  .num {
    text-align: right;
    white-space: nowrap;
  }
  .producto {
    font-weight: 600;
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
