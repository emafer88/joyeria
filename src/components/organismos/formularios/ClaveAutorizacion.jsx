import { useState } from "react";
import styled from "styled-components";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Btn1 } from "../../moleculas/Btn1";
import { InputText2 } from "./InputText2";
import {
  GuardarClaveAutorizacion,
  MiClaveAutorizacion,
} from "../../../supabaseCrud/crudVenta";

const SOLO_NUMEROS = /^[0-9]{4,8}$/;

/**
 * Mi perfil: la clave numérica con la que este usuario autoriza en el POS la
 * cancelación de ventas. Se muestra oculta, con botón para verla y para
 * cambiarla. Solo aparece a quien puede autorizar.
 */
export function ClaveAutorizacion() {
  const queryClient = useQueryClient();
  const { data: clave, isLoading } = useQuery({
    queryKey: ["mi clave autorizacion"],
    queryFn: MiClaveAutorizacion,
  });
  const [visible, setVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const cerrarEdicion = () => {
    setEditando(false);
    setNueva("");
    setConfirmar("");
  };

  const { mutate, isPending } = useMutation({
    mutationFn: GuardarClaveAutorizacion,
    onError: (e) => toast.error(e.message),
    onSuccess: () => {
      toast.success("Clave de autorización guardada");
      cerrarEdicion();
      queryClient.invalidateQueries({ queryKey: ["mi clave autorizacion"] });
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
    mutate({ clave: nueva });
  }

  // Solo dígitos, máximo 8.
  const numeros = (set) => (e) =>
    set(e.target.value.replace(/[^0-9]/g, "").slice(0, 8));

  if (isLoading) return null;
  const mostrarFormulario = editando || !clave;
  return (
    <Container onSubmit={guardar}>
      <h2>Clave de autorización</h2>
      <p className="ayuda">
        Se pide en el punto de venta para cancelar una venta cobrada. Solo
        números, de 4 a 8.
      </p>

      {clave && (
        <div className="actual">
          <span className="valor">
            {visible ? clave : "•".repeat(clave.length)}
          </span>
          <button
            type="button"
            title={visible ? "Ocultar clave" : "Mostrar clave"}
            onClick={() => setVisible((x) => !x)}
          >
            <Icon icon={visible ? "mdi:eye-off-outline" : "mdi:eye-outline"} />
            {visible ? "Ocultar" : "Mostrar"}
          </button>
          {!editando && (
            <button type="button" onClick={() => setEditando(true)}>
              <Icon icon="mdi:pencil-outline" /> Cambiar
            </button>
          )}
        </div>
      )}

      {mostrarFormulario && (
        <>
          <InputText2>
            <input
              className="form__field"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder={clave ? "clave nueva" : "clave"}
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
          <div className="botones">
            <Btn1
              type="submit"
              bgcolor="acento"
              disabled={isPending}
              titulo={isPending ? "Guardando..." : "GUARDAR CLAVE"}
            />
            {editando && (
              <button type="button" className="cancelar" onClick={cerrarEdicion}>
                Cancelar
              </button>
            )}
          </div>
        </>
      )}
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
  .actual {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .valor {
    font-family: monospace;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 4px;
    min-width: 120px;
  }
  .actual button,
  .cancelar {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: none;
    color: ${({ theme }) => theme.text};
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 13px;
    cursor: pointer;
  }
  .botones {
    display: flex;
    align-items: center;
    gap: 10px;
  }
`;
