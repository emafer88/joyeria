import { useState } from "react";
import styled from "styled-components";
import { Btn1 } from "../../moleculas/Btn1";
import { Switch1 } from "../Switch1";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { useGuardarFuncionesMutation } from "../../../tanstack/EmpresaStack";
import {
  FUNCIONES_GIRO,
  NOMBRE_GIRO,
  useLicencia,
} from "../../../hooks/useLicencia";

// Funciones que trae el giro del negocio; aquí solo se apagan las que no se
// usan. El giro lo decide el proveedor del sistema (tabla `licencia`).
export const FuncionesConfig = () => {
  const { dataempresa } = useEmpresaStore();
  const { giro, delGiro } = useLicencia();
  const [apagadas, setApagadas] = useState(
    dataempresa?.funciones_apagadas ?? []
  );
  const { mutate, isPending } = useGuardarFuncionesMutation();

  const cambiar = (id) =>
    setApagadas((a) =>
      a.includes(id) ? a.filter((f) => f !== id) : [...a, id]
    );

  return (
    <Container>
      <Title>Funciones</Title>
      <p className="giro">
        Giro del negocio: <b>{NOMBRE_GIRO[giro] ?? "…"}</b>
      </p>
      {FUNCIONES_GIRO.filter(([id]) => delGiro.includes(id)).map(
        ([id, nombre, detalle]) => (
          <Fila key={id}>
            <div>
              <span className="nombre">{nombre}</span>
              <span className="detalle">{detalle}</span>
            </div>
            <Switch1
              state={!apagadas.includes(id)}
              setState={() => cambiar(id)}
            />
          </Fila>
        )
      )}
      {delGiro.length === 0 && (
        <p className="detalle">Tu giro no tiene funciones opcionales.</p>
      )}
      <br />
      <Btn1
        bgcolor="acento"
        titulo={isPending ? "guardando..." : "GUARDAR CAMBIOS"}
        disabled={isPending}
        funcion={() => mutate(apagadas)}
      />
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  border-radius: 10px;
  max-width: 460px;
  margin: 0 auto;
  .giro {
    margin-bottom: 20px;
  }
  .detalle {
    display: block;
    font-size: 13px;
    opacity: 0.7;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
`;

const Fila = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid ${({ theme }) => theme.color2};
  .nombre {
    font-weight: 600;
  }
`;
