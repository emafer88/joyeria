import { useEffect, useRef } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { BtnClose } from "../../ui/buttons/BtnClose";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import { PosCombinaciones } from "../../../supabaseCrud/crudCombinaciones";

// Pide talla y color antes de agregar un producto con combinaciones (Fase C).
// Colores en renglones, tallas en columnas, como en Ropa y calzado; cada
// celda dice cuántas hay en el almacén de la caja y las agotadas no se pueden
// elegir.
export function ModalCombinacionPos({ producto, id_almacen, cantidad, onElegir, onCerrar }) {
  const { dataempresa } = useEmpresaStore();
  const { data: combinaciones, isLoading, error } = useQuery({
    queryKey: ["pos combinaciones", producto.id, id_almacen],
    queryFn: () => PosCombinaciones({ id_producto: producto.id, id_almacen }),
    staleTime: 0,
  });
  const primeraRef = useRef(null);
  useEffect(() => {
    primeraRef.current?.focus();
  }, [combinaciones]);
  // Esc cierra aunque no haya ninguna talla enfocada (todas agotadas).
  useEffect(() => {
    const alPresionar = (e) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  const lista = combinaciones ?? [];
  const tallas = [...new Set(lista.map((c) => c.talla))];
  const colores = [];
  for (const c of lista) {
    if (!colores.some((col) => col.nombre === c.color)) {
      colores.push({ nombre: c.color, hex: c.color_hex });
    }
  }
  const celda = new Map(lista.map((c) => [`${c.talla}|${c.color}`, c]));
  const hayStock = lista.some((c) => Number(c.stock) > 0);
  let primeraAsignada = false;

  return (
    <Container>
      <Caja>
        <BtnClose funcion={onCerrar} />
        <span className="titulo">Elige talla y color</span>
        <span className="producto">{producto.nombre}</span>
        <span className="precio">
          {FormatearNumeroDinero(
            Number(producto.precio_venta),
            dataempresa?.currency,
            dataempresa?.iso
          )}
          {cantidad > 1 && ` · ${cantidad} piezas`}
        </span>
        {isLoading && <span>Cargando…</span>}
        {error && <span className="aviso">{error.message}</span>}
        {!isLoading && !error && !hayStock && (
          <span className="aviso">No hay existencia en este almacén.</span>
        )}
        {lista.length > 0 && (
          <div className="cuadricula">
            <table>
              <thead>
                <tr>
                  <th />
                  {tallas.map((t) => (
                    <th key={t}>{t || "Pieza"}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colores.map((col) => (
                  <tr key={col.nombre}>
                    <th className="color">
                      <span>
                        {col.nombre && (
                          <i style={{ background: col.hex || "transparent" }} />
                        )}
                        {col.nombre || "—"}
                      </span>
                    </th>
                    {tallas.map((t) => {
                      const c = celda.get(`${t}|${col.nombre}`);
                      if (!c) return <td key={t} className="no">—</td>;
                      const stock = Number(c.stock) || 0;
                      const disponible = stock >= cantidad;
                      const esPrimera = disponible && !primeraAsignada;
                      if (esPrimera) primeraAsignada = true;
                      return (
                        <td key={t}>
                          <button
                            type="button"
                            ref={esPrimera ? primeraRef : undefined}
                            disabled={!disponible}
                            onClick={() => onElegir(c)}
                            title={c.codigo_barras ?? ""}
                          >
                            {stock}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <span className="nota">El número es la existencia en este almacén.</span>
      </Caja>
    </Container>
  );
}

const Container = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: rgba(18, 18, 18, 0.5);
`;
const Caja = styled.div`
  position: relative;
  width: 100%;
  max-width: 560px;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
  .titulo {
    font-size: 20px;
    font-weight: 700;
  }
  .producto {
    font-weight: 600;
  }
  .precio,
  .nota {
    opacity: 0.8;
  }
  .nota {
    font-size: 13px;
  }
  .aviso {
    color: #e5484d;
  }
  .cuadricula {
    overflow: auto;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th,
  td {
    padding: 4px;
    text-align: center;
    white-space: nowrap;
  }
  thead th {
    font-size: 13px;
    opacity: 0.8;
  }
  th.color {
    text-align: left;
    span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    i {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid ${({ theme }) => theme.color2};
    }
  }
  td.no {
    opacity: 0.4;
  }
  button {
    width: 100%;
    min-width: 48px;
    padding: 10px 6px;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: transparent;
    color: inherit;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    &:hover:not(:disabled),
    &:focus-visible {
      border-color: ${({ theme }) => theme.acento ?? theme.text};
      outline: 2px solid ${({ theme }) => theme.acento ?? theme.text};
    }
    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      text-decoration: line-through;
    }
  }
`;
