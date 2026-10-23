import { useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { v } from "../../../styles/variables";
import { InputText, Btn1, RestablecerContrasenaUsuario } from "../../../index";
import { BtnClose } from "../../ui/buttons/BtnClose";
import { ModalContrasena } from "./CambiarContrasena";

const LARGO_MINIMO = 8;

// Un gerente le pone una contraseña nueva a un empleado que la olvidó. Las
// reglas (quién a quién, solo cuentas con contraseña) las aplica la RPC.
export function RestablecerContrasena({ usuario, cerrar }) {
  const [listo, setListo] = useState(false);
  const {
    register,
    formState: { errors },
    handleSubmit,
    getValues,
  } = useForm();

  const { isPending, error, mutate } = useMutation({
    mutationKey: ["restablecer contraseña"],
    mutationFn: ({ nueva }) =>
      RestablecerContrasenaUsuario({ id_usuario: usuario.id_usuario, pass: nueva }),
    onSuccess: () => setListo(true),
  });

  return createPortal(
    <ModalContrasena>
      <div className="sub-contenedor">
        <div className="headers">
          <h1>Restablecer contraseña</h1>
          <BtnClose funcion={cerrar} />
        </div>
        <p className="usuario">
          {usuario.usuario} · {usuario.email}
        </p>

        {listo ? (
          <section className="form-subcontainer">
            <p className="ok">
              Listo. Pásale la contraseña nueva a {usuario.usuario}: sus
              sesiones abiertas se cerraron y tendrá que entrar con ella.
            </p>
            <Btn1 titulo="Cerrar" bgcolor="acento" type="button" funcion={cerrar} />
          </section>
        ) : (
          <form onSubmit={handleSubmit((data) => mutate(data))}>
            <section className="form-subcontainer">
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
                bgcolor="acento"
                disabled={isPending}
              />
            </section>
          </form>
        )}
      </div>
    </ModalContrasena>,
    document.body,
  );
}
