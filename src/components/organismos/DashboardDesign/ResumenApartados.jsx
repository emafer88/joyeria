import styled from "styled-components";
import { BarLoader } from "react-spinners";
import { useQuery } from "@tanstack/react-query";
import { Device } from "../../../styles/breakpoints";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { MostrarApartados } from "../../../supabaseCrud/crudApartados";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import { fechaCorta } from "../POSDesign/ModalApartar";

// Días de hoy (local) a la fecha YYYY-MM-DD; negativo si ya pasó.
const diasHasta = (f) => {
  const hoy = new Date(`${new Date().toLocaleDateString("en-CA")}T12:00:00`);
  return Math.round((new Date(`${f}T12:00:00`) - hoy) / 86400000);
};

const PROXIMOS_DIAS = 7;

/**
 * Apartados activos al día de hoy (no depende del filtro de fechas): cuántos
 * hay, cuánto falta por cobrar, vencidos y por vencer, y los que requieren
 * atención primero. Usa la misma consulta que el panel de Apartados del POS.
 */
export function ResumenApartados() {
  const { dataempresa } = useEmpresaStore();
  const { data: apartados = [], isLoading, error } = useQuery({
    queryKey: ["apartados"],
    queryFn: MostrarApartados,
    refetchOnWindowFocus: false,
  });
  const dinero = (n) =>
    FormatearNumeroDinero(Number(n) || 0, dataempresa?.currency, dataempresa?.iso);

  if (isLoading) return <BarLoader color="#6d6d6d" />;
  if (error) return <span>error...{error.message}</span>;

  const conDias = apartados.map((a) => ({
    ...a,
    dias: a.apartado_vence ? diasHasta(a.apartado_vence) : null,
  }));
  const vencidos = conDias.filter((a) => a.dias != null && a.dias < 0);
  const porVencer = conDias.filter((a) => a.dias != null && a.dias >= 0 && a.dias <= PROXIMOS_DIAS);
  const porCobrar = conDias.reduce((s, a) => s + a.saldo, 0);
  const atencion = [...vencidos, ...porVencer]
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 5);

  const cuando = (d) =>
    d < 0
      ? `venció hace ${-d} día${d === -1 ? "" : "s"}`
      : d === 0
      ? "vence hoy"
      : `vence en ${d} día${d === 1 ? "" : "s"}`;

  return (
    <Container>
      <header>
        <h3>Apartados</h3>
        <span className="sub">Al día de hoy · se administran desde el POS</span>
      </header>

      <section className="cifras">
        <div>
          <span className="etiqueta">Activos</span>
          <strong>{apartados.length}</strong>
        </div>
        <div>
          <span className="etiqueta">Por cobrar</span>
          <strong>{dinero(porCobrar)}</strong>
        </div>
        <div>
          <span className="etiqueta">Vencidos</span>
          <strong>{vencidos.length}</strong>
          {vencidos.length > 0 && (
            <span className="nota">
              deben {dinero(vencidos.reduce((s, a) => s + a.saldo, 0))}
            </span>
          )}
        </div>
        <div>
          <span className="etiqueta">Vencen en {PROXIMOS_DIAS} días</span>
          <strong>{porVencer.length}</strong>
        </div>
      </section>

      {apartados.length === 0 ? (
        <p className="vacio">No hay apartados activos.</p>
      ) : atencion.length === 0 ? (
        <p className="vacio">
          Ningún apartado vencido ni por vencer en los próximos {PROXIMOS_DIAS} días.
        </p>
      ) : (
        <>
          <h4>Requieren atención</h4>
          <ul>
            {atencion.map((a) => {
              const pct = a.monto_total > 0 ? (a.abonado / a.monto_total) * 100 : 0;
              return (
                <li key={a.id}>
                  <div className="quien">
                    <span className="cliente">{a.cliente?.nombres ?? "Sin cliente"}</span>
                    <span className="folio">{a.nro_comprobante}</span>
                  </div>
                  <div className="vence">
                    <span className={`estado ${a.dias < 0 ? "vencido" : "pronto"}`}>
                      {a.dias < 0 ? "Vencido" : "Por vencer"}
                    </span>
                    <span className="fecha">
                      {fechaCorta(a.apartado_vence)} · {cuando(a.dias)}
                    </span>
                  </div>
                  <div className="avance">
                    <span className="pista" aria-hidden="true">
                      <span className="barra" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </span>
                    <span className="abonado">
                      {dinero(a.abonado)} de {dinero(a.monto_total)}
                    </span>
                  </div>
                  <div className="saldo">
                    <span className="etiqueta">Saldo</span>
                    <strong>{dinero(a.saldo)}</strong>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Container>
  );
}

const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: ${({ theme }) => theme.text};
  header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${({ theme }) => theme.colortitlecard};
  }
  .sub,
  .etiqueta,
  .nota,
  .folio,
  .fecha,
  .abonado {
    font-size: 12px;
    color: #6b7280;
  }
  .cifras {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    @media ${Device.tablet} {
      grid-template-columns: repeat(4, 1fr);
    }
    div {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 12px;
      border-radius: 12px;
      background: ${({ theme }) => theme.color2}33;
    }
    strong {
      font-size: 22px;
    }
  }
  h4 {
    margin: 4px 0 0;
    font-size: 14px;
    font-weight: 600;
  }
  .vacio {
    margin: 0;
    opacity: 0.6;
    font-style: italic;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
    padding: 12px 0;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    @media ${Device.tablet} {
      grid-template-columns: 1.3fr 1.5fr 1.6fr 0.8fr;
      align-items: center;
      gap: 16px;
    }
  }
  li:last-child {
    border-bottom: none;
  }
  .quien,
  .vence {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .cliente {
    font-weight: 600;
  }
  .folio {
    font-family: monospace;
  }
  .estado {
    align-self: flex-start;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
  }
  .estado.vencido {
    background: #fbdad6;
    color: #a5342a;
  }
  .estado.pronto {
    background: #fdecc8;
    color: #8a5a00;
  }
  .avance {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .pista {
    height: 8px;
    border-radius: 4px;
    background: ${({ theme }) => theme.color2}55;
  }
  .barra {
    display: block;
    height: 100%;
    border-radius: 4px;
    background: ${({ theme }) => theme.text};
  }
  .saldo {
    display: flex;
    flex-direction: column;
    @media ${Device.tablet} {
      align-items: flex-end;
    }
    strong {
      font-size: 16px;
    }
  }
`;
