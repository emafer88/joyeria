import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { MostrarCombinaciones } from "../../../supabaseCrud/crudCombinaciones";

const TALLAS_ROPA = ["XS", "S", "M", "L", "XL", "XXL"];
const TALLAS_CALZADO = ["22", "23", "24", "25", "26", "27", "28", "29", "30"];
const COLORES = [
  ["Negro", "#000000"],
  ["Blanco", "#ffffff"],
  ["Gris", "#808080"],
  ["Azul marino", "#1f2a44"],
  ["Azul", "#2563eb"],
  ["Rojo", "#dc2626"],
  ["Verde", "#16a34a"],
  ["Beige", "#d6c6a8"],
  ["Café", "#6b4423"],
  ["Rosa", "#ec4899"],
];

const clave = (talla, color) => `${talla}|${color}`;

// EAN-13 de uso interno (empieza con 2) con su dígito verificador.
function codigoBarras() {
  let d = "2";
  for (let i = 0; i < 11; i++) d += Math.floor(Math.random() * 10);
  const suma = [...d].reduce((s, n, i) => s + Number(n) * (i % 2 ? 3 : 1), 0);
  return d + ((10 - (suma % 10)) % 10);
}

/**
 * Tallas y colores de un producto, cada combinación con su existencia en el
 * almacén elegido. Avisa a quien lo usa con `onChange(combinaciones)` en el
 * formato de guardar_combinaciones_producto; lista vacía = sin combinaciones.
 * La existencia de una combinación que ya tiene fila en el almacén no se
 * edita aquí (se mueve en Inventario), igual que en los productos normales.
 */
export function EditorCombinaciones({ idProducto, idAlmacen, onChange }) {
  const { data: guardadas, isLoading } = useQuery({
    queryKey: ["combinaciones producto", idProducto, idAlmacen],
    queryFn: () =>
      MostrarCombinaciones({ id_producto: idProducto, id_almacen: idAlmacen }),
    enabled: !!idProducto,
    refetchOnWindowFocus: false,
  });

  const [tallas, setTallas] = useState([]);
  const [colores, setColores] = useState([]); // [{ nombre, hex }]
  const [filas, setFilas] = useState({}); // clave -> { sku, codigo_barras, stock, stock_minimo }
  const [cargado, setCargado] = useState(!idProducto);
  const [nuevaTalla, setNuevaTalla] = useState("");
  const [nuevoColor, setNuevoColor] = useState("");
  const [nuevoHex, setNuevoHex] = useState("#888888");

  // Lo guardado arma las listas una sola vez; cambiar de almacén solo
  // refresca la existencia que se muestra.
  useEffect(() => {
    if (!guardadas || cargado) return;
    const ts = [];
    const cs = [];
    const fs = {};
    for (const c of guardadas) {
      if (c.talla && !ts.includes(c.talla)) ts.push(c.talla);
      if (c.color && !cs.some((x) => x.nombre === c.color)) {
        cs.push({ nombre: c.color, hex: c.color_hex || "" });
      }
      fs[clave(c.talla, c.color)] = {
        sku: c.sku ?? "",
        codigo_barras: c.codigo_barras ?? "",
        stock: "",
        stock_minimo: "",
      };
    }
    setTallas(ts);
    setColores(cs);
    setFilas(fs);
    setCargado(true);
  }, [guardadas, cargado]);

  const existentes = useMemo(() => {
    const m = new Map();
    for (const c of guardadas ?? []) m.set(clave(c.talla, c.color), c);
    return m;
  }, [guardadas]);

  // Todas las combinaciones de las listas (si una lista está vacía, la otra
  // sola).
  const combinaciones = useMemo(() => {
    const ts = tallas.length ? tallas : [""];
    const cs = colores.length ? colores : [{ nombre: "", hex: "" }];
    if (!tallas.length && !colores.length) return [];
    return cs.flatMap((c) =>
      ts.map((t) => ({ talla: t, color: c.nombre, color_hex: c.hex || null }))
    );
  }, [tallas, colores]);

  useEffect(() => {
    if (!cargado) return;
    onChange(
      combinaciones.map((c) => {
        const f = filas[clave(c.talla, c.color)] ?? {};
        return {
          ...c,
          sku: f.sku ?? "",
          codigo_barras: f.codigo_barras ?? "",
          stock: f.stock === "" || f.stock == null ? 0 : Number(f.stock),
          stock_minimo:
            f.stock_minimo === "" || f.stock_minimo == null
              ? null
              : Number(f.stock_minimo),
        };
      })
    );
  }, [combinaciones, filas, cargado]);

  // Cada combinación nueva nace con su código de barras (las guardadas ya
  // traen su fila y se respetan, aunque no tengan código).
  useEffect(() => {
    if (!cargado) return;
    const faltan = combinaciones
      .map((c) => clave(c.talla, c.color))
      .filter((k) => !filas[k]);
    if (!faltan.length) return;
    setFilas((prev) => {
      const sig = { ...prev };
      for (const k of faltan) sig[k] = { ...sig[k], codigo_barras: codigoBarras() };
      return sig;
    });
  }, [combinaciones, cargado]);

  const sinCodigo = combinaciones.filter(
    (c) => !filas[clave(c.talla, c.color)]?.codigo_barras
  );
  function generarFaltantes() {
    setFilas((prev) => {
      const sig = { ...prev };
      for (const c of sinCodigo) {
        const k = clave(c.talla, c.color);
        sig[k] = { ...sig[k], codigo_barras: codigoBarras() };
      }
      return sig;
    });
  }

  function cambiarFila(k, campo, valor) {
    setFilas((prev) => ({ ...prev, [k]: { ...prev[k], [campo]: valor } }));
  }
  function agregarTallas(lista) {
    setTallas((prev) => [
      ...prev,
      ...lista.map((t) => t.trim()).filter((t) => t && !prev.includes(t)),
    ]);
  }
  function agregarColor(nombre, hex) {
    const n = nombre.trim();
    if (!n) return;
    setColores((prev) =>
      prev.some((c) => c.nombre.toLowerCase() === n.toLowerCase())
        ? prev
        : [...prev, { nombre: n, hex }]
    );
  }
  function quitarColor(nombre) {
    setColores((prev) => prev.filter((c) => c.nombre !== nombre));
  }

  if (idProducto && isLoading) return <span>Cargando tallas y colores…</span>;

  return (
    <Container>
      <span className="titulo">Tallas y colores</span>
      <span className="ayuda">
        Opcional. Cada combinación lleva su propia existencia; todas se venden
        al precio del producto.
      </span>

      <div className="grupo">
        <span className="nombre">Tallas</span>
        <div className="chips">
          {tallas.map((t) => (
            <span className="chip on" key={t}>
              {t}
              <button
                type="button"
                aria-label={`Quitar talla ${t}`}
                onClick={() => setTallas((prev) => prev.filter((x) => x !== t))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="alta">
          <button type="button" onClick={() => agregarTallas(TALLAS_ROPA)}>
            + Ropa (XS–XXL)
          </button>
          <button type="button" onClick={() => agregarTallas(TALLAS_CALZADO)}>
            + Calzado (22–30)
          </button>
          <input
            type="text"
            placeholder="Otra talla (ej. 32 o 6, 7, 8)"
            value={nuevaTalla}
            onChange={(e) => setNuevaTalla(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                agregarTallas(nuevaTalla.split(","));
                setNuevaTalla("");
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              agregarTallas(nuevaTalla.split(","));
              setNuevaTalla("");
            }}
          >
            Agregar
          </button>
        </div>
      </div>

      <div className="grupo">
        <span className="nombre">Colores</span>
        <div className="chips">
          {COLORES.filter(([n]) => !colores.some((c) => c.nombre === n)).map(
            ([n, hex]) => (
              <button
                type="button"
                className="chip"
                key={n}
                onClick={() => agregarColor(n, hex)}
              >
                <i className="muestra" style={{ background: hex }} />+ {n}
              </button>
            )
          )}
        </div>
        <div className="chips">
          {colores.map((c) => (
            <span className="chip on" key={c.nombre}>
              <i className="muestra" style={{ background: c.hex || "transparent" }} />
              {c.nombre}
              <button
                type="button"
                aria-label={`Quitar color ${c.nombre}`}
                onClick={() => quitarColor(c.nombre)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="alta">
          <input
            type="color"
            value={nuevoHex}
            onChange={(e) => setNuevoHex(e.target.value)}
            aria-label="Muestra del color"
          />
          <input
            type="text"
            placeholder="Otro color (ej. Vino)"
            value={nuevoColor}
            onChange={(e) => setNuevoColor(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                agregarColor(nuevoColor, nuevoHex);
                setNuevoColor("");
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              agregarColor(nuevoColor, nuevoHex);
              setNuevoColor("");
            }}
          >
            Agregar
          </button>
        </div>
      </div>

      {combinaciones.length > 0 && (
        <div className="tabla">
          <table>
            <thead>
              <tr>
                <th>Combinación</th>
                <th className="num">Existencia</th>
                <th className="num">Mínimo</th>
                <th>SKU</th>
                <th>Código de barras</th>
              </tr>
            </thead>
            <tbody>
              {combinaciones.map((c) => {
                const k = clave(c.talla, c.color);
                const f = filas[k] ?? {};
                const enAlmacen = existentes.get(k)?.stockAlmacen;
                return (
                  <tr key={k}>
                    <td className="comb">
                      {c.color && (
                        <i
                          className="muestra"
                          style={{ background: c.color_hex || "transparent" }}
                        />
                      )}
                      {[c.talla, c.color].filter(Boolean).join(" · ")}
                    </td>
                    <td className="num">
                      {enAlmacen ? (
                        <span title="Se cambia en Inventario">
                          {Number(enAlmacen.stock)}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="0"
                          value={f.stock ?? ""}
                          onChange={(e) => cambiarFila(k, "stock", e.target.value)}
                        />
                      )}
                    </td>
                    <td className="num">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder={
                          enAlmacen ? String(Number(enAlmacen.stock_minimo)) : "0"
                        }
                        value={f.stock_minimo ?? ""}
                        onChange={(e) =>
                          cambiarFila(k, "stock_minimo", e.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={f.sku ?? ""}
                        onChange={(e) => cambiarFila(k, "sku", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={f.codigo_barras ?? ""}
                        onChange={(e) =>
                          cambiarFila(k, "codigo_barras", e.target.value)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sinCodigo.length > 0 && (
            <button type="button" className="generar" onClick={generarFaltantes}>
              Generar los códigos de barras que faltan ({sinCodigo.length})
            </button>
          )}
          {existentes.size > 0 && (
            <span className="ayuda">
              La existencia de lo que ya estaba se cambia en Inventario
              (entradas y salidas).
            </span>
          )}
        </div>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed ${({ theme }) => theme.color2};
  .titulo {
    font-weight: 600;
    font-size: 14px;
  }
  .ayuda {
    font-size: 12px;
    opacity: 0.7;
  }
  .grupo {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .nombre {
    font-size: 13px;
    font-weight: 600;
  }
  .chips,
  .alta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: transparent;
    color: ${({ theme }) => theme.text};
    font-size: 13px;
    cursor: pointer;
    &.on {
      background: ${({ theme }) => theme.acento};
      border-color: ${({ theme }) => theme.acento};
      color: ${({ theme }) => theme.acentoTexto};
      font-weight: 600;
      cursor: default;
    }
    button {
      border: none;
      background: none;
      color: inherit;
      font-size: 15px;
      line-height: 1;
      cursor: pointer;
      padding: 0 0 0 2px;
    }
  }
  .muestra {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 1px solid rgba(128, 128, 128, 0.6);
    flex-shrink: 0;
  }
  .alta {
    input[type="text"] {
      flex: 1;
      min-width: 140px;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #333;
      background-color: ${({ theme }) => theme.body};
      color: ${({ theme }) => theme.text};
    }
    input[type="color"] {
      width: 34px;
      height: 30px;
      padding: 0;
      border: none;
      background: none;
      cursor: pointer;
    }
    button {
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid ${({ theme }) => theme.color2};
      background: transparent;
      color: ${({ theme }) => theme.text};
      cursor: pointer;
      font-size: 13px;
    }
  }
  .generar {
    align-self: flex-start;
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: transparent;
    color: ${({ theme }) => theme.text};
    cursor: pointer;
    font-size: 13px;
  }
  .tabla {
    overflow-x: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  th,
  td {
    padding: 6px;
    text-align: left;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    white-space: nowrap;
  }
  th {
    font-weight: 600;
    opacity: 0.8;
  }
  .num {
    text-align: right;
  }
  .comb {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
  }
  td input {
    width: 100%;
    min-width: 64px;
    padding: 5px 8px;
    border-radius: 6px;
    border: 1px solid #333;
    background-color: ${({ theme }) => theme.body};
    color: ${({ theme }) => theme.text};
  }
  td.num input {
    width: 72px;
    text-align: right;
  }
`;
