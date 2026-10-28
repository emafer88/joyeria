import { useMemo, useState } from "react";
import styled from "styled-components";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Btn1, Spinner1, Title } from "../../index";
import { v } from "../../styles/variables";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { useProductosStore } from "../../store/ProductosStore";
import { useMovStockStore } from "../../store/MovStockStore";
import { useAlmacenesStore } from "../../store/AlmacenesStore";
import { useGlobalStore } from "../../store/GlobalStore";
import { RegistrarInventario } from "../organismos/formularios/RegistrarInventario";
import { MovimientosProducto } from "../organismos/productos/MovimientosProducto";
import { AdminAtributos } from "../organismos/atributos/AdminAtributos";
import { CatalogoRopa } from "../organismos/ropa/CatalogoRopa";
import { InventarioRopa } from "../organismos/ropa/InventarioRopa";
import { FormProductoRopa } from "../organismos/ropa/FormProductoRopa";
import {
  MostrarProductoRopa,
  RopaInventario,
  agruparPorProducto,
  nombreCombinacion,
} from "../../supabaseCrud/crudCombinaciones";

/**
 * Pestaña "Ropa y calzado" (dentro de Productos), para giros con tallas.
 *  - Catálogo: productos con su cuadrícula talla × color; "nuevo" y
 *    "Editar" abren el formulario en lugar de la lista.
 *  - Inventario: cada talla y color por almacén, con filtros y orden.
 */
export function RopaTemplate() {
  const { dataempresa } = useEmpresaStore();
  const { selectProductos } = useProductosStore();
  const { setTipo, setCombinacion, mostrarMovStock } = useMovStockStore();
  const { setAlmacenSelectItem } = useAlmacenesStore();
  const { stateClose, setStateClose, setAccion } = useGlobalStore();
  const [vista, setVista] = useState("catalogo");
  // Formulario dentro del Catálogo: null = lista, "nuevo" o id del producto.
  const [formulario, setFormulario] = useState(null);
  const [buscador, setBuscador] = useState("");
  const [historial, setHistorial] = useState(null); // fila de inventario
  const [openAtributos, setOpenAtributos] = useState(false);

  const { data: filas = [], isLoading, error } = useQuery({
    queryKey: ["ropa inventario", dataempresa?.id],
    queryFn: () => RopaInventario({ id_empresa: dataempresa.id }),
    enabled: !!dataempresa?.id,
  });
  const productos = useMemo(() => agruparPorProducto(filas), [filas]);

  const { data: movimientos } = useQuery({
    queryKey: [
      "mostrar movimientos de stock",
      { id_empresa: dataempresa?.id, id_producto: historial?.id_producto },
    ],
    queryFn: () =>
      mostrarMovStock({
        id_empresa: dataempresa.id,
        id_producto: historial.id_producto,
      }),
    enabled: !!dataempresa?.id && !!historial,
  });

  function irA(v) {
    setVista(v);
    setHistorial(null);
    setFormulario(null);
  }
  // Abre el formulario de entrada/salida con el producto, la talla/color y el
  // almacén del renglón ya elegidos.
  async function registrar(fila, tipo) {
    try {
      const p = await MostrarProductoRopa(fila.id_producto);
      selectProductos(p);
      setCombinacion({ id: fila.id_combinacion, id_producto: fila.id_producto });
      setAlmacenSelectItem({ id: fila.id_almacen, nombre: fila.almacen });
      setTipo(tipo);
      setAccion("Nuevo");
      setStateClose(true);
    } catch (e) {
      toast.error(e.message);
    }
  }

  const titulo =
    vista === "catalogo"
      ? "Ropa y calzado"
      : historial
      ? "Movimientos"
      : "Inventario de ropa y calzado";

  return (
    <Container>
      {stateClose && <RegistrarInventario />}
      {openAtributos && <AdminAtributos onClose={() => setOpenAtributos(false)} />}

      <div className="subtabs">
        <button
          className={vista === "catalogo" ? "on" : ""}
          onClick={() => irA("catalogo")}
        >
          Catálogo
        </button>
        <button
          className={vista === "inventario" ? "on" : ""}
          onClick={() => irA("inventario")}
        >
          Inventario
        </button>
      </div>

      {vista === "catalogo" && formulario ? (
        <FormProductoRopa
          key={formulario}
          idProducto={formulario === "nuevo" ? null : formulario}
          onListo={() => setFormulario(null)}
        />
      ) : (
        <>
          <section className="area1">
            <Title>{titulo}</Title>
            {vista === "catalogo" && (
              <div className="botones">
                <Btn1
                  funcion={() => setOpenAtributos(true)}
                  bgcolor={v.colorSecundario}
                  titulo="Atributos"
                />
                <Btn1
                  funcion={() => setFormulario("nuevo")}
                  bgcolor="acento"
                  titulo="nuevo"
                  icono={<v.iconoagregar />}
                />
              </div>
            )}
          </section>

          {historial ? (
            <>
              <div className="historial">
                <button className="volver" onClick={() => setHistorial(null)}>
                  ← Inventario
                </button>
                <span>
                  <strong>{historial.producto}</strong> ·{" "}
                  {nombreCombinacion(historial)}
                </span>
              </div>
              <MovimientosProducto
                data={(movimientos ?? []).filter(
                  (m) => m.id_combinacion === historial.id_combinacion
                )}
                producto={{ sevende_por: "UNIDAD" }}
              />
            </>
          ) : (
            <>
              <label className="buscar">
                <input
                  type="search"
                  placeholder={
                    vista === "catalogo"
                      ? "Buscar producto, categoría, marca o color"
                      : "Buscar producto, código, talla o color"
                  }
                  value={buscador}
                  onChange={(e) => setBuscador(e.target.value)}
                />
              </label>
              {isLoading ? (
                <Spinner1 />
              ) : error ? (
                <p className="err">Error: {error.message}</p>
              ) : vista === "catalogo" ? (
                <CatalogoRopa
                  productos={productos}
                  buscador={buscador}
                  onEditar={setFormulario}
                />
              ) : (
                <InventarioRopa
                  filas={filas}
                  buscador={buscador}
                  onEntrada={(r) => registrar(r, "ingreso")}
                  onSalida={(r) => registrar(r, "salida")}
                  onHistorial={setHistorial}
                />
              )}
            </>
          )}
        </>
      )}
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
    flex-wrap: wrap;
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
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 10px 15px;
  }
  .botones {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .buscar input {
    width: 100%;
    max-width: 420px;
    padding: 9px 12px;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.body};
    color: ${({ theme }) => theme.text};
    font-size: 14px;
  }
  .historial {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    strong {
      text-transform: capitalize;
    }
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
  .vacio {
    text-align: center;
    opacity: 0.6;
    font-style: italic;
    padding: 30px 0;
  }
  .err {
    color: #f46943;
  }
`;
