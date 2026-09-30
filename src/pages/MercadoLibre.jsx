import { useState } from "react";
import styled from "styled-components";
import { Toaster } from "sonner";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Title } from "../components/atomos/Title";
import { useCuentaMLQuery, useSincronizarMLMutation } from "../tanstack/MercadoLibreStack";
import { DisenosML, OrdenesML, PublicacionesML } from "../components/organismos/MercadoLibreDesign/TablasML";
import { BtnPastilla } from "../components/organismos/MercadoLibreDesign/comunes";

const PESTANAS = {
  disenos: { label: "Diseños", Componente: DisenosML },
  publicaciones: { label: "Publicaciones", Componente: PublicacionesML },
  ordenes: { label: "Órdenes", Componente: OrdenesML },
};

// El token de ML dura 6 h y lo renueva el cron cada 15 min: si está vencido,
// el cron no está corriendo o la cuenta se desconectó.
function EstadoCuenta() {
  const { data: cuenta, isLoading } = useCuentaMLQuery();
  if (isLoading) return null;
  if (!cuenta) return <span className="cuenta mal">No hay cuenta de Mercado Libre conectada</span>;
  const vigente = new Date(cuenta.expira_en) > new Date();
  return (
    <span className={`cuenta ${vigente ? "" : "mal"}`}>
      <Icon icon={vigente ? "solar:check-circle-bold" : "solar:danger-triangle-bold"} />
      Vendedor {cuenta.ml_user_id} ·{" "}
      {vigente ? "conectado" : "token vencido: revisar el cron ml-sincronizar"}
    </span>
  );
}

export const MercadoLibre = () => {
  const [pestana, setPestana] = useState("disenos");
  const { mutate: sincronizar, isPending } = useSincronizarMLMutation();
  const { Componente } = PESTANAS[pestana];

  return (
    <Container>
      <Toaster position="top-right" />
      <header>
        <div>
          <Title>Mercado Libre</Title>
          <EstadoCuenta />
        </div>
        <BtnPastilla type="button" disabled={isPending} onClick={() => sincronizar()}>
          <Icon icon="solar:refresh-bold" width="18" />
          Sincronizar ahora
        </BtnPastilla>
      </header>

      <nav>
        {Object.entries(PESTANAS).map(([id, { label }]) => (
          <button key={id} type="button" className={id === pestana ? "activa" : ""} onClick={() => setPestana(id)}>
            {label}
          </button>
        ))}
      </nav>

      <Componente />
    </Container>
  );
};

const Container = styled.div`
  margin: 1.5% 2%;
  display: flex;
  flex-direction: column;
  gap: 16px;

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    flex-wrap: wrap;
  }
  .cuenta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #16a34a;
    &.mal {
      color: #dc2626;
    }
  }
  nav {
    display: flex;
    gap: 6px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    button {
      padding: 10px 16px;
      border: none;
      border-bottom: 3px solid transparent;
      background: transparent;
      color: ${({ theme }) => theme.text};
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      opacity: 0.6;
      &.activa {
        opacity: 1;
        border-bottom-color: #f88533;
        color: #f88533;
      }
    }
  }
  .acciones {
    display: flex;
    justify-content: flex-end;
  }
  .botones {
    display: flex;
    gap: 6px;
  }
`;
