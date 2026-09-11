import { useEffect, useState } from "react";
import styled from "styled-components";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { useProductosStore } from "../../store/ProductosStore";
import { useEmpresaStore } from "../../store/EmpresaStore";
import { BtnClose } from "../ui/buttons/BtnClose";

/**
 * Modal para administrar marcas / colecciones (tabla `marca`). Se abre desde
 * ProductosTemplate. El alta rápida también está inline en el formulario de
 * producto; acá se pueden además renombrar y borrar.
 */
export function AdminMarcas({ onClose }) {
  const { dataempresa } = useEmpresaStore();
  const { marcas, mostrarMarcas, insertarMarca, editarMarca, eliminarMarca } =
    useProductosStore();
  const [nueva, setNueva] = useState("");
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState("");

  useEffect(() => {
    if (dataempresa?.id) mostrarMarcas({ id_empresa: dataempresa.id });
  }, [dataempresa?.id]);

  async function crear() {
    const nombre = nueva.trim();
    if (!nombre) return;
    try {
      await insertarMarca({ nombre, id_empresa: dataempresa.id });
      setNueva("");
      toast.success("Marca creada");
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function guardarEdicion(id) {
    const nombre = editNombre.trim();
    if (!nombre) return;
    try {
      await editarMarca({ id, nombre, id_empresa: dataempresa.id });
      setEditId(null);
      toast.success("Marca actualizada");
    } catch (e) {
      toast.error(e.message);
    }
  }

  function borrar(m) {
    Swal.fire({
      title: `¿Eliminar "${m.nombre}"?`,
      text: "Los productos que la usen quedan sin marca.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si, eliminar",
    }).then(async (r) => {
      if (!r.isConfirmed) return;
      try {
        await eliminarMarca({ id: m.id, id_empresa: dataempresa.id });
        toast.success("Marca eliminada");
      } catch (e) {
        toast.error(e.message);
      }
    });
  }

  return (
    <Overlay>
      <Panel>
        <header>
          <h2>Marcas / colecciones</h2>
          <BtnClose funcion={onClose} />
        </header>

        <div className="alta">
          <input
            type="text"
            placeholder="Nueva marca o colección"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                crear();
              }
            }}
          />
          <button type="button" onClick={crear}>
            Agregar
          </button>
        </div>

        <ul>
          {marcas?.length ? (
            marcas.map((m) => (
              <li key={m.id}>
                {editId === m.id ? (
                  <>
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          guardarEdicion(m.id);
                        }
                      }}
                    />
                    <button type="button" onClick={() => guardarEdicion(m.id)}>
                      Guardar
                    </button>
                    <button type="button" onClick={() => setEditId(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <span>{m.nombre}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditId(m.id);
                        setEditNombre(m.nombre);
                      }}
                    >
                      Renombrar
                    </button>
                    <button
                      type="button"
                      className="del"
                      onClick={() => borrar(m)}
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </li>
            ))
          ) : (
            <li className="vacio">Todavía no hay marcas cargadas.</li>
          )}
        </ul>
      </Panel>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(10, 9, 9, 0.5);
  backdrop-filter: blur(5px);
`;
const Panel = styled.div`
  background: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
  border-radius: 8px;
  box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
  padding: 20px 28px;
  width: min(460px, calc(100vw - 32px));
  max-height: calc(100vh - 60px);
  overflow-y: auto;

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    h2 {
      font-size: 20px;
      margin: 0;
    }
  }
  .alta {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }
  input {
    flex: 1;
    padding: 8px 10px;
    border-radius: 6px;
    border: 1px solid #333;
    background: ${({ theme }) => theme.body};
    color: ${({ theme }) => theme.text};
  }
  button {
    padding: 7px 12px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    background: #f3d20c;
    font-weight: 600;
    &.del {
      background: #f9184c;
      color: #fff;
    }
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
    span {
      flex: 1;
    }
    &.vacio {
      justify-content: center;
      opacity: 0.7;
      border-style: dashed;
    }
  }
`;
