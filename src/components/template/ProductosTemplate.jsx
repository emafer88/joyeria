import styled from "styled-components";
import {
  Btn1,
  Buscador,
  RegistrarProductos,
  TablaProductos,
  Title,
  useProductosStore,
} from "../../index";
import { v } from "../../styles/variables";
import { useState } from "react";
import ConfettiExplosion from "react-confetti-explosion";
import { Toaster } from "sonner";
import { JoyeriaTemplate } from "./JoyeriaTemplate";
export function ProductosTemplate() {
  const [openRegistro, SetopenRegistro] = useState(false);
  const { dataProductos, setBuscador, generarCodigo } = useProductosStore();
  const [accion, setAccion] = useState("");
  const [dataSelect, setdataSelect] = useState([]);
  const [isExploding, setIsExploding] = useState(false);
  // pestañas: 'productos' (catálogo plano actual) | 'joyeria' (inventario serializado)
  const [tab, setTab] = useState("productos");
  function nuevoRegistro() {
    SetopenRegistro(!openRegistro);
    setAccion("Nuevo");
    setdataSelect([]);
    setIsExploding(false);
    generarCodigo();
  }

  return (
    <Container>
      <Toaster />

      <nav className="tabs">
        <button
          className={tab === "productos" ? "on" : ""}
          onClick={() => setTab("productos")}
        >
          Productos
        </button>
        <button
          className={tab === "joyeria" ? "on" : ""}
          onClick={() => setTab("joyeria")}
        >
          Joyería
        </button>
      </nav>

      {tab === "joyeria" ? (
        <JoyeriaTemplate />
      ) : (
        <div className="grid-productos">
          {openRegistro && (
            <RegistrarProductos
              setIsExploding={setIsExploding}
              onClose={() => SetopenRegistro(!openRegistro)}
              dataSelect={dataSelect}
              accion={accion}
              state={openRegistro}
            />
          )}

          <section className="area1">
            <Title>Productos</Title>
            <Btn1
              funcion={nuevoRegistro}
              bgcolor={v.colorPrincipal}
              titulo="nuevo"
              icono={<v.iconoagregar />}
            />
          </section>
          <section className="area2">
            <Buscador setBuscador={setBuscador} />
          </section>

          <section className="main">
            {isExploding && <ConfettiExplosion />}
            <TablaProductos
              setdataSelect={setdataSelect}
              setAccion={setAccion}
              SetopenRegistro={SetopenRegistro}
              data={dataProductos}
            />
          </section>
        </div>
      )}
    </Container>
  );
}
const Container = styled.div`
  min-height: calc(100vh - 80px);
  margin-top: 50px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  .tabs {
    display: flex;
    gap: 8px;
    border-bottom: 2px solid ${({ theme }) => theme.color2};
  }
  .tabs button {
    background: none;
    border: none;
    padding: 10px 18px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    color: ${({ theme }) => theme.text};
    opacity: 0.5;
    border-bottom: 3px solid transparent;
  }
  .tabs button.on {
    opacity: 1;
    border-bottom-color: #f3d20c;
  }
  .grid-productos {
    flex: 1;
    display: grid;
    grid-template:
      "area1" 60px
      "area2" 60px
      "main" auto;
  }
  .grid-productos .area1 {
    grid-area: area1;
    display: flex;
    justify-content: end;
    align-items: center;
    gap: 15px;
  }
  .grid-productos .area2 {
    grid-area: area2;
    display: flex;
    justify-content: end;
    align-items: center;
  }
  .grid-productos .main {
    grid-area: main;
  }
`;
