import { useState } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { InputText, Btn1, Switch1, InsertarMarca } from "../../../index";
import { v } from "../../../styles/variables";
import { useJoyeriaStore } from "../../../store/JoyeriaStore";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import {
  useGuardarDisenoMutation,
  useCategoriasJoyeriaQuery,
  useMarcasJoyeriaQuery,
} from "../../../tanstack/JoyeriaStack";

/**
 * Modal para crear / editar un DISEÑO de joyería (fila de `productos` con
 * es_joyeria = true). No maneja stock por cantidad: el inventario real son
 * las piezas físicas que cuelgan de sus variantes.
 */
export function FormProductoJoyeria({ onClose }) {
  const { accion, disenoSelect } = useJoyeriaStore();
  const esEditar = accion === "Editar";
  const { dataempresa } = useEmpresaStore();
  const { data: categorias = [] } = useCategoriasJoyeriaQuery();
  const { data: marcas = [], refetch: refetchMarcas } = useMarcasJoyeriaQuery();
  const { mutate, isPending } = useGuardarDisenoMutation();
  const [destacado, setDestacado] = useState(
    esEditar ? !!disenoSelect?.destacado : false
  );
  const [nuevaMarca, setNuevaMarca] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      nombre: esEditar ? disenoSelect?.nombre : "",
      descripcion: esEditar ? disenoSelect?.descripcion ?? "" : "",
      id_categoria: esEditar ? disenoSelect?.id_categoria ?? "" : "",
      id_marca: esEditar ? disenoSelect?.id_marca ?? "" : "",
    },
  });

  const onSubmit = (values) => {
    mutate(
      { accion, values: { ...values, id: disenoSelect?.id, destacado } },
      { onSuccess: onClose }
    );
  };

  async function crearMarca() {
    const nombre = nuevaMarca.trim();
    if (!nombre) return;
    try {
      const id = await InsertarMarca({ nombre, id_empresa: dataempresa.id });
      await refetchMarcas();
      setValue("id_marca", String(id));
      setNuevaMarca("");
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <Container>
      <div className="sub-contenedor">
        <div className="headers">
          <h1>{esEditar ? "Editar diseño" : "Nuevo diseño"}</h1>
          <span onClick={onClose}>x</span>
        </div>

        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          <InputText icono={<v.icononombre />}>
            <input
              className="form__field"
              type="text"
              placeholder="nombre"
              autoFocus
              {...register("nombre", { required: true })}
            />
            <label className="form__label">Nombre (ej. Cadena Cartier)</label>
            {errors.nombre && <p>Campo requerido</p>}
          </InputText>

          <InputText icono={<v.iconoflechaderecha />}>
            <input
              className="form__field"
              type="text"
              placeholder="descripcion"
              {...register("descripcion")}
            />
            <label className="form__label">Descripción (opcional)</label>
          </InputText>

          <label className="sel-label">Categoría</label>
          <select
            className="select"
            {...register("id_categoria", { required: true })}
          >
            <option value="">— elegir —</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {errors.id_categoria && <p className="err">Elegí una categoría</p>}

          <label className="sel-label">Marca / colección (opcional)</label>
          <select className="select" {...register("id_marca")}>
            <option value="">— sin marca —</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
          <div className="alta-marca">
            <input
              type="text"
              placeholder="+ nueva marca"
              value={nuevaMarca}
              onChange={(e) => setNuevaMarca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  crearMarca();
                }
              }}
            />
            <button type="button" onClick={crearMarca}>
              Crear
            </button>
          </div>

          <div className="fila-switch">
            <label>Destacado (home ecommerce)</label>
            <Switch1 state={destacado} setState={() => setDestacado((d) => !d)} />
          </div>

          <Btn1
            icono={<v.iconoguardar />}
            titulo={isPending ? "Guardando..." : "Guardar"}
            bgcolor="#F9D70B"
            disabled={isPending}
          />
        </form>
      </div>
    </Container>
  );
}

const Container = styled.div`
  transition: 0.5s;
  top: 0;
  left: 0;
  position: fixed;
  background-color: rgba(10, 9, 9, 0.5);
  display: flex;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  .sub-contenedor {
    position: relative;
    width: 500px;
    max-width: 85%;
    border-radius: 20px;
    background: ${({ theme }) => theme.bgtotal};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
    padding: 13px 36px 20px 36px;
    .headers {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      h1 {
        font-size: 20px;
        font-weight: 500;
      }
      span {
        font-size: 20px;
        cursor: pointer;
      }
    }
    .formulario {
      display: flex;
      flex-direction: column;
      gap: 16px;
      p {
        color: #f46943;
        margin: 0;
      }
      .err {
        font-size: 13px;
      }
      .fila-switch {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        font-size: 14px;
      }
      .sel-label {
        font-size: 14px;
        color: #9b9b9b;
        margin-bottom: -10px;
      }
      .select {
        font-family: inherit;
        width: 100%;
        border: none;
        border-bottom: 2px solid #9b9b9b;
        outline: 0;
        font-size: 16px;
        color: ${(props) => props.theme.text};
        padding: 8px 0;
        background: transparent;
      }
      .select option {
        color: #222;
      }
      .alta-marca {
        display: flex;
        gap: 8px;
        margin-top: -6px;
        input {
          flex: 1;
          font-family: inherit;
          border: none;
          border-bottom: 2px solid #9b9b9b;
          outline: 0;
          font-size: 14px;
          color: ${(props) => props.theme.text};
          padding: 6px 0;
          background: transparent;
        }
        button {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          background-color: #f9d70b;
          font-weight: 600;
        }
      }
    }
  }
`;
