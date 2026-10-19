import { useMemo, useState } from "react";
import styled from "styled-components";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import { Spinner1 } from "../../../index";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { MostrarExistencias } from "../../../supabaseCrud/crudStock";
import { esGranel, formatearKg } from "../../../utils/granel";
import { tablaTarjetasMovil } from "../../../styles/tablaMovil";

const ESTADOS = {
  todos: "Todos",
  bajo: "Bajo mínimo",
  agotado: "Agotados",
};

function estadoDe(r) {
  const stock = Number(r.stock) || 0;
  if (stock <= 0) return "agotado";
  if (r.stock_minimo != null && stock <= Number(r.stock_minimo)) return "bajo";
  return "ok";
}

// Cantidad con su unidad: kilos a granel, piezas lo demás.
function cantidad(n, producto) {
  if (n == null) return "—";
  return esGranel(producto) ? formatearKg(n) : `${Number(n)} pz`;
}

/**
 * Existencias: cuánto hay de cada producto que controla stock, por almacén,
 * con aviso de bajo mínimo / agotado y accesos a entrada, salida y
 * movimientos del producto.
 */
export function TablaExistencias({ onEntrada, onSalida, onMovimientos }) {
  const { dataempresa } = useEmpresaStore();
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["mostrar existencias", dataempresa?.id],
    queryFn: () => MostrarExistencias({ id_empresa: dataempresa?.id }),
    enabled: !!dataempresa,
  });
  const [buscador, setBuscador] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const conEstado = useMemo(
    () =>
      rows
        .map((r) => ({ ...r, estado: estadoDe(r) }))
        .sort((a, b) => a.productos.nombre.localeCompare(b.productos.nombre)),
    [rows]
  );
  const conteo = useMemo(() => {
    const c = { todos: conEstado.length, bajo: 0, agotado: 0 };
    for (const r of conEstado) if (c[r.estado] != null) c[r.estado]++;
    return c;
  }, [conEstado]);
  const filtrados = useMemo(() => {
    const q = buscador.trim().toLowerCase();
    return conEstado.filter(
      (r) =>
        (filtro === "todos" || r.estado === filtro) &&
        (!q ||
          [r.productos.nombre, r.productos.codigo_barras].some((x) =>
            String(x || "").toLowerCase().includes(q)
          ))
    );
  }, [conEstado, buscador, filtro]);

  if (isLoading) return <Spinner1 />;
  if (error) return <p className="err">Error: {error.message}</p>;

  return (
    <Container>
      <div className="barra">
        <div className="filtros">
          {Object.entries(ESTADOS).map(([id, label]) => (
            <button
              key={id}
              className={`chip ${id} ${filtro === id ? "activo" : ""}`}
              onClick={() => setFiltro(id)}
            >
              {label} <strong>{conteo[id]}</strong>
            </button>
          ))}
        </div>
        <label className="buscar">
          <Icon icon="mdi:magnify" />
          <input
            type="search"
            placeholder="Buscar producto o código"
            value={buscador}
            onChange={(e) => setBuscador(e.target.value)}
          />
        </label>
      </div>

      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Almacén</th>
              <th className="num">Existencia</th>
              <th className="num">Mínimo</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="vacio">
                  {rows.length === 0
                    ? 'Ningún producto controla stock todavía. Actívalo en el producto con "Controlar stock".'
                    : "Ningún producto coincide con la búsqueda."}
                </td>
              </tr>
            )}
            {filtrados.map((r) => (
              <tr key={r.id}>
                <td className="celda-principal">
                  <span className="nombre">{r.productos.nombre}</span>
                  {r.productos.codigo_barras && (
                    <span className="codigo">{r.productos.codigo_barras}</span>
                  )}
                </td>
                <td data-title="Almacén">
                  {r.almacen.sucursales.nombre} · {r.almacen.nombre}
                </td>
                <td data-title="Existencia" className="num existencia">
                  {cantidad(r.stock, r.productos)}
                </td>
                <td data-title="Mínimo" className="num">
                  {cantidad(r.stock_minimo, r.productos)}
                </td>
                <td data-title="Estado">
                  <span className={`badge ${r.estado}`}>
                    {r.estado === "ok"
                      ? "Con stock"
                      : r.estado === "bajo"
                      ? "Bajo mínimo"
                      : "Agotado"}
                  </span>
                </td>
                <td className="celda-acciones">
                  <div className="acciones">
                    <button onClick={() => onEntrada(r)} title="Registrar entrada">
                      <Icon icon="mdi:plus" /> Entrada
                    </button>
                    <button onClick={() => onSalida(r)} title="Registrar salida">
                      <Icon icon="mdi:minus" /> Salida
                    </button>
                    <button
                      onClick={() => onMovimientos(r)}
                      title="Ver movimientos"
                      className="icono"
                    >
                      <Icon icon="mdi:history" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  .err {
    color: #f46943;
  }
  .barra {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }
  .filtros {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip {
    border: 1px solid ${({ theme }) => theme.color2};
    background: none;
    color: ${({ theme }) => theme.text};
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 13px;
    cursor: pointer;
  }
  .chip.activo {
    background: ${({ theme }) => theme.text};
    color: ${({ theme }) => theme.bgtotal};
    border-color: ${({ theme }) => theme.text};
  }
  .chip.bajo strong {
    color: #c98a00;
  }
  .chip.agotado strong {
    color: #d0453a;
  }
  .chip.activo strong {
    color: inherit;
  }
  .buscar {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
    padding: 6px 10px;
    min-width: 240px;
    input {
      border: none;
      outline: none;
      background: none;
      color: ${({ theme }) => theme.text};
      font-size: 14px;
      width: 100%;
    }
  }
  .scroll {
    overflow-x: auto;
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
  .existencia {
    font-weight: 700;
    font-size: 15px;
  }
  .nombre {
    font-weight: 600;
    display: block;
  }
  .codigo {
    font-family: monospace;
    font-size: 12px;
    opacity: 0.6;
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
    white-space: nowrap;
  }
  .badge.ok {
    background: #d8f5e3;
    color: #1c7a45;
  }
  .badge.bajo {
    background: #fdeecd;
    color: #98690f;
  }
  .badge.agotado {
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
  .acciones button.icono {
    font-size: 17px;
    padding: 4px 8px;
  }

  ${tablaTarjetasMovil}
  @media (max-width: 767.98px) {
    .buscar {
      width: 100%;
      min-width: 0;
    }
    td.vacio {
      justify-content: center;
      padding: 20px 0;
    }
  }
`;
