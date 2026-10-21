import { useEffect, useState } from "react";
import styled from "styled-components";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useDashboardStore } from "../../../store/DashboardStore";
import {
  DetalleProductosDashboard,
  DetalleVentasDashboard,
} from "../../../supabaseCrud/crudDashboard";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import { formatearCantidad } from "../../../utils/granel";
import { tablaTarjetasMovil } from "../../../styles/tablaMovil";

const NOMBRE_CANAL = {
  pos: "Mostrador",
  ecommerce: "Tienda en línea",
  mercadolibre: "Mercado Libre",
};

// Qué muestra cada tarjeta al hacerle clic.
const CONFIG = {
  ventas: { titulo: "Ventas", vista: "ventas", orden: "fecha" },
  ticket: { titulo: "Ventas (ticket promedio)", vista: "ventas", orden: "total" },
  piezas: { titulo: "Productos vendidos", vista: "productos", orden: "cantidad" },
  ganancias: { titulo: "Ganancia por producto", vista: "productos", orden: "ganancia" },
};

const ORDENES = {
  ventas: [
    { id: "fecha", texto: "Más recientes" },
    { id: "total", texto: "Mayor monto" },
  ],
  productos: [
    { id: "cantidad", texto: "Más vendidos" },
    { id: "total", texto: "Mayor monto" },
    { id: "ganancia", texto: "Mayor ganancia", soloCostos: true },
  ],
};

const fechaHora = (f) =>
  new Date(f).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Detalle de una tarjeta del dashboard para el rango de fechas elegido:
 * ventas (Ventas / Ticket promedio) o productos (Piezas vendidas / Ganancias).
 */
export function ModalDetalleDashboard({ tipo, veCostos, onClose }) {
  const config = CONFIG[tipo];
  const { dataempresa } = useEmpresaStore();
  const { fechaInicio, fechaFin } = useDashboardStore();
  const [orden, setOrden] = useState(config.orden);
  const [buscador, setBuscador] = useState("");
  const params = {
    _id_empresa: dataempresa?.id,
    _fecha_inicio: fechaInicio,
    _fecha_fin: fechaFin,
  };
  const esVentas = config.vista === "ventas";
  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onClose]);
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["detalle dashboard", config.vista, params],
    queryFn: () =>
      esVentas ? DetalleVentasDashboard(params) : DetalleProductosDashboard(params),
    enabled: !!dataempresa?.id && !!fechaInicio && !!fechaFin,
    refetchOnWindowFocus: false,
  });
  const dinero = (n) =>
    FormatearNumeroDinero(Number(n) || 0, dataempresa?.currency, dataempresa?.iso);

  const q = buscador.trim().toLowerCase();
  const filas = data
    .filter(
      (f) =>
        !q ||
        (esVentas
          ? [f.nro_comprobante, f.cliente, f.cajero, NOMBRE_CANAL[f.origen]]
          : [f.producto]
        ).some((x) => String(x || "").toLowerCase().includes(q))
    )
    .sort((a, b) =>
      orden === "fecha"
        ? new Date(b.fecha) - new Date(a.fecha)
        : Number(b[orden] ?? -Infinity) - Number(a[orden] ?? -Infinity)
    );
  const sumaTotal = filas.reduce((s, f) => s + Number(f.total || 0), 0);
  const sumaGanancia = filas.reduce((s, f) => s + Number(f.ganancia || 0), 0);

  return (
    <Fondo onClick={onClose}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <h2>{config.titulo}</h2>
            <span className="resumen">
              {filas.length} {esVentas ? "venta" : "producto"}
              {filas.length === 1 ? "" : "s"} · {dinero(sumaTotal)}
              {!esVentas && veCostos && <> · ganancia {dinero(sumaGanancia)}</>}
              {esVentas && data.length >= 1000 && " · se muestran las 1,000 más recientes"}
            </span>
          </div>
          <button className="cerrar" title="Cerrar" onClick={onClose}>
            <Icon icon="mdi:close" />
          </button>
        </header>
        <div className="controles">
          <label className="buscar">
            <Icon icon="mdi:magnify" />
            <input
              type="search"
              placeholder={esVentas ? "Buscar folio, cliente o cajero" : "Buscar producto"}
              value={buscador}
              onChange={(e) => setBuscador(e.target.value)}
            />
          </label>
          <div className="ordenes" role="group" aria-label="Ordenar">
            {ORDENES[config.vista]
              .filter((o) => !o.soloCostos || veCostos)
              .map((o) => (
                <button
                  key={o.id}
                  className={orden === o.id ? "activo" : ""}
                  onClick={() => setOrden(o.id)}
                >
                  {o.texto}
                </button>
              ))}
          </div>
        </div>

        {isLoading ? (
          <p className="vacio">Cargando…</p>
        ) : error ? (
          <p className="vacio">Error: {error.message}</p>
        ) : filas.length === 0 ? (
          <p className="vacio">
            {data.length === 0
              ? "No hay ventas cobradas en este periodo."
              : "Nada coincide con la búsqueda."}
          </p>
        ) : (
          <div className="scroll">
            <table>
              {esVentas ? (
                <>
                  <thead>
                    <tr>
                      <th>Venta</th>
                      <th>Fecha</th>
                      <th>Canal</th>
                      <th>Cajero</th>
                      <th className="num">Artículos</th>
                      <th className="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((v) => (
                      <tr key={v.id}>
                        <td className="celda-principal">
                          <span className="principal">{v.cliente || "Público en general"}</span>
                          <span className="secundario">{v.nro_comprobante}</span>
                        </td>
                        <td data-title="Fecha">{fechaHora(v.fecha)}</td>
                        <td data-title="Canal">{NOMBRE_CANAL[v.origen] ?? v.origen}</td>
                        <td data-title="Cajero">{v.cajero ?? "—"}</td>
                        <td data-title="Artículos" className="num">{v.articulos}</td>
                        <td data-title="Total" className="num fuerte">{dinero(v.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th className="num">Cantidad</th>
                      <th className="num">Total</th>
                      {veCostos && <th className="num">Ganancia</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filas.map((p) => (
                      <tr key={p.id_producto}>
                        <td className="celda-principal">
                          <span className="principal">{p.producto}</span>
                        </td>
                        <td data-title="Cantidad" className="num">
                          {formatearCantidad(p.cantidad, p)}
                        </td>
                        <td data-title="Total" className="num fuerte">{dinero(p.total)}</td>
                        {veCostos && (
                          <td
                            data-title="Ganancia"
                            className={`num ${Number(p.ganancia) < 0 ? "negativa" : ""}`}
                          >
                            {p.ganancia == null ? "—" : dinero(p.ganancia)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}
      </Panel>
    </Fondo>
  );
}

const Fondo = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: rgba(18, 18, 18, 0.5);
`;
const Panel = styled.div`
  width: 100%;
  max-width: 960px;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    h2 {
      margin: 0 0 4px;
      font-size: 22px;
    }
  }
  .resumen {
    opacity: 0.8;
    font-size: 14px;
  }
  .cerrar {
    background: none;
    border: none;
    font-size: 26px;
    cursor: pointer;
    color: ${({ theme }) => theme.text};
    display: flex;
  }
  .controles {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
  }
  .buscar {
    flex: 1 1 220px;
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
    padding: 6px 10px;
    input {
      border: none;
      outline: none;
      background: none;
      color: ${({ theme }) => theme.text};
      font-size: 14px;
      width: 100%;
    }
  }
  .ordenes {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .ordenes button {
    border: 1px solid ${({ theme }) => theme.color2};
    background: none;
    color: ${({ theme }) => theme.text};
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 13px;
    cursor: pointer;
  }
  .ordenes button.activo {
    background: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.text};
    color: ${({ theme }) => theme.bgtotal};
  }
  .vacio {
    text-align: center;
    opacity: 0.6;
    font-style: italic;
    padding: 30px 0;
  }
  .scroll {
    overflow: auto;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  thead th {
    position: sticky;
    top: 0;
    background-color: ${({ theme }) => theme.bgtotal};
    text-align: left;
    padding: 10px 12px;
    border-bottom: 2px solid ${({ theme }) => theme.color2};
    white-space: nowrap;
    opacity: 0.9;
  }
  tbody td {
    padding: 10px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
  }
  .num {
    text-align: right;
    white-space: nowrap;
  }
  .fuerte {
    font-weight: 700;
  }
  .negativa {
    color: #c0392b;
  }
  .principal {
    display: block;
    font-weight: 600;
  }
  .secundario {
    font-family: monospace;
    font-size: 12px;
    opacity: 0.7;
  }

  ${tablaTarjetasMovil}
`;
