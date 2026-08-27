import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { Btn1, Footer, Title } from "../../index";
import { v } from "../../styles/variables";
import { Device } from "../../styles/breakpoints";

export function InicioPublicoTemplate() {
  const navigate = useNavigate();
  return (
    <Container>
      <div className="card">
        <ContentLogo>
          <img src={v.logo} />
          <span>CUBIKS JEWELRY</span>
        </ContentLogo>
        <Title $paddingbottom="10px">Sistema de punto de venta</Title>
        <p className="bajada">
          Gestioná tus ventas, stock y sucursales desde un solo lugar.
        </p>
        <Btn1
          border="2px"
          funcion={() => navigate("/login")}
          titulo="Iniciar sesión"
          bgcolor="#1CB0F6"
          color="255,255,255"
          width="100%"
        />
      </div>
      <Footer />
    </Container>
  );
}
const Container = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex-direction: column;
  padding: 0 10px;
  color: ${({ theme }) => theme.text};
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    width: 100%;
    margin: 20px;
    gap: 10px;
    @media ${Device.tablet} {
      width: 400px;
    }
  }
  .bajada {
    margin-bottom: 20px;
    opacity: 0.8;
  }
`;
const ContentLogo = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px;
  span {
    font-weight: 700;
  }
  img {
    width: 10%;
  }
`;
