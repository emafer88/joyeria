import { useEffect, useMemo, useState } from "react";
import styled, { ThemeProvider } from "styled-components";
import { Btn1 } from "../components/moleculas/Btn1";
import { useEmpresaStore } from "../store/EmpresaStore";
import { useThemeStore } from "../store/ThemeStore";
import { useGuardarPaletaMutation } from "../tanstack/EmpresaStack";
import { Dark, Light } from "../styles/themes";
import { PALETAS, aplicarPaleta, resolverPaleta } from "../styles/paletas";

// Configuración → Apariencia: paleta de colores del panel para toda la
// empresa. La vista previa usa el tema claro/oscuro del usuario que edita.
export const ConfiguracionApariencia = () => {
  const { dataempresa } = useEmpresaStore();
  const { theme } = useThemeStore();
  const { mutate, isPending } = useGuardarPaletaMutation();

  const guardada = resolverPaleta(dataempresa?.paleta_admin);
  const [seleccion, setSeleccion] = useState(guardada);
  const [personalizado, setPersonalizado] = useState(
    guardada.id === "personalizada" ? guardada.acento : "#0f766e"
  );

  // Si la empresa termina de cargar después de montar la página.
  useEffect(() => {
    setSeleccion(guardada);
    if (guardada.id === "personalizada") setPersonalizado(guardada.acento);
  }, [guardada.id, guardada.acento]);

  const valor =
    seleccion.id === "personalizada"
      ? { id: "personalizada", acento: personalizado }
      : { id: seleccion.id };

  const sinCambios =
    valor.id === guardada.id &&
    (valor.id !== "personalizada" || valor.acento === guardada.acento);

  const temaPrevia = useMemo(
    () => aplicarPaleta(theme === "light" ? Light : Dark, valor),
    [theme, valor.id, valor.acento]
  );

  return (
    <Container>
      <header>
        <h1>Apariencia</h1>
        <p className="ayuda">
          Elige los colores del panel. Se aplican a todos los usuarios de la
          empresa; cada quien sigue eligiendo modo claro u oscuro.
        </p>
      </header>

      <div className="cuerpo">
        <section>
          <h2>Paletas</h2>
          <div className="paletas" role="radiogroup" aria-label="Paleta de colores">
            {PALETAS.map((p) => (
              <TarjetaPaleta
                key={p.id}
                type="button"
                role="radio"
                aria-checked={seleccion.id === p.id}
                className={seleccion.id === p.id ? "activa" : ""}
                onClick={() => setSeleccion(p)}
              >
                <Muestras acento={p.acento} menu={p.menu} />
                <span>{p.nombre}</span>
              </TarjetaPaleta>
            ))}
            <TarjetaPaleta
              as="label"
              role="radio"
              aria-checked={seleccion.id === "personalizada"}
              className={seleccion.id === "personalizada" ? "activa" : ""}
              onClick={() => setSeleccion({ id: "personalizada" })}
            >
              <Muestras acento={personalizado} menu={personalizado} />
              <span className="personalizada">
                Personalizada
                <input
                  type="color"
                  value={personalizado}
                  aria-label="Color personalizado"
                  onChange={(e) => {
                    setPersonalizado(e.target.value);
                    setSeleccion({ id: "personalizada" });
                  }}
                />
              </span>
            </TarjetaPaleta>
          </div>

          <div className="acciones">
            {sinCambios ? (
              <span className="actual">Paleta actual: {guardada.nombre}</span>
            ) : (
              <Btn1
                bgcolor="acento"
                titulo={isPending ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
                disabled={isPending}
                type="button"
                funcion={() => mutate(valor)}
              />
            )}
            {!sinCambios && (
              <button
                type="button"
                className="deshacer"
                onClick={() => {
                  setSeleccion(guardada);
                  if (guardada.id === "personalizada") setPersonalizado(guardada.acento);
                }}
              >
                Deshacer
              </button>
            )}
          </div>
        </section>

        <section>
          <h2>Vista previa</h2>
          <ThemeProvider theme={temaPrevia}>
            <VistaPrevia />
          </ThemeProvider>
        </section>
      </div>
    </Container>
  );
};

function Muestras({ acento, menu }) {
  return (
    <span className="muestras" aria-hidden="true">
      <i style={{ background: acento }} />
      <i style={{ background: menu }} />
    </span>
  );
}

function VistaPrevia() {
  return (
    <Previa>
      <nav>
        <span className="item">Inicio</span>
        <span className="item activo">Productos</span>
        <span className="item">Ventas</span>
      </nav>
      <div className="contenido">
        <div className="tabs">
          <span className="on">General</span>
          <span>Joyería</span>
        </div>
        <p>Así se ven los botones, las pestañas y la paginación.</p>
        <div className="botones">
          <Btn1 bgcolor="acento" titulo="GUARDAR" type="button" />
        </div>
        <div className="paginacion">
          <span className="pag">‹</span>
          <span className="num">1</span>
          <span className="pag">›</span>
        </div>
      </div>
    </Previa>
  );
}

const Container = styled.div`
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  color: ${({ theme }) => theme.text};
  h1 {
    font-size: 24px;
    margin-bottom: 6px;
  }
  h2 {
    font-size: 15px;
    margin: 0 0 12px;
    opacity: 0.8;
  }
  .ayuda {
    color: ${({ theme }) => theme.colorSubtitle};
    font-size: 13px;
    margin: 0 0 20px;
  }
  .cuerpo {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
    @media (min-width: 900px) {
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
    }
  }
  .paletas {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 10px;
  }
  .acciones {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 22px;
  }
  .actual {
    font-size: 14px;
    color: ${({ theme }) => theme.colorSubtitle};
  }
  .deshacer {
    background: none;
    border: none;
    color: ${({ theme }) => theme.text};
    text-decoration: underline;
    cursor: pointer;
    font-size: 14px;
  }
`;

const TarjetaPaleta = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid ${({ theme }) => theme.color2};
  background: ${({ theme }) => theme.bgcards};
  color: ${({ theme }) => theme.text};
  font: inherit;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  &.activa {
    border-color: ${({ theme }) => theme.text};
    box-shadow: 0 0 0 1px ${({ theme }) => theme.text};
  }
  .muestras {
    display: flex;
    i {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid ${({ theme }) => theme.bgcards};
      &:last-child {
        margin-left: -8px;
      }
    }
  }
  .personalizada {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  input[type="color"] {
    width: 32px;
    height: 24px;
    padding: 0;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 6px;
    background: none;
    cursor: pointer;
  }
`;

const Previa = styled.div`
  display: flex;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.bordercolorDash};
  background: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
  min-height: 260px;
  nav {
    width: 130px;
    flex-shrink: 0;
    padding: 12px 8px;
    border-right: 1px solid ${({ theme }) => theme.color2};
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .item {
    padding: 10px;
    border-radius: 10px;
    border: 2px solid transparent;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
  }
  .item.activo {
    background: ${({ theme }) => theme.bg6};
    border-color: ${({ theme }) => theme.bg5};
    color: ${({ theme }) => theme.color1};
  }
  .contenido {
    flex: 1;
    min-width: 0;
    padding: 14px;
    p {
      font-size: 13px;
      color: ${({ theme }) => theme.colorSubtitle};
    }
  }
  .tabs {
    display: flex;
    gap: 14px;
    span {
      font-weight: 600;
      padding-bottom: 4px;
      opacity: 0.5;
      border-bottom: 3px solid transparent;
    }
    .on {
      opacity: 1;
      border-bottom-color: ${({ theme }) => theme.acentoLinea};
    }
  }
  .botones {
    margin: 16px 0;
  }
  .paginacion {
    display: flex;
    align-items: center;
    gap: 8px;
    .pag {
      width: 34px;
      height: 30px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      font-weight: 700;
      background: ${({ theme }) => theme.acento};
      color: ${({ theme }) => theme.acentoTexto};
    }
  }
`;
