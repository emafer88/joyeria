import { useEffect, useState } from "react";
import styled from "styled-components";
import { BarLoader } from "react-spinners";
import { useQuery } from "@tanstack/react-query";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useDashboardStore } from "../../../store/DashboardStore";
import { useUsuariosStore } from "../../../store/UsuariosStore";
import { VentasPorHoraDashboard } from "../../../supabaseCrud/crudDashboard";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Una sola tonalidad (azul) de menos a más, en 5 niveles; validadas como
// rampa ordinal contra el fondo de cada tema. En oscuro "más" es más claro.
const NIVELES = {
  light: ["#86b6ef", "#5598e7", "#2a78d6", "#1c5cab", "#104281"],
  dark: ["#184f95", "#256abf", "#3987e5", "#6da7ec", "#9ec5f4"],
};

// 14 -> "2p"; para la etiqueta de la columna.
const horaCorta = (h) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`;
// 14 -> "2:00 p.m."
const horaLarga = (h) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h < 12 ? "a.m." : "p.m."}`;

function useEsMovil() {
  const consulta = "(max-width: 767.98px)";
  const [esMovil, setEsMovil] = useState(() => window.matchMedia(consulta).matches);
  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const cambio = (e) => setEsMovil(e.matches);
    mq.addEventListener("change", cambio);
    return () => mq.removeEventListener("change", cambio);
  }, []);
  return esMovil;
}

/**
 * Ventas cobradas por día de la semana y hora (mapa de calor). Se puede ver
 * por número de ventas o por monto; al pasar el mouse (o tocar) una celda se
 * lee su detalle abajo. En celular se gira: días en columnas, horas en filas.
 */
export const MapaCalorVentas = () => {
  const { dataempresa } = useEmpresaStore();
  const { fechaInicio, fechaFin } = useDashboardStore();
  // Misma regla que App.jsx: tema "light" es claro, cualquier otro oscuro.
  const { datausuarios } = useUsuariosStore();
  const esMovil = useEsMovil();
  const [medida, setMedida] = useState("ventas");
  const [activa, setActiva] = useState(null);
  const params = {
    _id_empresa: dataempresa?.id,
    _fecha_inicio: fechaInicio,
    _fecha_fin: fechaFin,
  };
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["ventas por hora dashboard", params],
    queryFn: () => VentasPorHoraDashboard(params),
    enabled: !!dataempresa?.id && !!fechaInicio && !!fechaFin,
    refetchOnWindowFocus: false,
  });
  const dinero = (n) =>
    FormatearNumeroDinero(Number(n) || 0, dataempresa?.currency, dataempresa?.iso);

  if (isLoading) return <BarLoader color="#6d6d6d" />;
  if (error) return <span>error...{error.message}</span>;

  const celdas = new Map(data.map((c) => [`${c.dia}-${c.hora}`, c]));
  const valor = (c) => Number(c?.[medida === "ventas" ? "ventas" : "total"] ?? 0);
  const maximo = Math.max(0, ...data.map(valor));
  // Horario comercial de 9 a 8 p.m., ampliado si hubo ventas fuera de él.
  const horasConVentas = data.map((c) => c.hora);
  const desde = Math.min(9, ...horasConVentas);
  const hasta = Math.max(20, ...horasConVentas);
  const horas = Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i);
  const dias = [1, 2, 3, 4, 5, 6, 7];
  const rampa = NIVELES[datausuarios?.tema === "light" ? "light" : "dark"];
  const nivel = (v) =>
    v <= 0 || maximo <= 0 ? null : Math.min(4, Math.ceil((v / maximo) * 5) - 1);

  const pico = data.reduce((m, c) => (valor(c) > valor(m) ? c : m), null);
  const describir = (dia, hora) => {
    const c = celdas.get(`${dia}-${hora}`);
    const n = Number(c?.ventas ?? 0);
    return `${DIAS[dia - 1]}, ${horaLarga(hora)} a ${horaLarga((hora + 1) % 24)} · ${n} venta${
      n === 1 ? "" : "s"
    } · ${dinero(c?.total)}`;
  };
  const lectura = activa
    ? describir(activa.dia, activa.hora)
    : pico
    ? `Hora más fuerte: ${describir(pico.dia, pico.hora)}`
    : "Sin ventas en este periodo";

  // Escritorio: filas = días, columnas = horas. Celular: al revés.
  const filas = esMovil ? horas : dias;
  const columnas = esMovil ? dias : horas;
  const etiquetaFila = (f) => (esMovil ? horaCorta(f) : DIAS_CORTOS[f - 1]);
  const etiquetaColumna = (c) => (esMovil ? DIAS_CORTOS[c - 1] : horaCorta(c));

  return (
    <Container>
      <header>
        <div>
          <h3>¿Cuándo se vende más?</h3>
          <span className="sub">Ventas cobradas por día y hora</span>
        </div>
        <div className="medidas" role="group" aria-label="Medir por">
          {[
            ["ventas", "Número de ventas"],
            ["total", "Monto"],
          ].map(([id, texto]) => (
            <button
              key={id}
              className={medida === id ? "activo" : ""}
              onClick={() => setMedida(id)}
            >
              {texto}
            </button>
          ))}
        </div>
      </header>

      <Rejilla
        $columnas={columnas.length}
        role="grid"
        aria-label="Mapa de calor de ventas por día y hora"
        onMouseLeave={() => setActiva(null)}
      >
        <span />
        {columnas.map((c) => (
          <span key={`c${c}`} className="eje">
            {etiquetaColumna(c)}
          </span>
        ))}
        {filas.map((f) => (
          <Fila key={`f${f}`}>
            <span className="eje fila">{etiquetaFila(f)}</span>
            {columnas.map((c) => {
              const dia = esMovil ? c : f;
              const hora = esMovil ? f : c;
              const n = nivel(valor(celdas.get(`${dia}-${hora}`)));
              const esActiva = activa?.dia === dia && activa?.hora === hora;
              return (
                <Celda
                  key={`${dia}-${hora}`}
                  role="gridcell"
                  tabIndex={0}
                  aria-label={describir(dia, hora)}
                  $color={n == null ? null : rampa[n]}
                  $activa={esActiva}
                  onMouseEnter={() => setActiva({ dia, hora })}
                  onFocus={() => setActiva({ dia, hora })}
                  onClick={() => setActiva({ dia, hora })}
                />
              );
            })}
          </Fila>
        ))}
      </Rejilla>

      <footer>
        <span className="lectura" aria-live="polite">
          {lectura}
        </span>
        <span className="leyenda" aria-hidden="true">
          Menos
          <span className="cero" />
          {rampa.map((c) => (
            <span key={c} style={{ background: c }} />
          ))}
          Más
        </span>
      </footer>
    </Container>
  );
};

// Las celdas de una fila van directo en la rejilla (display: contents).
const Fila = styled.div`
  display: contents;
`;

const Container = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: ${({ theme }) => theme.colortitlecard};
    }
    .sub {
      font-size: 13px;
      color: #6b7280;
    }
  }
  .medidas {
    display: flex;
    gap: 4px;
  }
  .medidas button {
    border: 1px solid ${({ theme }) => theme.color2};
    background: none;
    color: ${({ theme }) => theme.text};
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 13px;
    cursor: pointer;
  }
  .medidas button.activo {
    background: ${({ theme }) => theme.text};
    border-color: ${({ theme }) => theme.text};
    color: ${({ theme }) => theme.body};
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    font-size: 13px;
  }
  .lectura {
    color: ${({ theme }) => theme.text};
    font-weight: 500;
    min-height: 1.2em;
  }
  .leyenda {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: #6b7280;
    font-size: 12px;
    span {
      width: 14px;
      height: 14px;
      border-radius: 3px;
    }
    span:first-of-type {
      margin-left: 4px;
    }
    span:last-of-type {
      margin-right: 4px;
    }
    .cero {
      background: ${({ theme }) => theme.color2}55;
    }
  }
`;

const Rejilla = styled.div`
  display: grid;
  grid-template-columns: auto repeat(${({ $columnas }) => $columnas}, minmax(0, 1fr));
  gap: 3px;
  .eje {
    font-size: 11px;
    color: #6b7280;
    text-align: center;
    white-space: nowrap;
  }
  .eje.fila {
    text-align: right;
    padding-right: 6px;
    align-self: center;
  }
`;

const Celda = styled.div`
  aspect-ratio: 1.6;
  min-height: 18px;
  border-radius: 4px;
  background: ${({ $color, theme }) => $color ?? `${theme.color2}55`};
  outline: ${({ $activa, theme }) => ($activa ? `2px solid ${theme.text}` : "none")};
  outline-offset: 1px;
  cursor: default;
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.text};
  }
`;
