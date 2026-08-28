import { useMemo, useState } from "react";
import styled from "styled-components";
import Swal from "sweetalert2";
import { Btn1 } from "../../../index";
import { v } from "../../../styles/variables";
import { useJoyeriaStore } from "../../../store/JoyeriaStore";
import {
  useVariantesQuery,
  useResumenPiezasQuery,
  useEliminarVarianteMutation,
  usePiezasVarianteQuery,
} from "../../../tanstack/JoyeriaStack";
import { imprimirEtiquetas } from "../../../utils/codigoBarras";

const ESTADO_LABEL = {
  disponible: "Disponible",
  vendida: "Vendida",
  reservada: "Reservada",
  danada: "Dañada",
  perdida: "Perdida",
};

/** Lista de piezas de una variante (se carga solo al expandir). */
function PiezasDeVariante({ idVariante, producto, material, pureza }) {
  const { data: piezas = [], isLoading } = usePiezasVarianteQuery(idVariante);
  const [sel, setSel] = useState(() => new Set());

  const seleccionadas = useMemo(
    () => piezas.filter((p) => sel.has(p.id)),
    [piezas, sel]
  );

  const toggle = (id) =>
    setSel((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleTodas = () =>
    setSel((prev) =>
      prev.size === piezas.length ? new Set() : new Set(piezas.map((p) => p.id))
    );

  const imprimir = (lista) =>
    imprimirEtiquetas(lista, { producto, material, pureza });

  if (isLoading) return <p className="vacio">Cargando piezas...</p>;
  if (piezas.length === 0)
    return <p className="vacio">Sin piezas cargadas en esta variante.</p>;

  return (
    <div className="piezas-wrap">
      <div className="piezas-acc">
        <Btn1
          titulo="Imprimir todas"
          bgcolor="#e7e7e7"
          color="#333"
          funcion={() => imprimir(piezas)}
        />
        <Btn1
          titulo={`Imprimir selección (${seleccionadas.length})`}
          bgcolor="#F9D70B"
          disabled={seleccionadas.length === 0}
          funcion={() => imprimir(seleccionadas)}
        />
      </div>
      <div className="piezas-scroll">
        <table className="piezas-tabla">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={sel.size === piezas.length}
                  onChange={toggleTodas}
                />
              </th>
              <th>SKU</th>
              <th>Código de barras</th>
              <th>Peso</th>
              <th>Costo</th>
              <th>Precio</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {piezas.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={sel.has(p.id)}
                    onChange={() => toggle(p.id)}
                  />
                </td>
                <td className="mono">{p.sku}</td>
                <td className="mono">{p.barcode}</td>
                <td>{p.peso} g</td>
                <td>{p.costo}</td>
                <td>{p.precio_venta}</td>
                <td>{ESTADO_LABEL[p.estado] ?? p.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Contenido expandido de un diseño: sus variantes con el conteo de piezas
 * (disponibles / total), el alta masiva de piezas y la lista de piezas.
 * @param {{ diseno: import("../../../supabase/crudJoyeria").DisenoJoyeria }} props
 */
export function DetalleProductoJoyeria({ diseno }) {
  const { abrirModal, setDisenoSelect, setVarianteSelect } = useJoyeriaStore();
  const { data: variantes = [], isLoading } = useVariantesQuery(diseno.id);
  const { data: piezas = [] } = useResumenPiezasQuery(diseno.id);
  const eliminarVariante = useEliminarVarianteMutation(diseno.id);
  const [verPiezasDe, setVerPiezasDe] = useState(null);

  const contar = (idVariante) => {
    const delaVariante = piezas.filter((p) => p.id_variante === idVariante);
    return {
      total: delaVariante.length,
      disponibles: delaVariante.filter((p) => p.estado === "disponible").length,
    };
  };

  const conVariante = (variante, modal, accion) => {
    setDisenoSelect(diseno);
    setVarianteSelect(variante);
    abrirModal(modal, accion);
  };

  const nuevaVariante = () => {
    setDisenoSelect(diseno);
    setVarianteSelect(null);
    abrirModal("variante", "Nuevo");
  };

  const borrarVariante = (variante) => {
    Swal.fire({
      title: "¿Eliminar la variante?",
      text: `${variante.material} ${variante.pureza ?? ""}`.trim(),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
    }).then((r) => {
      if (r.isConfirmed) eliminarVariante.mutate(variante.id);
    });
  };

  return (
    <Container>
      <div className="topbar">
        <span className="titulo">Variantes</span>
        <Btn1
          funcion={nuevaVariante}
          titulo="+ variante"
          bgcolor={v.colorPrincipal}
        />
      </div>

      {isLoading && <p className="vacio">Cargando variantes...</p>}
      {!isLoading && variantes.length === 0 && (
        <p className="vacio">Este diseño todavía no tiene variantes.</p>
      )}

      {variantes.map((variante) => {
        const c = contar(variante.id);
        const abierta = verPiezasDe === variante.id;
        return (
          <div className="variante" key={variante.id}>
            <div className="cab">
              <div className="info">
                <strong>
                  {variante.material} {variante.pureza}
                </strong>
                <span className="sku">{variante.sku_prefijo}</span>
                <button
                  className="conteo"
                  onClick={() =>
                    setVerPiezasDe(abierta ? null : variante.id)
                  }
                >
                  {c.disponibles} disp. / {c.total} piezas{" "}
                  {abierta ? "▲" : "▼"}
                </button>
              </div>
              <div className="acciones">
                <Btn1
                  funcion={() =>
                    conVariante(variante, "piezas_masivo", "Nuevo")
                  }
                  titulo="+ piezas"
                  bgcolor={v.colorPrincipal}
                />
                <button
                  title="Editar variante"
                  onClick={() => conVariante(variante, "variante", "Editar")}
                >
                  <v.iconeditarTabla />
                </button>
                <button
                  title="Eliminar variante"
                  className="del"
                  onClick={() => borrarVariante(variante)}
                >
                  <v.iconeliminarTabla />
                </button>
              </div>
            </div>
            {abierta && (
              <PiezasDeVariante
                idVariante={variante.id}
                producto={diseno.nombre}
                material={variante.material}
                pureza={variante.pureza}
              />
            )}
          </div>
        );
      })}
    </Container>
  );
}

const Container = styled.div`
  padding: 12px 8px 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }
  .titulo {
    font-weight: 700;
    opacity: 0.7;
  }
  .vacio {
    opacity: 0.6;
    font-style: italic;
    margin: 6px 0;
  }
  .variante {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 10px;
    padding: 10px 14px;
  }
  .cab {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }
  .info {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .info .sku {
    font-family: monospace;
    opacity: 0.7;
  }
  .info .conteo {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 13px;
    opacity: 0.85;
    color: ${({ theme }) => theme.text};
  }
  .acciones {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .acciones button:not([class]),
  .acciones .del {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    color: ${({ theme }) => theme.text};
    display: flex;
  }
  .acciones .del {
    color: #d33;
  }
  .piezas-wrap {
    margin-top: 10px;
  }
  .piezas-acc {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .piezas-scroll {
    max-height: 260px;
    overflow: auto;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 8px;
  }
  .piezas-tabla {
    width: 100%;
    border-collapse: collapse;
  }
  .piezas-tabla th,
  .piezas-tabla td {
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    padding: 7px 10px;
    font-size: 13px;
    text-align: left;
  }
  .mono {
    font-family: monospace;
  }
`;
