import { useState } from "react";
import styled from "styled-components";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Btn1 } from "../../moleculas/Btn1";
import { InputText2 } from "./InputText2";
import {
  GuardarClaveAutorizacion,
  TengoClaveAutorizacion,
} from "../../../supabaseCrud/crudVenta";

const SOLO_NUMEROS = /^[0-9]{4,8}$/;

/**
 * Mi perfil: la clave numérica con la que este usuario autoriza en el POS la
 * cancelación de ventas. Solo se muestra a quien puede autorizar.
 */
export function ClaveAutorizacion() {
  const queryClient = useQueryClient();
  const { data: tieneClave, isLoading } = useQuery({
    queryKey: ["tengo clave autorizacion"],
    queryFn: TengoClaveAutorizacion,
  });
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: GuardarClaveAutorizacion,
    onError: (e) => toast.error(e.message),
    onSuccess: () => {
      toast.success("Clave de autorización guardada");
      setActual("");
      setNueva("");
      setConfirmar("");
      queryClient.invalidateQueries({ queryKey: ["tengo clave autorizacion"] });
    },
  });

  function guardar(e) {
    e.preventDefault();
    if (!SOLO_NUMEROS.test(nueva)) {
      return toast.error("La clave debe tener de 4 a 8 números");
    }
    if (nueva !== confirmar) {
      return toast.error("Las claves no coinciden");
    }
    mutate({ clave_nueva: nueva, clave_actual: actual });
  }

  // Solo dígitos, máximo 8.
  const numeros = (set) => (e) =>
    set(e.target.value.replace(/[^0-9]/g, "").slice(0, 8));

  if (isLoading) return null;
  return (
    <Container onSubmit={guardar}>
      <h2>Clave de autorización</h2>
      <p className="ayuda">
        Se pide en el punto de venta para cancelar una venta cobrada. Solo
        números, de 4 a 8.{" "}
        {tieneClave ? (
          <strong>Ya tienes una clave.</strong>
        ) : (
          <strong>Todavía no tienes clave.</strong>
        )}
      </p>
      {tieneClave && (
        <InputText2>
          <input
            className="form__field"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            placeholder="clave actual"
            value={actual}
            onChange={numeros(setActual)}
          />
        </InputText2>
      )}
      <InputText2>
        <input
          className="form__field"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          placeholder={tieneClave ? "clave nueva" : "clave"}
          value={nueva}
          onChange={numeros(setNueva)}
        />
      </InputText2>
      <InputText2>
        <input
          className="form__field"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          placeholder="repite la clave"
          value={confirmar}
          onChange={numeros(setConfirmar)}
        />
      </InputText2>
      <Btn1
        type="submit"
        bgcolor="#0930bb"
        color="#fff"
        disabled={isPending}
        titulo={
          isPending ? "Guardando..." : tieneClave ? "CAMBIAR CLAVE" : "GUARDAR CLAVE"
        }
      />
    </Container>
  );
}

const Container = styled.form`
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid ${({ theme }) => theme.color2};
  display: flex;
  flex-direction: column;
  gap: 10px;
  h2 {
    font-size: 18px;
    margin: 0;
  }
  .ayuda {
    font-size: 14px;
    opacity: 0.85;
    margin: 0;
    color: inherit;
    font-weight: 400;
  }
`;
