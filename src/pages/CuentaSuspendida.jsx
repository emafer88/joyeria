import styled from "styled-components";
import { supabase } from "../index";

// Se muestra en lugar de toda la app mientras licencia.suspendida = true.
export function CuentaSuspendida({ mensaje }) {
  async function cerrarSesion() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }
  return (
    <Container>
      <div className="tarjeta">
        <span className="icono">🔒</span>
        <h1>Cuenta suspendida</h1>
        <p>
          {mensaje ||
            "El acceso al sistema está suspendido temporalmente. Comunícate con tu proveedor del sistema para reactivarlo."}
        </p>
        <p className="nota">Tus datos están guardados y no se perdió nada.</p>
        <button onClick={cerrarSesion}>Cerrar sesión</button>
      </div>
    </Container>
  );
}

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
  .tarjeta {
    max-width: 440px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .icono {
    font-size: 48px;
  }
  h1 {
    margin: 0;
    font-size: 26px;
  }
  p {
    margin: 0;
    line-height: 1.5;
  }
  .nota {
    opacity: 0.7;
    font-size: 14px;
  }
  button {
    margin-top: 8px;
    align-self: center;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: #3c3c3c;
    color: #fff;
    cursor: pointer;
  }
`;
