import styled from "styled-components";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { useReportesFiltrosStore } from "../../../store/ReportesFiltrosStore";

const { RangePicker } = DatePicker;

// `dias`: null = sin límite (todas las fechas); 0 = hoy; N = últimos N días.
const PRESETS = [
  { label: "Todo", dias: null },
  { label: "Hoy", dias: 0 },
  { label: "7 días", dias: 7 },
  { label: "30 días", dias: 30 },
  { label: "12 meses", dias: 365 },
];

/**
 * Selector de rango de fechas para el Reporte de Ventas. Escribe en
 * `ReportesFiltrosStore` (NO en `DashboardStore`, que es del Dashboard).
 */
export const ReportesDateRange = () => {
  const { fechaInicio, fechaFin, setRangoFechas } = useReportesFiltrosStore();

  const aplicarPreset = (dias) => {
    if (dias === null) return setRangoFechas(null, null);
    const fin = dayjs().endOf("day");
    const inicio =
      dias === 0
        ? dayjs().startOf("day")
        : dayjs().subtract(dias, "day").startOf("day");
    setRangoFechas(inicio.format("YYYY-MM-DD"), fin.format("YYYY-MM-DD"));
  };

  const onRange = (val) => {
    if (!val || !val[0] || !val[1]) return setRangoFechas(null, null);
    setRangoFechas(val[0].format("YYYY-MM-DD"), val[1].format("YYYY-MM-DD"));
  };

  const valor =
    fechaInicio && fechaFin ? [dayjs(fechaInicio), dayjs(fechaFin)] : null;
  const sinRango = !fechaInicio && !fechaFin;

  return (
    <Container>
      <div className="presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={sinRango && p.dias === null ? "on" : ""}
            onClick={() => aplicarPreset(p.dias)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <RangePicker
        format="YYYY-MM-DD"
        value={valor}
        onChange={onRange}
        allowClear
      />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 10px 0;
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .presets button {
    background: transparent;
    color: ${({ theme }) => theme.text};
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
    padding: 6px 14px;
    font-size: 14px;
    cursor: pointer;
  }
  .presets button.on {
    background: ${({ theme }) => theme.bg};
    font-weight: 700;
  }
`;
