import { useMemo, useState } from "react";
import styled from "styled-components";
import { Icon } from "@iconify/react";
import { tablaTarjetasMovil } from "../../../styles/tablaMovil";

const ESTADOS = [
  ["ok", "Con stock"],
  ["bajo", "Bajo mínimo"],
  ["agotado", "Agotado"],
];
const FILTROS_VACIOS = { categoria: "", talla: "", color: "", estado: "" };

function estadoDe(r) {
  const stock = Number(r.stock) || 0;
  if (stock <= 0) return "agotado";
  if (r.stock_minimo != null && stock <= Number(r.stock_minimo)) return "bajo";
  return "ok";
}

const unicos = (xs) => [...new Set(xs.filter(Boolean))];

/**
 * Inventario de la pestaña Ropa y calzado: un renglón por talla y color en
 * cada almacén, con filtros (categoría, talla, color, estado), búsqueda y
 * orden por columna, como el inventario de Joyería.
 */
export function InventarioRopa({ filas, buscador, onEntrada, onSalida, onHistorial }) {
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [orden, setOrden] = useState({ campo: "producto", asc: true });

  // Solo las que ya tienen fila de stock (almacén).
  const conEstado = useMemo(
    () =>
      filas
        .filter((r) => r.id_stock)
        .map((r) => ({ ...r, estado: estadoDe(r), stock: Number(r.stock) })),
    [filas]
  );

  // Las tallas en el orden en que se capturaron (S, M, L…), no alfabético.
  const opciones = useMemo(() => {
    const porOrden = [...conEstado].sort((a, b) => a.orden - b.orden);
    return {
      categorias: unicos(conEstado.map((r) => r.categoria)).sort(),
      tallas: unicos(porOrden.map((r) => r.talla)),
      colores: unicos(conEstado.map((r) => r.color)).sort(),
    };
  }, [conEstado]);

  const conteo = useMemo(() => {
    const c = { ok: 0, bajo: 0, agotado: 0 };
    for (const r of conEstado) c[r.estado]++;
    return c;
  }, [conEstado]);

  const visibles = useMemo(() => {
    const q = buscador.trim().toLowerCase();
    const lista = conEstado.filter(
      (r) =>
        (!filtros.categoria || r.categoria === filtros.categoria) &&
        (!filtros.talla || r.talla === filtros.talla) &&
        (!filtros.color || r.color === filtros.color) &&
        (!filtros.estado || r.estado === filtros.estado) &&
        (!q ||
          [r.producto, r.codigo_barras, r.talla, r.color, r.categoria, r.marca]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(q)))
    );
    const dir = orden.asc ? 1 : -1;
    const valor = {
      producto: (r) => r.producto,
      talla: (r) => r.orden,
      color: (r) => r.color,
      almacen: (r) => `${r.sucursal} ${r.almacen}`,
      stock: (r) => r.stock,
    }[orden.campo];
    return lista.sort((a, b) => {
      const va = valor(a);
      const vb = valor(b);
      const d =
        typeof va === "number"
          ? va - vb
          : String(va ?? "").localeCompare(String(vb ?? ""), "es");
      // Desempate: producto y luego el orden de captura.
      return (
        d * dir ||
        a.producto.localeCompare(b.producto, "es") ||
        a.orden - b.orden
      );
    });
  }, [conEstado, filtros, orden, buscador]);

  const set = (k) => (e) => setFiltros({ ...filtros, [k]: e.target.value });
  const hayFiltro = Object.values(filtros).some(Boolean);
  const ordenar = (campo) =>
    setOrden((o) => ({ campo, asc: o.campo === campo ? !o.asc : true }));
  const Th = ({ campo, children, className }) => (
    <th className={`ordenable ${className ?? ""}`} onClick={() => ordenar(campo)}>
      {children}
      {orden.campo === campo && (
        <Icon icon={orden.asc ? "mdi:arrow-up" : "mdi:arrow-down"} />
      )}
    </th>
  );

  return (
    <Container>
      <div className="filtros">
        <select value={filtros.categoria} onChange={set("categoria")}>
          <option value="">Categoría: todas</option>
          {opciones.categorias.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={filtros.talla} onChange={set("talla")}>
          <option value="">Talla: todas</option>
          {opciones.tallas.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={filtros.color} onChange={set("color")}>
          <option value="">Color: todos</option>
          {opciones.colores.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={filtros.estado} onChange={set("estado")}>
          <option value="">Estado: todos</option>
          {ESTADOS.map(([v, label]) => (
            <option key={v} value={v}>
              {label} ({conteo[v]})
            </option>
          ))}
        </select>
        {hayFiltro && (
          <button className="limpiar" onClick={() => setFiltros(FILTROS_VACIOS)}>
            Limpiar filtros
          </button>
        )}
        <span className="resumen">
          {visibles.length} de {conEstado.length} ·{" "}
          {visibles.reduce((s, r) => s + r.stock, 0)} pz
        </span>
      </div>

      <div className="scroll">
        <table>
          <thead>
            <tr>
              <Th campo="producto">Producto</Th>
              <Th campo="talla">Talla</Th>
              <Th campo="color">Color</Th>
              <Th campo="almacen">Almacén</Th>
              <Th campo="stock" className="num">
                Existencia
              </Th>
              <th className="num">Mínimo</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr>
                <td colSpan={8} className="vacio">
                  {conEstado.length === 0
                    ? "Todavía no hay existencias de ropa ni calzado."
                    : "Nada coincide con los filtros."}
                </td>
              </tr>
            )}
            {visibles.map((r) => (
              <tr key={r.id_stock}>
                <td className="celda-principal">
                  <span className="nombre">{r.producto}</span>
                  <span className="codigo">
                    {[r.categoria, r.codigo_barras].filter(Boolean).join(" · ")}
                  </span>
                </td>
                <td data-title="Talla" className="talla">
                  {r.talla || "—"}
                </td>
                <td data-title="Color">
                  {r.color ? (
                    <span className="color">
                      <i style={{ background: r.color_hex || "transparent" }} />
                      {r.color}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td data-title="Almacén">
                  {r.sucursal} · {r.almacen}
                </td>
                <td data-title="Existencia" className="num existencia">
                  {r.stock} pz
                </td>
                <td data-title="Mínimo" className="num">
                  {Number(r.stock_minimo ?? 0)} pz
                </td>
                <td data-title="Estado">
                  <span className={`badge ${r.estado}`}>
                    {ESTADOS.find(([v]) => v === r.estado)[1]}
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
                      onClick={() => onHistorial(r)}
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
  .filtros {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
    select {
      font-family: inherit;
      font-size: 14px;
      padding: 7px 10px;
      border-radius: 8px;
      border: 1px solid ${({ theme }) => theme.color2};
      background: ${({ theme }) => theme.body};
      color: ${({ theme }) => theme.text};
    }
    .limpiar {
      border: none;
      background: none;
      color: ${({ theme }) => theme.text};
      text-decoration: underline;
      cursor: pointer;
      font-size: 13px;
    }
    .resumen {
      margin-left: auto;
      font-size: 13px;
      opacity: 0.7;
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
  th.ordenable {
    cursor: pointer;
    user-select: none;
    svg {
      vertical-align: -2px;
      margin-left: 4px;
    }
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
    text-transform: capitalize;
  }
  .codigo {
    font-family: monospace;
    font-size: 12px;
    opacity: 0.6;
  }
  .talla {
    font-weight: 700;
  }
  .color {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  i {
    display: inline-block;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    border: 1px solid rgba(128, 128, 128, 0.6);
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
    .filtros select {
      flex: 1 1 45%;
    }
    .filtros .resumen {
      margin-left: 0;
    }
    td.vacio {
      justify-content: center;
      padding: 20px 0;
    }
  }
`;
