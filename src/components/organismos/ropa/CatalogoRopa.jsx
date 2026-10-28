import { useMemo, useState } from "react";
import styled from "styled-components";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import { useQueryClient } from "@tanstack/react-query";
import { EliminarProductos } from "../../../supabaseCrud/crudProductos";

/**
 * Catálogo de la pestaña Ropa y calzado: un renglón por producto (foto,
 * tallas, colores, existencia total) que se abre en su cuadrícula
 * talla × color con la existencia de cada combinación.
 */
export function CatalogoRopa({ productos, buscador, onEditar }) {
  const queryClient = useQueryClient();
  const [abierto, setAbierto] = useState(null);

  const filtrados = useMemo(() => {
    const q = buscador.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) =>
      [p.nombre, p.categoria, p.marca, ...p.colores.map((c) => c.nombre)]
        .filter(Boolean)
        .some((x) => x.toLowerCase().includes(q))
    );
  }, [productos, buscador]);

  function eliminar(p) {
    Swal.fire({
      title: "¿Eliminar el producto?",
      text:
        p.total > 0
          ? `${p.nombre} todavía tiene ${p.total} pz en existencia.`
          : p.nombre,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await EliminarProductos({ id: p.id });
        queryClient.invalidateQueries({ queryKey: ["ropa inventario"] });
        toast.success("Producto eliminado");
      } catch (e) {
        toast.error(e.message);
      }
    });
  }

  if (productos.length === 0)
    return (
      <p className="vacio">
        Todavía no hay ropa ni calzado. Da de alta el primero con “nuevo”.
      </p>
    );
  if (filtrados.length === 0)
    return <p className="vacio">Ningún producto coincide con la búsqueda.</p>;

  return (
    <Container>
      {filtrados.map((p) => {
        const open = abierto === p.id;
        return (
          <article key={p.id} className={open ? "producto open" : "producto"}>
            <header onClick={() => setAbierto(open ? null : p.id)}>
              <Icon
                className="flecha"
                icon={open ? "mdi:chevron-down" : "mdi:chevron-right"}
              />
              <div className="foto">
                {p.imagen_portada ? (
                  <img src={p.imagen_portada} alt="" />
                ) : (
                  <Icon icon="mdi:hanger" />
                )}
              </div>
              <div className="info">
                <span className="nombre">{p.nombre}</span>
                <span className="meta">
                  {[p.categoria, p.marca].filter(Boolean).join(" · ")}
                  {" · $"}
                  {Number(p.precio_venta).toFixed(2)}
                </span>
                <span className="meta">
                  {p.tallas.length > 0 && <>Tallas {p.tallas.join(", ")}</>}
                  {p.colores.length > 0 && (
                    <span className="muestras">
                      {p.colores.map((c) => (
                        <i
                          key={c.nombre}
                          title={c.nombre}
                          style={{ background: c.hex || "transparent" }}
                        />
                      ))}
                    </span>
                  )}
                </span>
              </div>
              <span className={p.total > 0 ? "total" : "total agotado"}>
                {p.total} pz
              </span>
              <div className="botones" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => onEditar(p.id)} title="Editar">
                  <Icon icon="mdi:pencil" /> <span>Editar</span>
                </button>
                <button
                  type="button"
                  className="borrar"
                  onClick={() => eliminar(p)}
                  title="Eliminar"
                >
                  <Icon icon="mdi:delete-outline" />
                </button>
              </div>
            </header>
            {open && <Cuadricula producto={p} />}
          </article>
        );
      })}
    </Container>
  );
}

// Colores en renglones, tallas en columnas; sin colores (o sin tallas) queda
// una sola fila (o columna).
function Cuadricula({ producto }) {
  const tallas = producto.tallas.length ? producto.tallas : [""];
  const colores = producto.colores.length
    ? producto.colores
    : [{ nombre: "", hex: null }];
  const celda = new Map(
    producto.combinaciones.map((c) => [`${c.talla}|${c.color}`, c])
  );
  return (
    <div className="cuadricula">
      <table>
        <thead>
          <tr>
            <th />
            {tallas.map((t) => (
              <th key={t}>{t || "Existencia"}</th>
            ))}
            <th className="tot">Total</th>
          </tr>
        </thead>
        <tbody>
          {colores.map((col) => {
            let suma = 0;
            return (
              <tr key={col.nombre}>
                <th className="color">
                  <span>
                    {col.nombre && (
                      <i style={{ background: col.hex || "transparent" }} />
                    )}
                    {col.nombre || "Existencia"}
                  </span>
                </th>
                {tallas.map((t) => {
                  const c = celda.get(`${t}|${col.nombre}`);
                  if (c) suma += c.stock;
                  return (
                    <td
                      key={t}
                      className={!c ? "no" : c.stock > 0 ? "" : "cero"}
                      title={c?.codigo_barras ?? ""}
                    >
                      {c ? c.stock : "—"}
                    </td>
                  );
                })}
                <td className="tot">{suma}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  .producto {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    overflow: hidden;
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    cursor: pointer;
  }
  .flecha {
    font-size: 22px;
    opacity: 0.6;
    flex-shrink: 0;
  }
  .foto {
    width: 52px;
    height: 52px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
    display: grid;
    place-items: center;
    background: ${({ theme }) => theme.color2};
    font-size: 26px;
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .nombre {
    font-weight: 700;
    text-transform: capitalize;
  }
  .meta {
    font-size: 13px;
    opacity: 0.75;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .muestras {
    display: inline-flex;
    gap: 4px;
  }
  i {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid rgba(128, 128, 128, 0.6);
    flex-shrink: 0;
  }
  .total {
    font-weight: 700;
    white-space: nowrap;
  }
  .total.agotado {
    color: #f46943;
  }
  .botones {
    display: flex;
    gap: 6px;
    button {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid ${({ theme }) => theme.color2};
      background: transparent;
      color: ${({ theme }) => theme.text};
      cursor: pointer;
      font-size: 13px;
    }
    .borrar {
      color: #f46943;
    }
  }
  .cuadricula {
    overflow-x: auto;
    padding: 4px 14px 14px 48px;
  }
  table {
    border-collapse: collapse;
    font-size: 14px;
  }
  th,
  td {
    padding: 7px 12px;
    text-align: center;
    border: 1px solid ${({ theme }) => theme.color2};
    white-space: nowrap;
  }
  thead th {
    font-weight: 700;
  }
  th.color {
    text-align: left;
    font-weight: 600;
    span {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }
  td.cero {
    color: #f46943;
    font-weight: 600;
  }
  td.no {
    opacity: 0.35;
  }
  .tot {
    font-weight: 700;
  }
  @media (max-width: 767.98px) {
    header {
      flex-wrap: wrap;
    }
    .info {
      flex-basis: calc(100% - 110px);
    }
    .botones {
      margin-left: auto;
    }
    .botones span {
      display: none;
    }
    .cuadricula {
      padding-left: 14px;
    }
  }
`;
