import styled from "styled-components";

const ESTADOS = [
  ["disponible", "Disponible"],
  ["reservada", "Reservada"],
  ["vendida", "Vendida"],
  ["danada", "Dañada"],
  ["perdida", "Perdida"],
];

/**
 * Filtros de la pantalla de inventario de joyería.
 * @param {{
 *   opciones: { categorias:string[], materiales:string[], purezas:string[] },
 *   valores: { categoria:string, material:string, pureza:string, estado:string },
 *   onChange: (v:object) => void
 * }} props
 */
export function FiltrosInventario({ opciones, valores, onChange }) {
  const set = (k) => (e) => onChange({ ...valores, [k]: e.target.value });
  const limpiar = () =>
    onChange({ categoria: "", material: "", pureza: "", estado: "" });

  const hayFiltro = Object.values(valores).some(Boolean);

  return (
    <Wrap>
      <select value={valores.categoria} onChange={set("categoria")}>
        <option value="">Categoría: todas</option>
        {opciones.categorias.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select value={valores.material} onChange={set("material")}>
        <option value="">Material: todos</option>
        {opciones.materiales.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select value={valores.pureza} onChange={set("pureza")}>
        <option value="">Pureza: todas</option>
        {opciones.purezas.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select value={valores.estado} onChange={set("estado")}>
        <option value="">Estado: todos</option>
        {ESTADOS.map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>

      {hayFiltro && (
        <button type="button" className="limpiar" onClick={limpiar}>
          Limpiar filtros
        </button>
      )}
    </Wrap>
  );
}

const Wrap = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  select {
    font-family: inherit;
    font-size: 14px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bg2 || theme.bgtotal};
    color: ${({ theme }) => theme.text};
    outline: none;
  }
  select option {
    color: #222;
  }
  .limpiar {
    background: none;
    border: 1px dashed #9b9b9b;
    border-radius: 8px;
    padding: 7px 12px;
    cursor: pointer;
    color: ${({ theme }) => theme.text};
    font-size: 13px;
  }
`;
