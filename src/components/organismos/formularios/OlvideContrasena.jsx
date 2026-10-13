import styled from "styled-components";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Btn1, InputText2, Title, supabase } from "../../../index";

// Pide el enlace de recuperación por correo. El enlace lleva a
// /restablecer-contrasena (tiene que estar en las Redirect URLs del proyecto
// de Supabase). Siempre se muestra el mismo mensaje, exista o no el correo,
// para no revelar quién tiene cuenta.
export function OlvideContrasena({ volver }) {
  const { register, handleSubmit } = useForm();
  const { isPending, isSuccess, error, mutate } = useMutation({
    mutationKey: ["olvidé mi contraseña"],
    mutationFn: async ({ email }) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/restablecer-contrasena`,
      });
      // 429 = pidió otro enlace hace muy poco: eso sí se avisa.
      if (error?.status === 429) {
        throw new Error("Ya se envió un enlace hace poco. Espera un momento y vuelve a intentar.");
      }
    },
  });

  return (
    <Container>
      <Title $paddingbottom="20px">Recuperar contraseña</Title>
      {isSuccess ? (
        <p>
          Si el correo está registrado, te llegará un enlace para crear una
          contraseña nueva. Revisa también la carpeta de spam.
        </p>
      ) : (
        <form onSubmit={handleSubmit((data) => mutate(data))}>
          <p>Escribe tu correo y te mandamos un enlace.</p>
          <InputText2>
            <input
              className="form__field"
              placeholder="email"
              type="email"
              {...register("email", { required: true })}
            />
          </InputText2>
          {error && <p className="error">{error.message}</p>}
          <Btn1
            border="2px"
            titulo={isPending ? "ENVIANDO..." : "ENVIAR ENLACE"}
            bgcolor="#1CB0F6"
            color="255,255,255"
            width="100%"
            disabled={isPending}
          />
        </form>
      )}
      <button type="button" className="enlace" onClick={volver}>
        Volver a ingresar
      </button>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  .error {
    color: #f46943;
  }
  .enlace {
    background: none;
    border: none;
    color: #1cb0f6;
    cursor: pointer;
    font-size: 15px;
    margin-top: 10px;
  }
`;
