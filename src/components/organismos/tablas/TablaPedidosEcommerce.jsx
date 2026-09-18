import styled from "styled-components";
import { Paginacion } from "../../../index";
import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { FaArrowsAltV } from "react-icons/fa";
import { useActualizarEstadoEnvioMutation } from "../../../tanstack/PedidosEcommerceStack";
import { DetallePedidoModal } from "../PedidosDesign/DetallePedidoModal";

const METODOS_PAGO = {
  credit_card: "Tarjeta de crédito",
  debit_card: "Tarjeta de débito",
  prepaid_card: "Tarjeta prepaga",
  account_money: "Dinero en cuenta de Mercado Pago",
  ticket: "Efectivo / Ticket",
  bank_transfer: "Transferencia bancaria",
  digital_currency: "Billetera digital",
};

const ESTADOS = {
  pago_recibido: { label: "Pago recibido", color: "#7c3aed" },
  preparando: { label: "Preparando", color: "#d97706" },
  enviado: { label: "Enviado", color: "#0284c7" },
  entregado: { label: "Entregado", color: "#16a34a" },
};

export function TablaPedidosEcommerce({ data }) {
  const [columnFilters, setColumnFilters] = useState([]);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const { mutate } = useActualizarEstadoEnvioMutation();

  if (data == null) return null;

  const columns = [
    {
      accessorKey: "fecha",
      header: "Fecha",
      cell: (info) => (
        <span className="fecha">
          {new Date(info.getValue()).toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
          })}
        </span>
      ),
    },
    {
      accessorKey: "nro_comprobante",
      header: "Comprobante",
      cell: (info) => <span className="comprobante">{info.getValue() ?? "-"}</span>,
    },
    {
      id: "destinatario",
      header: "Destinatario",
      cell: (info) => (
        <div className="destinatario">
          <span className="nombre">{info.row.original.destinatario ?? "-"}</span>
          {info.row.original.telefono && (
            <span className="telefono">{info.row.original.telefono}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "monto_total",
      header: "Total",
      cell: (info) => (
        <span className="monto">$ {Number(info.getValue()).toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "metodo_pago",
      header: "Pago",
      cell: (info) => (
        <span className="metodo">
          {METODOS_PAGO[info.getValue()] ?? info.getValue() ?? "-"}
        </span>
      ),
    },
    {
      accessorKey: "estado_envio",
      header: "Estado",
      cell: (info) => {
        const valor = info.getValue() ?? "pago_recibido";
        const { color } = ESTADOS[valor];
        return (
          <EstadoSelect $color={color}>
            <select
              value={valor}
              onChange={(e) =>
                mutate({ id: info.row.original.id, estado_envio: e.target.value })
              }
            >
              <option value="pago_recibido" disabled>
                Pago recibido
              </option>
              <option value="preparando">Preparando</option>
              <option value="enviado">Enviado</option>
              <option value="entregado">Entregado</option>
            </select>
          </EstadoSelect>
        );
      },
    },
    {
      id: "detalle",
      header: "",
      cell: (info) => (
        <BtnDetalle
          type="button"
          onClick={() => setPedidoDetalle(info.row.original)}
        >
          <Icon icon="solar:eye-bold" width="18" />
          Ver detalles
        </BtnDetalle>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Container>
      <div className="tabla-scroll">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.column.columnDef.header}
                    {header.column.getCanSort() && (
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <FaArrowsAltV size={11} />
                      </span>
                    )}
                    {
                      {
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted()]
                    }
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((item) => (
              <tr key={item.id}>
                {item.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p className="vacio">Todavía no hay pedidos.</p>}
      </div>

      <Paginacion
        table={table}
        irinicio={() => table.setPageIndex(0)}
        pagina={table.getState().pagination.pageIndex + 1}
        setPagina={() => {}}
        maximo={table.getPageCount()}
      />

      {pedidoDetalle && (
        <DetallePedidoModal
          pedido={pedidoDetalle}
          onClose={() => setPedidoDetalle(null)}
        />
      )}
    </Container>
  );
}

const Container = styled.div`
  position: relative;
  margin: 1.5% 2%;

  .tabla-scroll {
    overflow-x: auto;
    border-radius: 14px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bg};
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .vacio {
    text-align: center;
    padding: 30px;
    opacity: 0.6;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
  }

  thead th {
    text-align: left;
    padding: 14px 16px;
    font-weight: 700;
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: ${({ theme }) => theme.text};
    opacity: 0.6;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    white-space: nowrap;
  }

  tbody tr {
    transition: background 0.15s ease;
    &:hover {
      background: ${({ theme }) => theme.bgAlpha};
    }
    &:not(:last-child) td {
      border-bottom: 1px solid ${({ theme }) => theme.color2};
    }
  }

  td {
    padding: 12px 16px;
    vertical-align: middle;
    white-space: nowrap;
  }

  .fecha {
    opacity: 0.7;
    text-transform: capitalize;
  }
  .comprobante {
    font-weight: 600;
  }
  .destinatario {
    display: flex;
    flex-direction: column;
    .nombre {
      font-weight: 600;
    }
    .telefono {
      font-size: 12px;
      opacity: 0.6;
    }
  }
  .monto {
    font-weight: 700;
    color: #f88533;
  }
  .metodo {
    opacity: 0.75;
    font-size: 12.5px;
  }
`;

const EstadoSelect = styled.div`
  display: inline-flex;
  select {
    padding: 6px 12px;
    border-radius: 20px;
    border: 1px solid ${(props) => props.$color};
    background: ${(props) => props.$color}22;
    color: ${(props) => props.$color};
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    &:focus {
      outline: none;
    }
  }
`;

const BtnDetalle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.color2};
  background: transparent;
  color: ${({ theme }) => theme.text};
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.15s ease;
  &:hover {
    border-color: #f88533;
    color: #f88533;
  }
`;
