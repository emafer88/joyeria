import { useState } from "react";
import styled from "styled-components";
import Swal from "sweetalert2";
import { BtnClose } from "../../ui/buttons/BtnClose";
import {
  useAtributosQuery,
  useEliminarAtributoMutation,
  useEliminarValorMutation,
  useInsertarAtributoMutation,
  useInsertarValorMutation,
  useRenombrarAtributoMutation,
} from "../../../tanstack/AtributosStack";

// Atributo listo para crear con un clic si el negocio todavía no lo tiene.
const GENERO = { nombre: "Género", valores: ["Hombre", "Mujer", "Unisex", "Niños"] };

/**
 * Modal para administrar los atributos de producto (Género, Piedra,
 * Temporada...) y sus valores. Se abre desde ProductosTemplate. Cada atributo
 * con valores usados aparece como filtro en la tienda.
 */
export function AdminAtributos({ onClose }) {
  const { data: atributos = [], isLoading } = useAtributosQuery();
  const insertarAtributo = useInsertarAtributoMutation();
  const renombrar = useRenombrarAtributoMutation();
  const eliminarAtributo = useEliminarAtributoMutation();
  const insertarValor = useInsertarValorMutation();
  const eliminarValor = useEliminarValorMutation();
  const [nuevo, setNuevo] = useState("");
  const [editId, setEditId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [nuevosValores, setNuevosValores] = useState({}); // id_atributo → texto

  const sinGenero = !isLoading && !atributos.some((a) => a.nombre === GENERO.nombre);

  function crear() {
    const nombre = nuevo.trim();
    if (!nombre) return;
    insertarAtributo.mutate({ nombre }, { onSuccess: () => setNuevo("") });
  }

  function guardarNombre(id) {
    const nombre = editNombre.trim();
    if (!nombre) return;
    renombrar.mutate({ id, nombre }, { onSuccess: () => setEditId(null) });
  }

  function agregarValor(a) {
    const nombre = (nuevosValores[a.id] ?? "").trim();
    if (!nombre) return;
    const orden = Math.max(0, ...a.valores.map((v) => v.orden)) + 1;
    insertarValor.mutate(
      { id_atributo: a.id, nombre, orden },
      { onSuccess: () => setNuevosValores((s) => ({ ...s, [a.id]: "" })) }
    );
  }

  function confirmar(titulo, texto, accion) {
    Swal.fire({
      title: titulo,
      text: texto,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then((r) => r.isConfirmed && accion());
  }

  const enter = (fn) => (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fn();
    }
  };

  return (
    <Overlay>
      <Panel>
        <header>
          <h2>Atributos</h2>
          <BtnClose funcion={onClose} />
        </header>
        <p className="ayuda">
          Características para filtrar en la tienda, como Género o Piedra. Cada
          producto puede tener uno o varios valores de cada atributo.
        </p>

        {sinGenero && (
          <button
            type="button"
            className="sugerencia"
            onClick={() => insertarAtributo.mutate(GENERO)}
          >
            + Agregar Género ({GENERO.valores.join(", ")})
          </button>
        )}

        <div className="alta">
          <input
            type="text"
            placeholder="Nuevo atributo (ej. Piedra)"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={enter(crear)}
          />
          <button type="button" onClick={crear}>
            Agregar
          </button>
        </div>

        {atributos.length === 0 && !isLoading && (
          <p className="vacio">Todavía no hay atributos.</p>
        )}

        {atributos.map((a) => (
          <section key={a.id} className="atributo">
            <div className="cabecera">
              {editId === a.id ? (
                <>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    onKeyDown={enter(() => guardarNombre(a.id))}
                  />
                  <button type="button" onClick={() => guardarNombre(a.id)}>
                    Guardar
                  </button>
                  <button type="button" className="sec" onClick={() => setEditId(null)}>
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <strong>{a.nombre}</strong>
                  <button
                    type="button"
                    className="sec"
                    onClick={() => {
                      setEditId(a.id);
                      setEditNombre(a.nombre);
                    }}
                  >
                    Renombrar
                  </button>
                  <button
                    type="button"
                    className="del"
                    onClick={() =>
                      confirmar(
                        `¿Eliminar "${a.nombre}"?`,
                        "Se quita de todos los productos y deja de ser filtro en la tienda.",
                        () => eliminarAtributo.mutate({ id: a.id })
                      )
                    }
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>

            <div className="valores">
              {a.valores.map((v) => (
                <span key={v.id} className="valor">
                  {v.nombre}
                  <button
                    type="button"
                    aria-label={`Quitar ${v.nombre}`}
                    onClick={() =>
                      confirmar(
                        `¿Quitar "${v.nombre}"?`,
                        "Los productos que lo tengan lo pierden.",
                        () => eliminarValor.mutate({ id: v.id })
                      )
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
              {a.valores.length === 0 && <span className="vacio">Sin valores</span>}
            </div>
            <div className="alta">
              <input
                type="text"
                placeholder={`Nuevo valor de ${a.nombre}`}
                value={nuevosValores[a.id] ?? ""}
                onChange={(e) =>
                  setNuevosValores((s) => ({ ...s, [a.id]: e.target.value }))
                }
                onKeyDown={enter(() => agregarValor(a))}
              />
              <button type="button" onClick={() => agregarValor(a)}>
                Agregar
              </button>
            </div>
          </section>
        ))}
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
  width: min(520px, calc(100vw - 32px));
  max-height: calc(100vh - 60px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    h2 {
      font-size: 20px;
      margin: 0;
    }
  }
  .ayuda,
  .vacio {
    font-size: 13px;
    opacity: 0.7;
    margin: 0;
  }
  .alta,
  .cabecera {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .cabecera strong {
    flex: 1;
    font-size: 16px;
  }
  input {
    flex: 1;
    min-width: 0;
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
    background: ${({ theme }) => theme.acento};
    color: ${({ theme }) => theme.acentoTexto};
    font-weight: 600;
    &.sec {
      background: transparent;
      color: ${({ theme }) => theme.text};
      border: 1px solid ${({ theme }) => theme.color2};
    }
    &.del {
      background: #f9184c;
      color: #fff;
    }
  }
  .sugerencia {
    align-self: flex-start;
    background: transparent;
    color: ${({ theme }) => theme.text};
    border: 1px dashed ${({ theme }) => theme.acentoLinea};
  }
  .atributo {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .valores {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .valor {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 4px 3px 10px;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.color2};
    font-size: 13px;
    button {
      background: transparent;
      color: ${({ theme }) => theme.text};
      padding: 0 6px;
      font-size: 15px;
      line-height: 1;
    }
  }
`;
