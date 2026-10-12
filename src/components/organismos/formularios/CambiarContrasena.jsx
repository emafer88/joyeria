import styled from "styled-components";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { v } from "../../../styles/variables";
import { InputText, Btn1, supabase } from "../../../index";
import { BtnClose } from "../../ui/buttons/BtnClose";

const LARGO_MINIMO = 8;

// true si la sesión actual se abrió con correo y contraseña. Quien entra con
// Google no tiene contraseña propia que cambiar (la maneja Google). Se lee el
// claim `amr` del token: dice cómo se abrió ESTA sesión.
export function useEntroConContrasena() {
  const [conContrasena, setConContrasena] = useState(false);
  useEffect(() => {
    const revisar = (session) => setConContrasena(metodoSesion(session) === "password");
    supabase.auth.getSession().then(({ data }) => revisar(data.session));
    const { data } = supabase.auth.onAuthStateChange((_evento, session) => revisar(session));
    return () => data.subscription.unsubscribe();
  }, []);
  return conContrasena;
}

function metodoSesion(session) {
  try {
    const base64 = session.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const amr = JSON.parse(atob(base64)).amr ?? [];
    // Manda el método más reciente.
    const ultimo = amr.reduce((a, b) => (b.timestamp > (a?.timestamp ?? -1) ? b : a), null);
    return ultimo?.method ?? null;
  } catch {
    return null;
  }
}

// El usuario logueado cambia su propia contraseña. Pide la actual para que
// nadie pueda cambiarla desde una sesión abierta (p. ej. una caja del POS).
export function CambiarContrasena({ cerrar }) {
  const [listo, setListo] = useState(false);
  const {
    register,
    formState: { errors },
    handleSubmit,
    getValues,
  } = useForm();

  const { isPending, error, mutate } = useMutation({
    mutationKey: ["cambiar contraseña"],
    mutationFn: cambiar,
    onSuccess: () => setListo(true),
  });

  // Portal: el sidebar es position:fixed con z-index propio y taparía el modal.
  return createPortal(
    <Container>
      <div className="sub-contenedor">
        <div className="headers">
          <h1>Cambiar contraseña</h1>
          <BtnClose funcion={cerrar} />
        </div>

        {listo ? (
          <section className="form-subcontainer">
            <p className="ok">Tu contraseña se cambió correctamente.</p>
            <Btn1 titulo="Cerrar" bgcolor="#F9D70B" type="button" funcion={cerrar} />
          </section>
        ) : (
          <form onSubmit={handleSubmit((data) => mutate(data))}>
            <section className="form-subcontainer">
              <InputText icono={<v.iconopass />}>
                <input
                  className="form__field"
                  type="password"
                  autoComplete="current-password"
                  placeholder="actual"
                  {...register("actual", { required: true })}
                />
                <label className="form__label">contraseña actual</label>
                {errors.actual && <p>Campo requerido</p>}
              </InputText>

              <InputText icono={<v.iconopass />}>
                <input
                  className="form__field"
                  type="password"
                  autoComplete="new-password"
                  placeholder="nueva"
                  {...register("nueva", {
                    required: "Campo requerido",
                    minLength: {
                      value: LARGO_MINIMO,
                      message: `Mínimo ${LARGO_MINIMO} caracteres`,
                    },
                    validate: (valor) =>
                      valor !== getValues("actual") || "Debe ser distinta de la actual",
                  })}
                />
                <label className="form__label">contraseña nueva</label>
                {errors.nueva && <p>{errors.nueva.message}</p>}
              </InputText>

              <InputText icono={<v.iconopass />}>
                <input
                  className="form__field"
                  type="password"
                  autoComplete="new-password"
                  placeholder="repetir"
                  {...register("repetir", {
                    validate: (valor) =>
                      valor === getValues("nueva") || "Las contraseñas no coinciden",
                  })}
                />
                <label className="form__label">repetir contraseña nueva</label>
                {errors.repetir && <p>{errors.repetir.message}</p>}
              </InputText>

              {error && <p className="error">{error.message}</p>}

              <Btn1
                icono={<v.iconoguardar />}
                titulo={isPending ? "Guardando..." : "Guardar"}
                bgcolor="#F9D70B"
                disabled={isPending}
              />
            </section>
          </form>
        )}
      </div>
    </Container>,
    document.body,
  );
}

async function cambiar({ actual, nueva }) {
  const { data: sesion } = await supabase.auth.getUser();
  const email = sesion?.user?.email;
  if (!email) throw new Error("No hay una sesión activa");

  // Verifica la contraseña actual volviendo a iniciar sesión con el mismo usuario.
  const { error: errLogin } = await supabase.auth.signInWithPassword({ email, password: actual });
  if (errLogin) {
    throw new Error(
      errLogin.status === 400 ? "La contraseña actual no es correcta" : errLogin.message,
    );
  }

  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) {
    // supabase-js 2.39 no trae error.code: se reconoce por el mensaje.
    if (/different from the old/i.test(error.message)) {
      throw new Error("Debe ser distinta de la actual");
    }
    if (/password/i.test(error.message) && error.status === 422) {
      throw new Error(`La contraseña nueva no cumple los requisitos (${error.message})`);
    }
    throw new Error(error.message);
  }
}

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  .sub-contenedor {
    position: relative;
    width: 500px;
    max-width: 85%;
    border-radius: 20px;
    background: ${({ theme }) => theme.body};
    color: ${({ theme }) => theme.text};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
    padding: 13px 36px 20px 36px;
    max-height: 80vh;
    overflow-y: auto;
    .headers {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      h1 {
        font-size: 26px;
        font-weight: 700;
        text-transform: uppercase;
      }
    }
    .form-subcontainer {
      gap: 20px;
      display: flex;
      flex-direction: column;
    }
    .error {
      color: #f46943;
    }
    .ok {
      font-size: 17px;
    }
  }
`;
