import styled from "styled-components";
import { useForm } from "react-hook-form";
import { InputText, Btn1 } from "../../../index";
import { v } from "../../../styles/variables";
import { useJoyeriaStore } from "../../../store/JoyeriaStore";
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
  const { data: categorias = [] } = useCategoriasJoyeriaQuery();
  const { data: marcas = [] } = useMarcasJoyeriaQuery();
  const { mutate, isPending } = useGuardarDisenoMutation();

  const {
    register,
    handleSubmit,
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
      { accion, values: { ...values, id: disenoSelect?.id } },
      { onSuccess: onClose }
    );
  };

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

          {marcas.length > 0 && (
            <>
              <label className="sel-label">Marca (opcional)</label>
              <select className="select" {...register("id_marca")}>
                <option value="">— sin marca —</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </>
          )}

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
    }
  }
`;
