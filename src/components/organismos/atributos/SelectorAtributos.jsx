import styled from "styled-components";
import { useAtributosQuery } from "../../../tanstack/AtributosStack";

/**
 * Valores de atributo de un producto (Género: Mujer, Unisex...) en el
 * formulario. `seleccion` son ids de atributo_valores; se guardan junto con
 * el producto (SetAtributosProducto). Los atributos se administran desde
 * Productos → Atributos.
 */
export function SelectorAtributos({ seleccion, onChange }) {
  const { data: atributos = [] } = useAtributosQuery();
  const conValores = atributos.filter((a) => a.valores.length > 0);

  const alternar = (id) =>
    onChange(
      seleccion.includes(id)
        ? seleccion.filter((x) => x !== id)
        : [...seleccion, id]
    );

  if (conValores.length === 0) {
    return (
      <span className="ayuda">
        Sin atributos. Créalos en Productos → Atributos.
      </span>
    );
  }

  return (
    <Container>
      {conValores.map((a) => (
        <div key={a.id} className="atributo">
          <span className="nombre">{a.nombre}</span>
          <div className="valores">
            {a.valores.map((v) => (
              <button
                type="button"
                key={v.id}
                className={seleccion.includes(v.id) ? "on" : ""}
                aria-pressed={seleccion.includes(v.id)}
                onClick={() => alternar(v.id)}
              >
                {v.nombre}
              </button>
            ))}
          </div>
        </div>
      ))}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  .atributo {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .nombre {
    font-size: 13px;
    font-weight: 600;
  }
  .valores {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  button {
    padding: 5px 12px;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: transparent;
    color: ${({ theme }) => theme.text};
    font-size: 13px;
    cursor: pointer;
    &.on {
      background: ${({ theme }) => theme.acento};
      border-color: ${({ theme }) => theme.acento};
      color: ${({ theme }) => theme.acentoTexto};
      font-weight: 600;
    }
  }
`;
