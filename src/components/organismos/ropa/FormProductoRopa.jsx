import { useEffect, useState } from "react";
import styled from "styled-components";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Swal from "sweetalert2";
import {
  ConvertirMinusculas,
  Spinner1,
  Switch1,
  useAlmacenesStore,
  useCategoriasStore,
  useProductosStore,
  useSucursalesStore,
} from "../../../index";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { SelectList } from "../../ui/lists/SelectList";
import { SubidorImagenes } from "../imagenes/SubidorImagenes";
import { SelectorAtributos } from "../atributos/SelectorAtributos";
import { EditorCombinaciones } from "../combinaciones/EditorCombinaciones";
import { useLicencia } from "../../../hooks/useLicencia";
import { usePermisosDeMenu } from "../../../hooks/usePermisosDeMenu";
import { useOpcionesProducto } from "../../../hooks/useOpcionesProducto";
import { Generarcodigo } from "../../../hooks/Generarcodigo";
import { EditarOpcionesProducto } from "../../../supabaseCrud/crudProductos";
import {
  AtributosDeProducto,
  SetAtributosProducto,
} from "../../../supabaseCrud/crudAtributos";
import {
  AsignarColorImagen,
  GuardarCombinaciones,
  MostrarProductoRopa,
} from "../../../supabaseCrud/crudCombinaciones";

/**
 * Alta y edición de un producto de ropa o calzado (pestaña Ropa y calzado →
 * Nuevo). Siempre por unidad y con stock por talla y color; todas las
 * combinaciones al precio del producto. `idProducto` null = nuevo.
 */
export function FormProductoRopa({ idProducto, onListo }) {
  const editar = !!idProducto;
  const queryClient = useQueryClient();
  const { tiene } = useLicencia();
  const { veCostos } = usePermisosDeMenu();
  const mostrarCosto = veCostos || !editar;
  const { dataempresa } = useEmpresaStore();
  const { datacategorias } = useCategoriasStore();
  const { dataSucursales } = useSucursalesStore();
  const { mostrarAlmacenesXSucursal } = useAlmacenesStore();
  const {
    insertarProductos,
    editarProductos,
    mostrarImagenesProducto,
    subirImagenesProducto,
    eliminarImagenProducto,
    reordenarImagenesProducto,
    marcas,
    mostrarMarcas,
  } = useProductosStore();

  const { data: producto, isLoading } = useQuery({
    queryKey: ["producto ropa", idProducto],
    queryFn: () => MostrarProductoRopa(idProducto),
    enabled: editar,
    refetchOnWindowFocus: false,
  });

  const [nombre, setNombre] = useState("");
  const [precioVenta, setPrecioVenta] = useState("");
  const [precioCompra, setPrecioCompra] = useState("");
  const [idCategoria, setIdCategoria] = useState(null);
  const [idMarca, setIdMarca] = useState(null);
  const [atributosSel, setAtributosSel] = useState([]);
  const [destacado, setDestacado] = useState(false);
  const [opciones, cambiarOpcion] = useOpcionesProducto(idProducto);
  const [combinaciones, setCombinaciones] = useState(null);
  const [files, setFiles] = useState([]);
  const [imagenes, setImagenes] = useState([]);
  const [sucursal, setSucursal] = useState(null);
  const [almacen, setAlmacen] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (dataempresa?.id) mostrarMarcas({ id_empresa: dataempresa.id });
  }, [dataempresa?.id]);

  useEffect(() => {
    if (!producto) return;
    setNombre(producto.nombre ?? "");
    setPrecioVenta(producto.precio_venta ?? "");
    setPrecioCompra(producto.precio_compra ?? "");
    setIdCategoria(producto.id_categoria ?? null);
    setIdMarca(producto.id_marca ?? null);
    setDestacado(!!producto.destacado);
  }, [producto]);

  useEffect(() => {
    if (!editar) return;
    AtributosDeProducto(idProducto).then(setAtributosSel);
    mostrarImagenesProducto(idProducto).then((r) => setImagenes(r ?? []));
  }, [idProducto]);

  useEffect(() => {
    if (!sucursal && dataSucursales?.length) setSucursal(dataSucursales[0]);
  }, [dataSucursales]);
  const { data: almacenes = [] } = useQuery({
    queryKey: ["almacenes ropa", sucursal?.id],
    queryFn: () => mostrarAlmacenesXSucursal({ id_sucursal: sucursal.id }),
    enabled: !!sucursal?.id,
  });
  useEffect(() => {
    setAlmacen(almacenes?.[0] ?? null);
  }, [almacenes]);

  const categoria = (datacategorias ?? []).find((c) => c.id === idCategoria);
  const colores = [
    ...new Set((combinaciones ?? []).map((c) => c.color).filter(Boolean)),
  ];

  // Se guarda al momento, como borrar o reordenar una foto.
  async function cambiarColorImagen(imagen, color) {
    try {
      await AsignarColorImagen({ id: imagen.id, color });
      setImagenes((prev) =>
        prev.map((x) => (x.id === imagen.id ? { ...x, color: color || null } : x))
      );
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function guardar(e) {
    e.preventDefault();
    if (!nombre.trim()) return toast.error("Escribe el nombre del producto");
    if (!idCategoria) return toast.error("Elige una categoría");
    if (!almacen?.id) return toast.error("Elige el almacén");
    if (!combinaciones?.length)
      return toast.error("Agrega al menos una talla o un color");

    const tallas =
      [...new Set(combinaciones.map((c) => c.talla).filter(Boolean))].join(
        ", "
      ) || null;
    const comunes = {
      _nombre: ConvertirMinusculas(nombre.trim()),
      _precio_venta: parseFloat(precioVenta) || 0,
      _precio_compra: mostrarCosto ? parseFloat(precioCompra) || 0 : null,
      _id_categoria: idCategoria,
      _id_empresa: dataempresa.id,
      _sevende_por: "UNIDAD",
      _maneja_inventarios: true,
      _destacado: destacado,
      _id_marca: idMarca,
      _tallas: tallas,
    };
    setGuardando(true);
    try {
      let id = idProducto;
      if (editar) {
        await editarProductos({
          ...comunes,
          _id: idProducto,
          _codigo_barras: producto.codigo_barras,
          _codigo_interno: producto.codigo_interno,
          _precio_oferta: producto.precio_oferta,
          _oferta_desde: producto.oferta_desde,
          _oferta_hasta: producto.oferta_hasta,
          _medidas: producto.medidas,
        });
      } else {
        id = await insertarProductos({
          ...comunes,
          _codigo_barras: Generarcodigo({ id: 2 }),
          _codigo_interno: Generarcodigo({ id: 2 }),
          _maneja_multiprecios: false,
        });
      }
      await EditarOpcionesProducto(id, opciones);
      await SetAtributosProducto(id, atributosSel);
      await GuardarCombinaciones({
        id_producto: id,
        id_almacen: almacen.id,
        combinaciones,
      });
      if (files.length) {
        await subirImagenesProducto(id, files, imagenes.length + 1);
      }
      queryClient.invalidateQueries({ queryKey: ["ropa inventario"] });
      queryClient.invalidateQueries({ queryKey: ["combinaciones producto"] });
      queryClient.invalidateQueries({ queryKey: ["producto ropa"] });
      toast.success(editar ? "Producto actualizado" : "Producto guardado");
      onListo();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGuardando(false);
    }
  }

  function quitarImagen(imagen) {
    Swal.fire({
      title: "¿Eliminar esta imagen?",
      text: "Se borrará de inmediato, no espera a que guardes el formulario.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
    }).then(async (r) => {
      if (r.isConfirmed) {
        await eliminarImagenProducto(imagen);
        setImagenes((prev) => prev.filter((x) => x.id !== imagen.id));
      }
    });
  }
  async function reordenar(conOrden) {
    await reordenarImagenesProducto(conOrden);
    const mapa = new Map(conOrden.map((x) => [x.id, x.orden]));
    setImagenes((prev) =>
      prev
        .map((img) => ({ ...img, orden: mapa.get(img.id) ?? img.orden }))
        .sort((a, b) => a.orden - b.orden)
    );
  }

  if (editar && isLoading) return <Spinner1 />;

  return (
    <Container onSubmit={guardar}>
      <h2>
        {editar ? (
          <>
            Editar: <span className="nombre">{producto?.nombre}</span>
          </>
        ) : (
          "Nuevo producto de ropa o calzado"
        )}
      </h2>

      <section className="tarjeta">
        <SubidorImagenes
          label="Fotos del producto (opcional)"
          imagenesExistentes={imagenes}
          pendientes={files}
          onPendientesChange={setFiles}
          onEliminarExistente={quitarImagen}
          onReordenar={reordenar}
        />
        {imagenes.length > 0 && colores.length > 0 && (
          <div className="fotos-color">
            <span className="titulo">Color de cada foto</span>
            <span className="ayuda">
              En la tienda, al elegir un color se ven sus fotos. Las que quedan
              en “Todos los colores” se muestran cuando un color no tiene
              fotos propias. Las fotos nuevas se asignan después de guardar.
            </span>
            <div className="lista">
              {imagenes.map((img) => (
                <label key={img.id}>
                  <img src={img.url} alt="" />
                  <select
                    value={img.color ?? ""}
                    onChange={(e) => cambiarColorImagen(img, e.target.value)}
                  >
                    <option value="">Todos los colores</option>
                    {colores.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    {img.color && !colores.includes(img.color) && (
                      <option value={img.color}>{img.color}</option>
                    )}
                  </select>
                </label>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="tarjeta datos">
        <label className="campo ancho">
          <span>Nombre</span>
          <input
            type="text"
            value={nombre}
            placeholder="Ej. Playera básica cuello redondo"
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>
        <label className="campo">
          <span>Precio de venta</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
          />
        </label>
        {mostrarCosto && (
          <label className="campo">
            <span>Precio de compra</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={precioCompra}
              onChange={(e) => setPrecioCompra(e.target.value)}
            />
          </label>
        )}
        <div className="campo">
          <span>Categoría</span>
          <SelectList
            data={datacategorias}
            itemSelect={categoria ?? { nombre_completo: "Elige una categoría" }}
            onSelect={(c) => setIdCategoria(c.id)}
            displayField="nombre_completo"
          />
        </div>
        <div className="campo">
          <span>Marca</span>
          <SelectList
            data={[{ id: null, nombre: "Sin marca" }, ...(marcas ?? [])]}
            itemSelect={
              (marcas ?? []).find((m) => m.id === idMarca) ?? {
                nombre: "Sin marca",
              }
            }
            onSelect={(m) => setIdMarca(m.id ?? null)}
            displayField="nombre"
          />
        </div>
        <div className="campo ancho">
          <span>Atributos</span>
          <SelectorAtributos seleccion={atributosSel} onChange={setAtributosSel} />
        </div>
        <div className="interruptores ancho">
          {tiene("tienda") && (
            <label>
              <Switch1
                state={opciones.visible_ecommerce}
                setState={() => cambiarOpcion("visible_ecommerce")}
              />
              Mostrar en la tienda en línea
            </label>
          )}
          {tiene("tienda") && opciones.visible_ecommerce && (
            <label>
              <Switch1
                state={destacado}
                setState={() => setDestacado((d) => !d)}
              />
              Destacado en la tienda
            </label>
          )}
          {tiene("apartados") && (
            <label>
              <Switch1
                state={opciones.permite_apartado}
                setState={() => cambiarOpcion("permite_apartado")}
              />
              Se puede apartar
            </label>
          )}
        </div>
      </section>

      <section className="tarjeta">
        <div className="ubicacion">
          <div className="campo">
            <span>Sucursal</span>
            <SelectList
              data={dataSucursales}
              itemSelect={sucursal ?? { nombre: "-" }}
              onSelect={setSucursal}
              displayField="nombre"
            />
          </div>
          <div className="campo">
            <span>Almacén</span>
            <SelectList
              data={almacenes}
              itemSelect={almacen ?? { nombre: "-" }}
              onSelect={setAlmacen}
              displayField="nombre"
            />
          </div>
        </div>
        <EditorCombinaciones
          idProducto={idProducto}
          idAlmacen={almacen?.id}
          onChange={setCombinaciones}
        />
      </section>

      <div className="acciones">
        <button type="button" className="secundario" onClick={onListo}>
          Cancelar
        </button>
        <button type="submit" className="principal" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </Container>
  );
}

const Container = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 980px;
  h2 {
    font-size: 22px;
    margin: 0;
    .nombre {
      text-transform: capitalize;
    }
  }
  .tarjeta {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .fotos-color {
    display: flex;
    flex-direction: column;
    gap: 8px;
    .titulo {
      font-size: 13px;
      font-weight: 600;
    }
    .ayuda {
      font-size: 12px;
      opacity: 0.7;
    }
    .lista {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 120px;
    }
    img {
      width: 120px;
      height: 120px;
      object-fit: cover;
      border-radius: 8px;
    }
    select {
      padding: 6px;
      border-radius: 6px;
      border: 1px solid ${({ theme }) => theme.color2};
      background: ${({ theme }) => theme.body};
      color: ${({ theme }) => theme.text};
      font-size: 13px;
    }
  }
  .datos {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 18px;
  }
  .ancho {
    grid-column: 1 / -1;
  }
  .campo {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    > span {
      font-size: 13px;
      font-weight: 600;
    }
    input {
      padding: 9px 12px;
      border-radius: 8px;
      border: 1px solid ${({ theme }) => theme.color2};
      background-color: ${({ theme }) => theme.body};
      color: ${({ theme }) => theme.text};
      font-size: 15px;
    }
  }
  .interruptores {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 26px;
    label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
    }
  }
  .ubicacion {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px 18px;
  }
  .acciones {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    button {
      padding: 10px 22px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
    }
    .secundario {
      background: transparent;
      border: 1px solid ${({ theme }) => theme.color2};
      color: ${({ theme }) => theme.text};
    }
    .principal {
      background: ${({ theme }) => theme.acento};
      border: none;
      color: ${({ theme }) => theme.acentoTexto};
      &:disabled {
        opacity: 0.6;
        cursor: wait;
      }
    }
  }
  @media (max-width: 767.98px) {
    .datos,
    .ubicacion {
      grid-template-columns: 1fr;
    }
  }
`;
