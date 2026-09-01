import styled from "styled-components";
import { RegistrarInventario } from "../formularios/RegistrarInventario";
import { TablaInventarios } from "../tablas/TablaInventarios";
import { useQuery } from "@tanstack/react-query";

import { useMovStockStore } from "../../../store/MovStockStore";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useProductosStore } from "../../../store/ProductosStore";
import { Title } from "../../atomos/Title";
import { Btn1 } from "../../moleculas/Btn1";
import { useState } from "react";
import { BuscadorList } from "../../ui/lists/BuscadorList";
import { useGlobalStore } from "../../../store/GlobalStore";

/**
 * Sub-pestaña "Inventario" dentro de "Productos" (movimientos de stock del
 * catálogo plano). Movido desde pages/Inventario.jsx para vivir junto al
 * catálogo, igual que Joyería tiene su propio Catálogo/Inventario.
 */
export function InventarioProductos() {
  const { mostrarMovStock } = useMovStockStore();
  const { dataempresa } = useEmpresaStore();
  const { buscarProductos, buscador } = useProductosStore();
  const { productosItemSelect, setBuscador, selectProductos } =
    useProductosStore();
  const [openRegistro, SetopenRegistro] = useState(false);
  const { setStateClose, setAccion, stateClose, accion } = useGlobalStore();

  const [dataSelect, setdataSelect] = useState([]);
  const [isExploding, setIsExploding] = useState(false);
  const {
    data: dataproductos,
    isLoading: isLoadingBuscarProductos,
    error,
  } = useQuery({
    queryKey: ["buscar productos", buscador],
    queryFn: () =>
      buscarProductos({
        id_empresa: dataempresa?.id,
        buscador: buscador,
      }),
    enabled: !!dataempresa,
  });

  const { data, isLoading } = useQuery({
    queryKey: [
      "mostrar movimientos de stock",
      {
        id_empresa: dataempresa?.id,
        id_producto: productosItemSelect?.id,
      },
    ],
    queryFn: () =>
      mostrarMovStock({
        id_empresa: dataempresa?.id,
        id_producto: productosItemSelect?.id,
      }),
    enabled: !!dataempresa,
  });

  function nuevoRegistro() {
    setStateClose(true);
    setAccion("Nuevo");
    setdataSelect([]);
  }
  return (
    <Container>
      {stateClose && <RegistrarInventario />}

      <section className="area1">
        {productosItemSelect?.nombre && (
          <span>
            {" "}
            Producto: <strong>{productosItemSelect?.nombre}</strong>{" "}
          </span>
        )}
        |<Title>Inventario</Title>
        <Btn1 funcion={nuevoRegistro} titulo="Registrar" />
      </section>
      <section className="area2">
        <BuscadorList
          setBuscador={setBuscador}
          data={dataproductos}
          onSelect={selectProductos}
        />
      </section>

      <section className="main">
        <TablaInventarios
          setdataSelect={setdataSelect}
          setAccion={setAccion}
          SetopenRegistro={SetopenRegistro}
          data={data}
        />
      </section>
    </Container>
  );
}
const Container = styled.div`
  display: grid;
  grid-template:
    "area1" 60px
    "area2" 60px
    "main" auto;
  gap: 8px;
  .area1 {
    grid-area: area1;
    display: flex;
    justify-content: end;
    align-items: center;
    gap: 15px;
  }
  .area2 {
    grid-area: area2;
    display: flex;
    justify-content: end;
    align-items: center;
  }
  .main {
    grid-area: main;
  }
`;
