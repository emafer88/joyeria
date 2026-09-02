import { useState } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { InputText, Btn1, SubidorImagenes } from "../../../index";
import { v } from "../../../styles/variables";
import { useJoyeriaStore } from "../../../store/JoyeriaStore";
import {
  useGuardarVarianteMutation,
  useImagenesVarianteQuery,
  useSubirImagenesVarianteMutation,
  useEliminarImagenVarianteMutation,
  useReordenarImagenesVarianteMutation,
} from "../../../tanstack/JoyeriaStack";

/**
 * Modal para crear / editar una VARIANTE (material + pureza) de un diseño.
 * El prefijo de SKU se usa para nombrar las piezas (ej. "CAR10" -> CAR10-0001).
 * Si se deja vacío, la base deriva uno automáticamente.
 */
export function FormVariante({ onClose }) {
  const { accion, disenoSelect, varianteSelect } = useJoyeriaStore();
  const esEditar = accion === "Editar";
  const { mutate, isPending } = useGuardarVarianteMutation();

  // --- imágenes de la variante ---
  const idVariante = esEditar ? varianteSelect?.id : null;
  const [pendientes, setPendientes] = useState([]); // File[] sin subir
  const { data: imagenesExistentes = [] } = useImagenesVarianteQuery(idVariante);
  const subirImagenes = useSubirImagenesVarianteMutation();
  const eliminarImagen = useEliminarImagenVarianteMutation(idVariante);
  const reordenarImagenes = useReordenarImagenesVarianteMutation(idVariante);

  const quitarImagenExistente = (imagen) => {
    Swal.fire({
      title: "¿Eliminar esta imagen?",
      text: "Se borrará de inmediato, no espera a que guardes el formulario.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
    }).then((r) => {
      if (r.isConfirmed) eliminarImagen.mutate(imagen);
    });
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      material: esEditar ? varianteSelect?.material : "",
      pureza: esEditar ? varianteSelect?.pureza ?? "" : "",
      sku_prefijo: esEditar ? varianteSelect?.sku_prefijo ?? "" : "",
      precio_venta_sugerido: esEditar
        ? varianteSelect?.precio_venta_sugerido ?? ""
        : "",
      precio_compra_sugerido: esEditar
        ? varianteSelect?.precio_compra_sugerido ?? ""
        : "",
      notas: esEditar ? varianteSelect?.notas ?? "" : "",
    },
  });

  const onSubmit = (values) => {
    mutate(
      {
        accion,
        idProducto: disenoSelect?.id,
        values: { ...values, id: varianteSelect?.id },
      },
      {
        onSuccess: async (idVarianteGuardada) => {
          if (pendientes.length > 0) {
            await subirImagenes.mutateAsync({
              idVariante: idVarianteGuardada,
              files: pendientes,
              ordenInicial: imagenesExistentes.length + 1,
            });
          }
          onClose();
        },
      }
    );
  };

  return (
    <Container>
      <div className="sub-contenedor">
        <div className="headers">
          <h1>
            {esEditar ? "Editar variante" : "Nueva variante"}
            <small> · {disenoSelect?.nombre}</small>
          </h1>
          <span onClick={onClose}>x</span>
        </div>

        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          <InputText icono={<v.iconomarca />}>
            <input
              className="form__field"
              type="text"
              placeholder="material"
              autoFocus
              {...register("material", { required: true })}
            />
            <label className="form__label">Material (ej. Oro, Plata)</label>
            {errors.material && <p>Campo requerido</p>}
          </InputText>

          <InputText icono={<v.iconoflechaderecha />}>
            <input
              className="form__field"
              type="text"
              placeholder="pureza"
              {...register("pureza")}
            />
            <label className="form__label">Pureza (ej. 10K, 14K, 925)</label>
          </InputText>

          <InputText icono={<v.iconocodigobarras />}>
            <input
              className="form__field"
              type="text"
              placeholder="prefijo"
              disabled={esEditar}
              {...register("sku_prefijo")}
            />
            <label className="form__label">
              Prefijo de SKU (opcional, ej. CAR10)
            </label>
          </InputText>

          <div className="fila">
            <InputText icono={<v.iconoprecioventa />}>
              <input
                className="form__field"
                type="number"
                step="0.01"
                placeholder="precio venta"
                {...register("precio_venta_sugerido")}
              />
              <label className="form__label">Precio venta sugerido</label>
            </InputText>
            <InputText icono={<v.iconopreciocompra />}>
              <input
                className="form__field"
                type="number"
                step="0.01"
                placeholder="costo"
                {...register("precio_compra_sugerido")}
              />
              <label className="form__label">Costo sugerido</label>
            </InputText>
          </div>

          <InputText icono={<v.iconoflechaderecha />}>
            <input
              className="form__field"
              type="text"
              placeholder="notas"
              {...register("notas")}
            />
            <label className="form__label">Notas (opcional)</label>
          </InputText>

          <SubidorImagenes
            label="Imágenes de la variante (opcional)"
            imagenesExistentes={imagenesExistentes}
            pendientes={pendientes}
            onPendientesChange={setPendientes}
            onEliminarExistente={quitarImagenExistente}
            onReordenar={(imgs) => reordenarImagenes.mutate(imgs)}
          />

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
    width: 540px;
    max-width: 90%;
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
        font-size: 19px;
        font-weight: 500;
      }
      small {
        color: #9b9b9b;
        font-weight: 400;
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
      .fila {
        display: flex;
        gap: 16px;
      }
      .fila > div {
        flex: 1;
      }
    }
  }
`;
