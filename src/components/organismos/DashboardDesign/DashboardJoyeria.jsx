import styled from "styled-components";
import { BarLoader } from "react-spinners";
import { useQuery } from "@tanstack/react-query";
import { Device } from "../../../styles/breakpoints";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useDashboardStore } from "../../../store/DashboardStore";
import {
  JoyeriaInventarioDashboard,
  JoyeriaVentasDashboard,
} from "../../../supabaseCrud/crudDashboard";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import { tablaTarjetasMovil } from "../../../styles/tablaMovil";
import { CardTotales } from "./CardTotales";

const gramos = (n) =>
  `${Number(n || 0).toLocaleString("es-MX", { maximumFractionDigits: 2 })} g`;
const nombre = (f) => [f.material, f.pureza].filter(Boolean).join(" ");
// Metal de una fila por el nombre del material ("Oro amarillo", "Oro blanco",
// "Plata"...); los demás materiales no entran en las tarjetas de gramos.
const metal = (f) => {
  const m = String(f.material || "").toLowerCase();
  return m.includes("oro") ? "oro" : m.includes("plata") ? "plata" : null;
};

/**
 * Pestaña "Joyería" del dashboard: gramos de oro y de plata vendidos (cada
 * uno con su precio por gramo), piezas vendidas en el rango por material y
 * pureza (piezas, gramos, monto, precio por gramo y ganancia con "Ver costos")
 * e inventario disponible hoy por material.
 */
export function DashboardJoyeria({ veCostos }) {
  const { dataempresa } = useEmpresaStore();
  const { fechaInicio, fechaFin } = useDashboardStore();
  const params = {
    _id_empresa: dataempresa?.id,
    _fecha_inicio: fechaInicio,
    _fecha_fin: fechaFin,
  };
  const ventas = useQuery({
    queryKey: ["joyeria ventas dashboard", params],
    queryFn: () => JoyeriaVentasDashboard(params),
    enabled: !!dataempresa?.id && !!fechaInicio && !!fechaFin,
    refetchOnWindowFocus: false,
  });
  const inventario = useQuery({
    queryKey: ["joyeria inventario dashboard", dataempresa?.id],
    queryFn: () => JoyeriaInventarioDashboard({ _id_empresa: dataempresa?.id }),
    enabled: !!dataempresa?.id,
    refetchOnWindowFocus: false,
  });
  const dinero = (n) =>
    FormatearNumeroDinero(Number(n) || 0, dataempresa?.currency, dataempresa?.iso);
  const porGramo = (total, g) => (Number(g) > 0 ? dinero(Number(total) / Number(g)) : "—");

  const filasVentas = ventas.data ?? [];
  const totalPiezas = filasVentas.reduce((s, f) => s + Number(f.piezas), 0);
  const totalMonto = filasVentas.reduce((s, f) => s + Number(f.total), 0);
  const porMetal = (m) =>
    filasVentas
      .filter((f) => metal(f) === m)
      .reduce(
        (s, f) => ({ gramos: s.gramos + Number(f.gramos), total: s.total + Number(f.total) }),
        { gramos: 0, total: 0 }
      );
  const oro = porMetal("oro");
  const plata = porMetal("plata");
  const detallePorGramo = (x) =>
    x.gramos > 0 ? `${dinero(x.total / x.gramos)} por gramo en promedio` : "Sin ventas";
  const maxMonto = Math.max(0, ...filasVentas.map((f) => Number(f.total)));

  const filasInv = inventario.data ?? [];
  const inv = filasInv.reduce(
    (s, f) => ({
      piezas: s.piezas + Number(f.piezas),
      gramos: s.gramos + Number(f.gramos),
      valor: s.valor + Number(f.valor),
    }),
    { piezas: 0, gramos: 0, valor: 0 }
  );

  return (
    <Container>
      <section className="tarjetas">
        <Tarjeta>
          <CardTotales value={totalPiezas} formato="cantidad" title="Piezas vendidas" icon="mdi:ring" />
        </Tarjeta>
        <Tarjeta>
          <CardTotales
            value={oro.gramos}
            formato="gramos"
            title="Gramos de oro"
            icon="mdi:gold"
            detalle={detallePorGramo(oro)}
          />
        </Tarjeta>
        <Tarjeta>
          <CardTotales
            value={plata.gramos}
            formato="gramos"
            title="Gramos de plata"
            icon="mdi:scale-balance"
            detalle={detallePorGramo(plata)}
          />
        </Tarjeta>
        <Tarjeta>
          <CardTotales value={totalMonto} title="Monto en joyería" icon="mdi:dollar" />
        </Tarjeta>
      </section>

      <Bloque>
        <header>
          <h3>Ventas por material y pureza</h3>
          <span className="sub">Piezas de joyería vendidas en el periodo</span>
        </header>
        {ventas.isLoading ? (
          <BarLoader color="#6d6d6d" />
        ) : ventas.error ? (
          <span>error...{ventas.error.message}</span>
        ) : filasVentas.length === 0 ? (
          <p className="vacio">No se vendieron piezas de joyería en este periodo.</p>
        ) : (
          <div className="tabla">
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th className="num">Piezas</th>
                  <th className="num">Gramos</th>
                  <th>Monto</th>
                  <th className="num">Precio por gramo</th>
                  {veCostos && <th className="num">Ganancia</th>}
                </tr>
              </thead>
              <tbody>
                {filasVentas.map((f) => (
                  <tr key={nombre(f)}>
                    <td className="celda-principal">
                      <span className="material">{nombre(f)}</span>
                    </td>
                    <td data-title="Piezas" className="num">{f.piezas}</td>
                    <td data-title="Gramos" className="num">{gramos(f.gramos)}</td>
                    <td data-title="Monto">
                      <div className="monto">
                        <span className="pista" aria-hidden="true">
                          <span
                            className="barra"
                            style={{ width: `${maxMonto > 0 ? (Number(f.total) / maxMonto) * 100 : 0}%` }}
                          />
                        </span>
                        <strong>{dinero(f.total)}</strong>
                      </div>
                    </td>
                    <td data-title="Precio por gramo" className="num">
                      {porGramo(f.total, f.gramos)}
                    </td>
                    {veCostos && (
                      <td
                        data-title="Ganancia"
                        className={`num ${Number(f.ganancia) < 0 ? "negativa" : ""}`}
                      >
                        {f.ganancia == null ? "—" : dinero(f.ganancia)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Bloque>

      <Bloque>
        <header>
          <h3>Inventario disponible</h3>
          <span className="sub">
            Piezas en existencia hoy (no depende de las fechas)
            {filasInv.length > 0 &&
              ` · ${inv.piezas} piezas · ${gramos(inv.gramos)} · ${dinero(inv.valor)} a precio de venta`}
          </span>
        </header>
        {inventario.isLoading ? (
          <BarLoader color="#6d6d6d" />
        ) : inventario.error ? (
          <span>error...{inventario.error.message}</span>
        ) : filasInv.length === 0 ? (
          <p className="vacio">No hay piezas de joyería disponibles.</p>
        ) : (
          <div className="tabla">
            <table>
              <thead>
                <tr>
                  <th>Material</th>
                  <th className="num">Piezas</th>
                  <th className="num">Gramos</th>
                  <th className="num">Valor a precio de venta</th>
                </tr>
              </thead>
              <tbody>
                {filasInv.map((f) => (
                  <tr key={nombre(f)}>
                    <td className="celda-principal">
                      <span className="material">{nombre(f)}</span>
                    </td>
                    <td data-title="Piezas" className="num">{f.piezas}</td>
                    <td data-title="Gramos" className="num">{gramos(f.gramos)}</td>
                    <td data-title="Valor" className="num">{dinero(f.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Bloque>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  .tarjetas {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    @media ${Device.desktop} {
      grid-template-columns: repeat(4, 1fr);
    }
  }
`;
const Tarjeta = styled.div`
  background-color: ${({ theme }) => theme.body};
  padding: 10px;
  border-radius: 20px;
  border: 2px solid ${({ theme }) => theme.bordercolorDash};
  box-shadow: ${({ theme }) => theme.boxshadow};
`;
const Bloque = styled.section`
  background-color: ${({ theme }) => theme.body};
  border: 2px solid ${({ theme }) => theme.bordercolorDash};
  box-shadow: ${({ theme }) => theme.boxshadow};
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme }) => theme.colortitlecard};
  }
  .sub {
    font-size: 13px;
    color: #6b7280;
  }
  .vacio {
    opacity: 0.6;
    font-style: italic;
    margin: 0;
  }
  .tabla {
    overflow-x: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    color: ${({ theme }) => theme.text};
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
  .material {
    font-weight: 600;
  }
  .monto {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 180px;
    strong {
      white-space: nowrap;
    }
  }
  .pista {
    flex: 1;
    height: 10px;
    border-radius: 4px;
    background: ${({ theme }) => theme.color2}55;
  }
  .barra {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: ${({ theme }) => theme.text};
  }
  .negativa {
    color: #c0392b;
  }

  ${tablaTarjetasMovil}
  @media (max-width: 767.98px) {
    .monto {
      min-width: 0;
      justify-content: flex-end;
    }
    .pista {
      display: none;
    }
  }
`;
