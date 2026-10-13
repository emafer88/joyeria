import styled from "styled-components";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Btn1, InputText2, Title, supabase } from "../index";
import { metodoSesion } from "../components/organismos/formularios/CambiarContrasena";

const LARGO_MINIMO = 8;

// Destino del enlace de "¿Olvidaste tu contraseña?". Supabase abre la sesión
// a partir del enlace (queda marcada con amr "otp"); solo con esa sesión se
// deja poner una contraseña nueva sin pedir la actual. Una sesión normal no
// sirve acá: para eso está "Contraseña" en el menú, que pide la actual.
export function NuevaContrasena() {
  // undefined = leyendo el enlace; true/false = sesión de recuperación o no.
  const [valida, setValida] = useState(undefined);
  const [listo, setListo] = useState(false);
  const enlaceConError = new URLSearchParams(window.location.hash.slice(1)).has("error");

  useEffect(() => {
    const revisar = (session) =>
      setValida(["otp", "recovery"].includes(metodoSesion(session)));
    supabase.auth.getSession().then(({ data }) => revisar(data.session));
    const { data } = supabase.auth.onAuthStateChange((_evento, session) => revisar(session));
    return () => data.subscription.unsubscribe();
  }, []);

  const {
    register,
    formState: { errors },
    handleSubmit,
    getValues,
  } = useForm();
  const { isPending, error, mutate } = useMutation({
    mutationKey: ["nueva contraseña"],
    mutationFn: async ({ nueva }) => {
      const { error } = await supabase.auth.updateUser({ password: nueva });
      if (error) {
        if (/different from the old/i.test(error.message)) {
          throw new Error("Debe ser distinta de la anterior");
        }
        throw new Error(error.message);
      }
      // Que entre de nuevo con la contraseña nueva.
      await supabase.auth.signOut();
    },
    onSuccess: () => setListo(true),
  });

  let contenido;
  if (listo) {
    contenido = (
      <>
        <p>Tu contraseña se cambió. Ya puedes entrar con la nueva.</p>
        <Link className="enlace" to="/login">Ir a ingresar</Link>
      </>
    );
  } else if (valida === undefined && !enlaceConError) {
    contenido = <p>Verificando el enlace...</p>;
  } else if (!valida) {
    contenido = (
      <>
        <p>
          El enlace no es válido o ya venció. Pide otro desde
          "¿Olvidaste tu contraseña?".
        </p>
        <Link className="enlace" to="/login">Ir a ingresar</Link>
      </>
    );
  } else {
    contenido = (
      <form onSubmit={handleSubmit((data) => mutate(data))}>
        <InputText2>
          <input
            className="form__field"
            placeholder="contraseña nueva"
            type="password"
            autoComplete="new-password"
            {...register("nueva", {
              required: "Campo requerido",
              minLength: { value: LARGO_MINIMO, message: `Mínimo ${LARGO_MINIMO} caracteres` },
            })}
          />
        </InputText2>
        {errors.nueva && <p className="error">{errors.nueva.message}</p>}
        <InputText2>
          <input
            className="form__field"
            placeholder="repetir contraseña nueva"
            type="password"
            autoComplete="new-password"
            {...register("repetir", {
              validate: (valor) => valor === getValues("nueva") || "Las contraseñas no coinciden",
            })}
          />
        </InputText2>
        {errors.repetir && <p className="error">{errors.repetir.message}</p>}
        {error && <p className="error">{error.message}</p>}
        <Btn1
          border="2px"
          titulo={isPending ? "GUARDANDO..." : "GUARDAR"}
          bgcolor="#1CB0F6"
          color="255,255,255"
          width="100%"
          disabled={isPending}
        />
      </form>
    );
  }

  return (
    <Container>
      <div className="card">
        <Title $paddingbottom="20px">Nueva contraseña</Title>
        {contenido}
      </div>
    </Container>
  );
}

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0 16px;
  color: ${({ theme }) => theme.text};
  .card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
    max-width: 400px;
    form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  }
  .error {
    color: #f46943;
  }
  .enlace {
    color: #1cb0f6;
    margin-top: 10px;
  }
`;
