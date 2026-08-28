import { useState } from "react";
import styled from "styled-components";
import { Btn1, Buscador, Title } from "../../index";
import { v } from "../../styles/variables";
import { useJoyeriaStore } from "../../store/JoyeriaStore";
import { ListaProductosJoyeria } from "../organismos/joyeria/ListaProductosJoyeria";
import { FormProductoJoyeria } from "../organismos/joyeria/FormProductoJoyeria";
import { FormVariante } from "../organismos/joyeria/FormVariante";
import { FormAltaMasivaPiezas } from "../organismos/joyeria/FormAltaMasivaPiezas";
import { TablaInventarioJoyeria } from "../organismos/joyeria/TablaInventarioJoyeria";

/**
 * Pestaña "Joyería" (dentro de Productos). Dos vistas:
 *  - Catálogo: diseños y variantes (alta/edición, alta masiva de piezas).
 *  - Inventario: todas las piezas en una tabla con filtros/orden/búsqueda.
 */
export function JoyeriaTemplate() {
  const { modal, cerrarModal, abrirModal, setBuscador, setDisenoSelect } =
    useJoyeriaStore();
  const [vista, setVista] = useState("catalogo");

  const nuevoDiseno = () => {
    setDisenoSelect(null);
    abrirModal("diseno", "Nuevo");
  };

  return (
    <Container>
      {modal === "diseno" && <FormProductoJoyeria onClose={cerrarModal} />}
      {modal === "variante" && <FormVariante onClose={cerrarModal} />}
      {modal === "piezas_masivo" && (
        <FormAltaMasivaPiezas onClose={cerrarModal} />
      )}

      <div className="subtabs">
        <button
          className={vista === "catalogo" ? "on" : ""}
          onClick={() => setVista("catalogo")}
        >
          Catálogo
        </button>
        <button
          className={vista === "inventario" ? "on" : ""}
          onClick={() => setVista("inventario")}
        >
          Inventario
        </button>
      </div>

      <section className="area1">
        <Title>{vista === "catalogo" ? "Diseños de joyería" : "Inventario de piezas"}</Title>
        {vista === "catalogo" && (
          <Btn1
            funcion={nuevoDiseno}
            bgcolor={v.colorPrincipal}
            titulo="nuevo diseño"
            icono={<v.iconoagregar />}
          />
        )}
      </section>
      <section className="area2">
        <Buscador setBuscador={setBuscador} />
      </section>
      <section className="main">
        {vista === "catalogo" ? (
          <ListaProductosJoyeria />
        ) : (
          <TablaInventarioJoyeria />
        )}
      </section>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  .area1 {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
  }
  .area2 {
    display: flex;
    align-items: center;
  }
`;
