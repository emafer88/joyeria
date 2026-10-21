import { useState } from "react";
import styled from "styled-components";
import { BarLoader } from "react-spinners";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import { useDesgloseVentasDashboardQuery } from "../../../tanstack/ReportesStack";

const NOMBRE_CANAL = {
  pos: "Mostrador (POS)",
  ecommerce: "Tienda en línea",
  mercadolibre: "Mercado Libre",
};

/**
 * Cómo se cobraron las ventas del periodo (método de pago) y por dónde
 * entraron (canal): barras horizontales con monto y porcentaje del total.
 */
export const DesgloseVentas = () => {
  const { data, isLoading, error } = useDesgloseVentasDashboardQuery();
  const { dataempresa } = useEmpresaStore();
  const dinero = (n) =>
    FormatearNumeroDinero(Number(n) || 0, dataempresa?.currency, dataempresa?.iso);

  if (isLoading) return <BarLoader color="#6d6d6d" />;
  if (error) return <span>error...{error.message}</span>;

  const metodos = (data?.metodos ?? []).map((m) => ({
    nombre: m.metodo,
    total: Number(m.total),
  }));
  const canales = (data?.canales ?? []).map((c) => ({
    nombre: NOMBRE_CANAL[c.canal] ?? c.canal,
    total: Number(c.total),
    detalle: `${c.ventas} venta${c.ventas === 1 ? "" : "s"}`,
  }));

  return (
    <Container>
      <Bloque titulo="Método de pago" filas={metodos} dinero={dinero} />
      <Bloque titulo="Canal de venta" filas={canales} dinero={dinero} />
    </Container>
  );
};

function Bloque({ titulo, filas, dinero }) {
  const [activa, setActiva] = useState(null);
  const total = filas.reduce((s, f) => s + f.total, 0);
  const pct = (n) => (total > 0 ? (n / total) * 100 : 0);
  return (
    <section className="bloque">
      <h3>{titulo}</h3>
      {filas.length === 0 ? (
        <p className="vacio">Sin ventas en este periodo</p>
      ) : (
        <ul>
          {filas.map((f) => (
            <Fila
              key={f.nombre}
              $activa={activa === f.nombre}
              $atenuada={activa !== null && activa !== f.nombre}
              onMouseEnter={() => setActiva(f.nombre)}
              onMouseLeave={() => setActiva(null)}
              onFocus={() => setActiva(f.nombre)}
              onBlur={() => setActiva(null)}
              tabIndex={0}
            >
              <div className="etiquetas">
                <span className="nombre">{f.nombre}</span>
                <span className="monto">{dinero(f.total)}</span>
              </div>
              <div className="pista">
                <div className="barra" style={{ width: `${Math.max(pct(f.total), 1)}%` }} />
              </div>
              <span className="detalle">
                {pct(f.total).toFixed(1)}% del total
                {f.detalle ? ` · ${f.detalle}` : ""}
              </span>
            </Fila>
          ))}
        </ul>
      )}
    </section>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 28px;
  padding: 20px;
  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
  .bloque h3 {
    margin: 0 0 14px;
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme }) => theme.colortitlecard};
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .vacio {
    opacity: 0.6;
    font-style: italic;
  }
`;
const Fila = styled.li`
  outline: none;
  cursor: default;
  opacity: ${({ $atenuada }) => ($atenuada ? 0.45 : 1)};
  transition: opacity 0.15s ease;
  .etiquetas {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
    color: ${({ theme }) => theme.text};
  }
  .monto {
    font-weight: 700;
    white-space: nowrap;
  }
  .pista {
    margin: 6px 0 4px;
    height: 10px;
    border-radius: 4px;
    background: ${({ theme }) => theme.color2}55;
  }
  .barra {
    height: 100%;
    border-radius: 4px;
    background: ${({ theme }) => theme.text};
    transition: width 0.4s ease;
  }
  .detalle {
    font-size: 12px;
    color: ${({ theme }) => theme.colortitlecard};
    opacity: ${({ $activa }) => ($activa ? 1 : 0.75)};
  }
`;
