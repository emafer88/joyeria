import { useMemo, useState } from "react";
import styled from "styled-components";
import {
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Spinner1 } from "../../../index";
import { v } from "../../../styles/variables";
import { useJoyeriaStore } from "../../../store/JoyeriaStore";
import { useInventarioListadoQuery } from "../../../tanstack/JoyeriaStack";
import { imprimirEtiquetas } from "../../../utils/codigoBarras";
import { FiltrosInventario } from "./FiltrosInventario";

const GRUPOS = ["categoria", "producto", "variante"];
const COLS = 8;
const ESTADO_LABEL = {
  disponible: "Disponible",
  vendida: "Vendida",
  reservada: "Reservada",
  danada: "Dañada",
  perdida: "Perdida",
};
const HEAD = [
  ["sku", "SKU"],
  ["barcode", "Código de barras"],
  ["peso", "Peso (g)"],
  ["costo", "Costo"],
  ["precio_venta", "Precio"],
  ["estado", "Estado"],
  ["almacen", "Almacén"],
];

const money = (n) => (n == null || n === "" ? "—" : "$ " + Number(n).toFixed(2));
const gramos = (n) => (n == null || n === "" ? "—" : `${Number(n)} g`);
const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();

/**
 * Pantalla de inventario: todas las piezas, agrupadas
 * Categoría → Diseño → Variante → Piezas. Búsqueda (nombre/SKU/barcode),
 * filtros por categoría/material/pureza/estado, orden por peso/costo/precio,
 * conteo de disponibles y expandir/colapsar.
 */
export function TablaInventarioJoyeria() {
  const { buscador } = useJoyeriaStore();
  const { data: rows = [], isLoading, error } = useInventarioListadoQuery();

  const [filtros, setFiltros] = useState({
    categoria: "",
    material: "",
    pureza: "",
    estado: "",
  });
  const [expanded, setExpanded] = useState(true);
  const [sorting, setSorting] = useState([]);

  const opciones = useMemo(
    () => ({
      categorias: uniq(rows.map((r) => r.categoria)),
      materiales: uniq(rows.map((r) => r.material)),
      purezas: uniq(rows.map((r) => r.pureza)),
    }),
    [rows]
  );

  const filtrados = useMemo(() => {
    const q = buscador.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!filtros.categoria || r.categoria === filtros.categoria) &&
        (!filtros.material || r.material === filtros.material) &&
        (!filtros.pureza || (r.pureza || "") === filtros.pureza) &&
        (!filtros.estado || r.estado === filtros.estado) &&
        (!q ||
          [r.producto, r.sku, r.barcode, r.categoria].some((x) =>
            String(x || "").toLowerCase().includes(q)
          ))
    );
  }, [rows, buscador, filtros]);

  const resumen = useMemo(() => {
    const c = { total: filtrados.length, disponible: 0, reservada: 0, vendida: 0 };
    for (const r of filtrados) if (c[r.estado] != null) c[r.estado]++;
    return c;
  }, [filtrados]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "categoria",
        header: "Categoría",
        getGroupingValue: (r) => r.categoria || "Sin categoría",
      },
      { accessorKey: "producto", header: "Diseño" },
      {
        id: "variante",
        header: "Variante",
        accessorFn: (r) => `${r.material}${r.pureza ? " " + r.pureza : ""}`,
      },
      { accessorKey: "sku", header: "SKU", enableGrouping: false },
      { accessorKey: "barcode", header: "Código de barras", enableGrouping: false },
      {
        id: "peso",
        header: "Peso",
        enableGrouping: false,
        accessorFn: (r) => (r.peso == null ? null : Number(r.peso)),
      },
      {
        id: "costo",
        header: "Costo",
        enableGrouping: false,
        accessorFn: (r) => (r.costo == null ? null : Number(r.costo)),
      },
      {
        id: "precio_venta",
        header: "Precio",
        enableGrouping: false,
        accessorFn: (r) => (r.precio_venta == null ? null : Number(r.precio_venta)),
      },
      { accessorKey: "estado", header: "Estado", enableGrouping: false },
      { accessorKey: "almacen", header: "Almacén", enableGrouping: false },
    ],
    []
  );

  const table = useReactTable({
    data: filtrados,
    columns,
    state: { expanded, sorting },
    initialState: { grouping: GRUPOS },
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableGrouping: true,
    autoResetExpanded: false,
  });

  if (isLoading) return <Spinner1 />;
  if (error) return <p className="err">Error: {error.message}</p>;

  const sortArrow = (id) => {
    const dir = table.getColumn(id)?.getIsSorted();
    return dir === "asc" ? " ▲" : dir === "desc" ? " ▼" : "";
  };

  const imprimirGrupo = (row) => {
    const leaves = row.getLeafRows().map((lr) => lr.original);
    if (leaves.length === 0) return;
    imprimirEtiquetas(leaves, {
      producto: leaves[0].producto,
      material: leaves[0].material,
      pureza: leaves[0].pureza,
    });
  };

  return (
    <Container>
      <div className="barra">
        <FiltrosInventario
          opciones={opciones}
          valores={filtros}
          onChange={setFiltros}
        />
        <div className="acc">
          <button onClick={() => table.toggleAllRowsExpanded(true)}>
            Expandir todo
          </button>
          <button onClick={() => table.toggleAllRowsExpanded(false)}>
            Colapsar todo
          </button>
        </div>
      </div>

      <div className="resumen">
        <strong>{resumen.total}</strong> piezas ·{" "}
        <span className="ok">{resumen.disponible} disp.</span> ·{" "}
        {resumen.reservada} reserv. · {resumen.vendida} vend.
      </div>

      <div className="scroll">
        <table>
          <thead>
            <tr>
              {HEAD.map(([id, label]) => {
                const col = table.getColumn(id);
                const sortable = ["sku", "peso", "costo", "precio_venta", "estado", "barcode"].includes(id);
                return (
                  <th
                    key={id}
                    className={sortable ? "sortable" : ""}
                    onClick={sortable ? col?.getToggleSortingHandler() : undefined}
                  >
                    {label}
                    {sortArrow(id)}
                  </th>
                );
              })}
              <th />
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={COLS} className="vacio">
                  Sin piezas en inventario para estos filtros.
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => {
              if (row.getIsGrouped()) {
                const leaves = row.getLeafRows();
                const disp = leaves.filter(
                  (lr) => lr.original.estado === "disponible"
                ).length;
                return (
                  <tr key={row.id} className={`grp d${row.depth}`}>
                    <td colSpan={COLS}>
                      <span style={{ paddingLeft: row.depth * 22 }} />
                      <button
                        className="tg"
                        onClick={row.getToggleExpandedHandler()}
                      >
                        {row.getIsExpanded() ? "▾" : "▸"}
                      </button>
                      <span className="glabel">
                        {String(row.getValue(row.groupingColumnId) ?? "—")}
                      </span>
                      <span className="gcount">
                        {leaves.length} piezas · {disp} disp.
                      </span>
                      {row.depth === 2 && (
                        <button
                          className="gprint"
                          onClick={() => imprimirGrupo(row)}
                        >
                          <v.iconocodigobarras /> etiquetas
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }
              const p = row.original;
              return (
                <tr key={row.id}>
                  <td className="mono" style={{ paddingLeft: 22 * 3 + 8 }}>
                    {p.sku}
                  </td>
                  <td className="mono">{p.barcode}</td>
                  <td>{gramos(p.peso)}</td>
                  <td>{money(p.costo)}</td>
                  <td>{money(p.precio_venta)}</td>
                  <td>
                    <span className={`badge ${p.estado}`}>
                      {ESTADO_LABEL[p.estado] ?? p.estado}
                    </span>
                  </td>
                  <td>{p.almacen || "—"}</td>
                  <td>
                    <button
                      title="Imprimir etiqueta"
                      className="rowprint"
                      onClick={() =>
                        imprimirEtiquetas([p], {
                          producto: p.producto,
                          material: p.material,
                          pureza: p.pureza,
                        })
                      }
                    >
                      <v.iconocodigobarras />
                    </button>
                  </td>
                </tr>
              );
            })}
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
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }
  .barra .acc {
    display: flex;
    gap: 8px;
  }
  .barra .acc button {
    background: none;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
    padding: 7px 12px;
    cursor: pointer;
    color: ${({ theme }) => theme.text};
    font-size: 13px;
  }
  .resumen {
    font-size: 14px;
    opacity: 0.9;
  }
  .resumen .ok {
    color: #2e9e57;
    font-weight: 700;
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
  thead th.sortable {
    cursor: pointer;
    user-select: none;
  }
  tbody td {
    padding: 9px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
  }
  .vacio {
    text-align: center;
    opacity: 0.6;
    font-style: italic;
  }
  tr.grp td {
    background: ${({ theme }) => theme.bg4 || "rgba(243,210,12,0.08)"};
  }
  tr.grp.d0 .glabel {
    font-weight: 800;
    font-size: 15px;
  }
  tr.grp.d1 .glabel {
    font-weight: 700;
  }
  tr.grp.d2 .glabel {
    font-weight: 600;
    opacity: 0.9;
  }
  .tg {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 13px;
    color: ${({ theme }) => theme.text};
    margin-right: 8px;
  }
  .glabel {
    margin-right: 12px;
  }
  .gcount {
    font-size: 12px;
    opacity: 0.7;
  }
  .gprint {
    margin-left: 14px;
    background: none;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
    padding: 3px 9px;
    cursor: pointer;
    color: ${({ theme }) => theme.text};
    font-size: 12px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    vertical-align: middle;
  }
  .mono {
    font-family: monospace;
  }
  .rowprint {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 17px;
    color: ${({ theme }) => theme.text};
    display: flex;
  }
  .badge {
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
  .badge.disponible {
    background: #d8f5e3;
    color: #1c7a45;
  }
  .badge.reservada {
    background: #fdeecd;
    color: #98690f;
  }
  .badge.vendida {
    background: #e6e6e6;
    color: #555;
  }
  .badge.danada,
  .badge.perdida {
    background: #fbdad6;
    color: #a5342a;
  }
`;
