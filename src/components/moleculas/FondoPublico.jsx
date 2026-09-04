import styled from "styled-components";
import { v } from "../../styles/variables";

// Fondo y marca compartidos por las pantallas públicas (InicioPublico, Login,
// AdminLogin): degradado oscuro con halos dorado/violeta, look "joyería
// premium". No se usa en el sistema interno (POS/dashboard), que sigue con
// su propio esquema claro/oscuro.
export function FondoPublico({ children, className }) {
  return (
    <Container className={className}>
      <Glow className="glow1" />
      <Glow className="glow2" />
      {children}
    </Container>
  );
}

export function MarcaPublica({ nombre = "CUBIKS JEWELRY" }) {
  return (
    <Marca>
      <span className="isotipo">
        <img src={v.logo} alt={nombre} />
      </span>
      <span className="nombre">{nombre}</span>
    </Marca>
  );
}

const Container = styled.div`
  position: relative;
  overflow-x: hidden;
  background: radial-gradient(circle at 15% 0%, #1c1730 0%, #0b0a10 45%, #08070c 100%);
  color: #f4f1e8;
  min-height: 100vh;
`;

const Glow = styled.span`
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
  &.glow1 {
    top: -120px;
    right: -80px;
    width: 380px;
    height: 380px;
    background: rgba(243, 210, 12, 0.18);
  }
  &.glow2 {
    top: 520px;
    left: -140px;
    width: 320px;
    height: 320px;
    background: rgba(144, 70, 255, 0.2);
  }
`;

const Marca = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  .isotipo {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;
    img {
      width: 70%;
    }
  }
  .nombre {
    font-weight: 700;
    letter-spacing: 0.5px;
    font-size: 14px;
  }
`;
