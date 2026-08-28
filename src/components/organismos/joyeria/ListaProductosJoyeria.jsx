import { useState } from "react";
import styled from "styled-components";
import Swal from "sweetalert2";
import { Spinner1 } from "../../../index";
import { v } from "../../../styles/variables";
import { useJoyeriaStore } from "../../../store/JoyeriaStore";
import {
  useProductosJoyeriaQuery,
  useEliminarDisenoMutation,
} from "../../../tanstack/JoyeriaStack";
import { DetalleProductoJoyeria } from "./DetalleProductoJoyeria";

/**
 * Lista de diseños de joyería con filas expandibles: al expandir un diseño se
 * ven sus variantes (Categoría → Diseño → Variante → [Piezas en etapa 5]).
 */
export function ListaProductosJoyeria() {
  const { buscador, abrirModal, setDisenoSelect } = useJoyeriaStore();
  const { data: disenos = [], isLoading, error } = useProductosJoyeriaQuery();
  const eliminarDiseno = useEliminarDisenoMutation();
  const [expandido, setExpandido] = useState(null);

  if (isLoading) return <Spinner1 />;
  if (error) return <p className="err">Error: {error.message}</p>;

  const q = buscador.trim().toLowerCase();
  const filtrados = q
    ? disenos.filter(
        (d) =>
          d.nombre?.toLowerCase().includes(q) ||
          d.categorias?.nombre?.toLowerCase().includes(q)
      )
    : disenos;

  const editar = (diseno) => {
    setDisenoSelect(diseno);
    abrirModal("diseno", "Editar");
  };
  const borrar = (diseno) => {
    Swal.fire({
      title: "¿Eliminar el diseño?",
      text: diseno.nombre,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
    }).then((r) => {
      if (r.isConfirmed) eliminarDiseno.mutate(diseno.id);
    });
  };

  if (filtrados.length === 0)
    return <p className="vacio">Sin diseños de joyería todavía.</p>;

  return (
    <Container>
      {filtrados.map((diseno) => {
        const abierto = expandido === diseno.id;
        return (
          <div className={`fila ${abierto ? "abierta" : ""}`} key={diseno.id}>
            <div className="cabecera">
              <button
                className="toggle"
                onClick={() => setExpandido(abierto ? null : diseno.id)}
              >
                <v.iconoflechaderecha className={abierto ? "rot" : ""} />
              </button>
              <div className="titulo" onClick={() => setExpandido(abierto ? null : diseno.id)}>
                <strong>{diseno.nombre}</strong>
                <span className="cat">{diseno.categorias?.nombre ?? "sin categoría"}</span>
                {diseno.descripcion && (
                  <span className="desc">{diseno.descripcion}</span>
                )}
              </div>
              <div className="acciones">
                <button title="Editar" onClick={() => editar(diseno)}>
                  <v.iconeditarTabla />
                </button>
                <button title="Eliminar" className="del" onClick={() => borrar(diseno)}>
                  <v.iconeliminarTabla />
                </button>
              </div>
            </div>
            {abierto && <DetalleProductoJoyeria diseno={diseno} />}
          </div>
        );
      })}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  .err {
    color: #f46943;
  }
  .vacio {
    opacity: 0.6;
    font-style: italic;
  }
  .fila {
    border: 2px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    overflow: hidden;
  }
  .fila.abierta {
    border-color: ${v.colorPrincipal};
  }
  .cabecera {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
  }
  .toggle {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 20px;
    color: ${({ theme }) => theme.text};
    display: flex;
  }
  .toggle .rot {
    transform: rotate(90deg);
  }
  .titulo {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    cursor: pointer;
    flex-wrap: wrap;
  }
  .titulo .cat {
    font-size: 13px;
    background: ${({ theme }) => theme.color2};
    border-radius: 8px;
    padding: 2px 8px;
  }
  .titulo .desc {
    font-size: 13px;
    opacity: 0.6;
  }
  .acciones {
    display: flex;
    gap: 10px;
  }
  .acciones button {
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
`;
