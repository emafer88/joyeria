import { useState } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { InputText, Btn1, Switch1, SubidorImagenes } from "../../../index";
import { v } from "../../../styles/variables";
import { useBannersStore } from "../../../store/BannersStore";
import { useGuardarBannerMutation } from "../../../tanstack/BannersStack";

/** Modal de alta/edición de un banner del hero del home del ecommerce. */
export function FormBanner({ onClose }) {
  const { accion, bannerSelect } = useBannersStore();
  const esEditar = accion === "Editar";
  const { mutate, isPending } = useGuardarBannerMutation();
  const [activo, setActivo] = useState(esEditar ? bannerSelect?.activo : true);
  const [file, setFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      titulo: esEditar ? bannerSelect?.titulo : "",
      subtitulo: esEditar ? bannerSelect?.subtitulo ?? "" : "",
      link_destino: esEditar ? bannerSelect?.link_destino ?? "" : "",
      orden: esEditar ? bannerSelect?.orden ?? 0 : 0,
    },
  });

  const onSubmit = (values) => {
    if (!esEditar && !file) {
      return;
    }
    mutate(
      {
        accion,
        values: { ...values, activo, id: bannerSelect?.id, imagen_path: bannerSelect?.imagen_path },
        file,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Container>
      <div className="sub-contenedor">
        <div className="headers">
          <h1>{esEditar ? "Editar banner" : "Nuevo banner"}</h1>
          <span onClick={onClose}>x</span>
        </div>

        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          <SubidorImagenes
            label="Imagen del banner (obligatoria)"
            maxImagenes={1}
            imagenesExistentes={
              bannerSelect?.imagen_url
                ? [{ id: bannerSelect.id, url: bannerSelect.imagen_url, orden: 1 }]
                : []
            }
            pendientes={file ? [file] : []}
            onPendientesChange={(files) => setFile(files[files.length - 1] ?? null)}
            onEliminarExistente={() => setFile(null)}
          />
          {!esEditar && !file && <p className="err">Elegí una imagen</p>}

          <InputText icono={<v.icononombre />}>
            <input
              className="form__field"
              type="text"
              placeholder="titulo"
              autoFocus
              {...register("titulo", { required: true })}
            />
            <label className="form__label">Título</label>
            {errors.titulo && <p className="err">Campo requerido</p>}
          </InputText>

          <InputText icono={<v.iconoflechaderecha />}>
            <input
              className="form__field"
              type="text"
              placeholder="subtitulo"
              {...register("subtitulo")}
            />
            <label className="form__label">Subtítulo (opcional)</label>
          </InputText>

          <InputText icono={<v.iconoflechaderecha />}>
            <input
              className="form__field"
              type="text"
              placeholder="link"
              {...register("link_destino")}
            />
            <label className="form__label">
              Link al hacer clic (opcional, ej. /catalogo)
            </label>
          </InputText>

          <InputText icono={<v.iconoflechaderecha />}>
            <input
              className="form__field"
              type="number"
              placeholder="orden"
              {...register("orden")}
            />
            <label className="form__label">Orden (menor = primero)</label>
          </InputText>

          <div className="fila-switch">
            <label>Activo (visible en el home)</label>
            <Switch1 state={activo} setState={() => setActivo((a) => !a)} />
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
    max-height: calc(100vh - 40px);
    overflow-y: auto;
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
    }
  }
`;
