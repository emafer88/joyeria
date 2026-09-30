import { useState } from "react";
import styled from "styled-components";
import { BtnClose } from "../../ui/buttons/BtnClose";
import {
  useDisenosSinConfigurarMLQuery,
  useGuardarDisenoMLMutation,
} from "../../../tanstack/MercadoLibreStack";
import { BtnPastilla, CATEGORIAS_ML } from "./comunes";
import { VistaPreviaML } from "./VistaPreviaML";

// Campos = obligatorios de la categoría (con sus defaults) + cualquier otro
// atributo que el diseño ya tuviera guardado, para no perderlo al editar.
function armarCampos(categoria, guardados, nombreDiseno) {
  const preset = CATEGORIAS_ML[categoria]?.atributos ?? [];
  const valores = Object.fromEntries((guardados ?? []).map((a) => [a.id, a.value_name]));
  const campos = preset.map((a) => ({
    ...a,
    valor: valores[a.id] ?? a.defecto ?? (a.id === "MODEL" ? nombreDiseno ?? "" : ""),
  }));
  for (const a of guardados ?? []) {
    if (!preset.some((p) => p.id === a.id)) campos.push({ id: a.id, label: a.id, valor: a.value_name });
  }
  return campos;
}

// diseno = fila de ml_admin_listar_disenos para editar, o null para uno nuevo.
export function FormDisenoML({ diseno, onClose }) {
  const esNuevo = !diseno;
  const [idProducto, setIdProducto] = useState(diseno?.id_producto ?? "");
  const [categoria, setCategoria] = useState(diseno?.ml_category_id ?? "MLM457416");
  const [campos, setCampos] = useState(() =>
    armarCampos(diseno?.ml_category_id ?? "MLM457416", diseno?.atributos, diseno?.nombre)
  );
  const [publicar, setPublicar] = useState(diseno?.publicar ?? true);
  // Confirmación obligatoria para publicar: ML modera lo que no coincide.
  const [revisado, setRevisado] = useState(false);

  const { data: sinConfigurar, isLoading } = useDisenosSinConfigurarMLQuery(esNuevo);
  const { mutate, isPending } = useGuardarDisenoMLMutation({ onSuccess: onClose });

  const nombreDe = (id) => sinConfigurar?.find((d) => String(d.id_producto) === String(id))?.nombre;

  function cambiarDiseno(id) {
    setIdProducto(id);
    // El modelo por defecto es el nombre del diseño; solo se pisa si el
    // usuario todavía no lo escribió a mano.
    setCampos((cs) =>
      cs.map((c) => (c.id === "MODEL" && (!c.valor || c.valor === nombreDe(idProducto)) ? { ...c, valor: nombreDe(id) ?? "" } : c))
    );
  }

  function cambiarCategoria(nueva) {
    setCategoria(nueva);
    const actuales = campos.map((c) => ({ id: c.id, value_name: c.valor }));
    // Al cambiar de categoría solo se arrastran los atributos comunes.
    const comunes = actuales.filter((a) => CATEGORIAS_ML[nueva]?.atributos.some((p) => p.id === a.id));
    setCampos(armarCampos(nueva, comunes, diseno?.nombre ?? nombreDe(idProducto)));
  }

  function guardar(e) {
    e.preventDefault();
    mutate({
      id_producto: Number(idProducto),
      publicar,
      ml_category_id: categoria,
      atributos: campos.map((c) => ({ id: c.id, value_name: c.valor.trim() })),
    });
  }

  const incompleto = !idProducto || campos.some((c) => !c.valor.trim());

  return (
    <Overlay onClick={onClose}>
      <Card onClick={(e) => e.stopPropagation()}>
        <BtnClose funcion={onClose} />
        <h2>{esNuevo ? "Publicar un diseño en Mercado Libre" : diseno.nombre}</h2>

        <form onSubmit={guardar}>
          {esNuevo && (
            <label>
              Diseño
              <select value={idProducto} onChange={(e) => cambiarDiseno(e.target.value)} required>
                <option value="">{isLoading ? "Cargando..." : "Elige un diseño de joyería"}</option>
                {sinConfigurar?.map((d) => (
                  <option key={d.id_producto} value={d.id_producto}>
                    {d.nombre} ({d.piezas_disponibles} disponibles)
                  </option>
                ))}
              </select>
            </label>
          )}

          <label>
            Categoría en Mercado Libre
            <select value={categoria} onChange={(e) => cambiarCategoria(e.target.value)}>
              {Object.entries(CATEGORIAS_ML).map(([id, c]) => (
                <option key={id} value={id}>
                  {c.label}
                </option>
              ))}
              {!CATEGORIAS_ML[categoria] && <option value={categoria}>{categoria}</option>}
            </select>
          </label>

          {campos.map((c, i) => (
            <label key={c.id}>
              {c.label}
              {c.opciones ? (
                <select
                  value={c.valor}
                  onChange={(e) => setCampos((cs) => cs.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)))}
                >
                  {c.opciones.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={c.valor}
                  onChange={(e) => setCampos((cs) => cs.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)))}
                />
              )}
              {c.id === "BRAND" && (
                <span className="ayuda">
                  No usar marcas de terceros (p. ej. Cartier): ML puede dar de baja la publicación.
                </span>
              )}
              {c.id === "MODEL" && (
                <span className="ayuda">
                  Base del modelo de cada publicación; se le agrega el peso y la talla de cada grupo.
                </span>
              )}
            </label>
          ))}

          <label className="check">
            <input type="checkbox" checked={publicar} onChange={(e) => setPublicar(e.target.checked)} />
            Publicar en Mercado Libre
          </label>

          <p className="ayuda">
            Se publica una publicación por cada grupo de piezas iguales (mismo peso, talla y precio), con
            el stock de piezas disponibles. Las fotos salen de la variante y del diseño.
          </p>

          <VistaPreviaML idProducto={idProducto ? Number(idProducto) : null} />

          {publicar && (
            <label className="check">
              <input type="checkbox" checked={revisado} onChange={(e) => setRevisado(e.target.checked)} />
              Revisé las fotos y los precios de la vista previa
            </label>
          )}

          <BtnPastilla type="submit" disabled={incompleto || isPending || (publicar && !revisado)}>
            {isPending ? "Guardando..." : "Guardar"}
          </BtnPastilla>
        </form>
      </Card>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 15, 20, 0.6);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
`;

const Card = styled.div`
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  background: ${({ theme }) => theme.bgtotal};
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 16px;
  padding: 26px 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);

  h2 {
    margin: 0 0 18px;
    font-size: 19px;
    text-transform: capitalize;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #f88533;
  }
  label.check {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.text};
    text-transform: none;
    font-size: 14px;
  }
  input:not([type="checkbox"]),
  select {
    padding: 9px 12px;
    border-radius: 10px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    font-size: 14px;
    text-transform: none;
    letter-spacing: 0;
    font-weight: 400;
  }
  .ayuda {
    font-size: 12px;
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
    color: ${({ theme }) => theme.text};
    opacity: 0.6;
    margin: 0;
  }
`;
