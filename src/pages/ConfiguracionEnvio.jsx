import styled from "styled-components";
import { InputText2 } from "../components/organismos/formularios/InputText2";
import { Btn1 } from "../components/moleculas/Btn1";
import { useForm } from "react-hook-form";
import { useEmpresaStore } from "../store/EmpresaStore";
import { useUpdateEmpresaEnvioMutation } from "../tanstack/EmpresaStack";

export const ConfiguracionEnvio = () => {
  const { dataempresa } = useEmpresaStore();

  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({
    defaultValues: {
      costo_envio: dataempresa?.costo_envio,
    },
  });

  const { mutate, isPending } = useUpdateEmpresaEnvioMutation();

  return (
    <Container>
      {isPending ? (
        <span>guardando...🐖</span>
      ) : (
        <>
          <Title>Envío</Title>
          <p className="ayuda">
            Costo de envío único que se cobra en el ecommerce, sumado al
            total de cada pedido.
          </p>
          <form onSubmit={handleSubmit(mutate)}>
            <Label>Costo de envío</Label>
            <InputText2>
              <input
                className="form__field"
                placeholder="costo de envío"
                type="number"
                step="0.01"
                min="0"
                {...register("costo_envio", {
                  required: true,
                  min: 0,
                })}
              />
              {errors.costo_envio?.type === "required" && (
                <p>Campo requerido</p>
              )}
              {errors.costo_envio?.type === "min" && (
                <p>No puede ser negativo</p>
              )}
            </InputText2>
            <br></br>
            <Btn1 bgcolor="#0930bb" color="#fff" titulo="GUARDAR CAMBIOS" />
          </form>
        </>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  border-radius: 10px;
  max-width: 400px;
  margin: 0 auto;
  p {
    color: #f75510;
    font-weight: 700;
  }
  .ayuda {
    color: #666;
    font-weight: 400;
    font-size: 13px;
    margin-bottom: 20px;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin: 10px 0 5px;
`;
