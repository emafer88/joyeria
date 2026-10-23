import styled from "styled-components";
import {
  AdminMarcas,
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
import { BannersTemplate } from "./BannersTemplate";
import { InventarioProductos } from "../organismos/productos/InventarioProductos";
import { useLicencia } from "../../hooks/useLicencia";
export function ProductosTemplate() {
  const [openRegistro, SetopenRegistro] = useState(false);
  const [openMarcas, setOpenMarcas] = useState(false);
  const { dataProductos, setBuscador, generarCodigo } = useProductosStore();
  const [accion, setAccion] = useState("");
  const [dataSelect, setdataSelect] = useState([]);
  const [isExploding, setIsExploding] = useState(false);
  // pestañas: 'productos' (catálogo plano actual) | 'joyeria' (inventario serializado)
  const [tab, setTab] = useState("productos");
  // sub-pestañas dentro de "Productos": 'catalogo' | 'inventario'
  const [vistaProducto, setVistaProducto] = useState("catalogo");
  // Los banners son de la tienda en línea.
  const { tiene } = useLicencia();
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
        {tiene("tienda") && (
          <button
            className={tab === "banners" ? "on" : ""}
            onClick={() => setTab("banners")}
          >
            Banners
          </button>
        )}
      </nav>

      {tab === "joyeria" ? (
        <JoyeriaTemplate />
      ) : tab === "banners" && tiene("tienda") ? (
        <BannersTemplate />
      ) : (
        <>
          <div className="subtabs">
            <button
              className={vistaProducto === "catalogo" ? "on" : ""}
              onClick={() => setVistaProducto("catalogo")}
            >
              Catálogo
            </button>
            <button
              className={vistaProducto === "inventario" ? "on" : ""}
              onClick={() => setVistaProducto("inventario")}
            >
              Inventario
            </button>
          </div>

          {vistaProducto === "inventario" ? (
            <InventarioProductos />
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

              {openMarcas && (
                <AdminMarcas onClose={() => setOpenMarcas(false)} />
              )}

              <section className="area1">
                <Title>Productos</Title>
                <Btn1
                  funcion={() => setOpenMarcas(true)}
                  bgcolor={v.colorSecundario}
                  titulo="Marcas / colecciones"
                />
                <Btn1
                  funcion={nuevoRegistro}
                  bgcolor="acento"
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
        </>
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
    border-bottom-color: ${({ theme }) => theme.acentoLinea};
  }
  .subtabs {
    display: flex;
    gap: 6px;
  }
  .subtabs button {
    background: none;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 999px;
    padding: 6px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    color: ${({ theme }) => theme.text};
    opacity: 0.6;
  }
  .subtabs button.on {
    opacity: 1;
    background: ${({ theme }) => theme.color2};
  }
  .grid-productos {
    flex: 1;
    display: grid;
    grid-template:
      "area1" minmax(60px, auto)
      "area2" minmax(60px, auto)
      "main" auto;
  }
  .grid-productos .area1 {
    grid-area: area1;
    display: flex;
    flex-wrap: wrap;
    justify-content: end;
    align-items: center;
    gap: 10px 15px;
  }
  .grid-productos .area2 {
    grid-area: area2;
    display: flex;
    justify-content: end;
    align-items: center;
  }
  @media (max-width: 767.98px) {
    .grid-productos .area1 {
      justify-content: flex-start;
      padding-bottom: 8px;
    }
    .grid-productos .area1 h1,
    .grid-productos .area1 > :first-child {
      flex-basis: 100%;
    }
    .grid-productos .area2 > * {
      width: 100%;
    }
  }
  .grid-productos .main {
    grid-area: main;
  }
`;
