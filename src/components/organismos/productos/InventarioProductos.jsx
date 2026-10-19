import styled from "styled-components";
import { RegistrarInventario } from "../formularios/RegistrarInventario";
import { TablaExistencias } from "./TablaExistencias";
import { MovimientosProducto } from "./MovimientosProducto";
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
  const { mostrarMovStock, setTipo } = useMovStockStore();
  const { dataempresa } = useEmpresaStore();
  const { buscarProductos, buscador } = useProductosStore();
  const { setBuscador, selectProductos } = useProductosStore();
  const { setStateClose, setAccion, stateClose } = useGlobalStore();

  // null = lista de existencias; un producto = sus movimientos.
  const [productoMovs, setProductoMovs] = useState(null);
  const { data: dataproductos } = useQuery({
    queryKey: ["buscar productos", buscador],
    queryFn: () =>
      buscarProductos({
        id_empresa: dataempresa?.id,
        buscador: buscador,
      }),
    enabled: !!dataempresa && !!productoMovs,
  });

  const { data } = useQuery({
    queryKey: [
      "mostrar movimientos de stock",
      {
        id_empresa: dataempresa?.id,
        id_producto: productoMovs?.id,
      },
    ],
    queryFn: () =>
      mostrarMovStock({
        id_empresa: dataempresa?.id,
        id_producto: productoMovs?.id,
      }),
    enabled: !!dataempresa && !!productoMovs,
  });

  function nuevoRegistro() {
    setTipo("ingreso");
    setStateClose(true);
    setAccion("Nuevo");
  }
  // Abre el formulario de entrada/salida con el producto del renglón ya
  // elegido.
  function registrarDesdeFila(fila, tipo) {
    selectProductos(fila.productos);
    setTipo(tipo);
    setStateClose(true);
    setAccion("Nuevo");
  }
  return (
    <Container>
      {stateClose && <RegistrarInventario />}

      <section className="area1">
        {productoMovs ? (
          <button className="volver" onClick={() => setProductoMovs(null)}>
            ← Existencias
          </button>
        ) : (
          <span className="ayuda">
            Cuánto tienes de cada producto que controla stock.
          </span>
        )}
        <div className="derecha">
          <Title>{productoMovs ? "Movimientos" : "Inventario"}</Title>
          <Btn1 funcion={nuevoRegistro} titulo="Registrar entrada/salida" />
        </div>
      </section>

      {productoMovs ? (
        <>
          <section className="area2">
            <span>
              Producto: <strong>{productoMovs.nombre}</strong>
            </span>
            <BuscadorList
              setBuscador={setBuscador}
              data={dataproductos}
              onSelect={setProductoMovs}
            />
          </section>
          <section className="main">
            <MovimientosProducto data={data} producto={productoMovs} />
          </section>
        </>
      ) : (
        <section className="main">
          <TablaExistencias
            onEntrada={(fila) => registrarDesdeFila(fila, "ingreso")}
            onSalida={(fila) => registrarDesdeFila(fila, "salida")}
            onMovimientos={(fila) => setProductoMovs(fila.productos)}
          />
        </section>
      )}
    </Container>
  );
}
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  .area1 {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 10px 15px;
  }
  .area1 .derecha {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  .ayuda {
    opacity: 0.7;
    font-size: 14px;
  }
  .volver {
    background: none;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
    padding: 7px 12px;
    cursor: pointer;
    color: ${({ theme }) => theme.text};
    font-size: 14px;
  }
  .area2 {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
  @media (max-width: 767.98px) {
    .area1 .derecha {
      width: 100%;
      justify-content: space-between;
    }
    .area2 > * {
      width: 100%;
    }
  }
`;
