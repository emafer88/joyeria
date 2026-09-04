import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { Btn1, Footer, FondoPublico, MarcaPublica } from "../../index";
import { v } from "../../styles/variables";
import { Device } from "../../styles/breakpoints";
import { AiOutlineBarcode } from "react-icons/ai";
import { FaCashRegister, FaStoreAlt } from "react-icons/fa";
import { TbReportAnalytics } from "react-icons/tb";
import { MdOutlinePhotoLibrary } from "react-icons/md";
import { RiShieldCheckLine } from "react-icons/ri";
import { HiOutlineSparkles } from "react-icons/hi";

const caracteristicas = [
  {
    icono: AiOutlineBarcode,
    titulo: "Inventario serializado",
    texto: "Cada pieza con su propio código, trazable desde el ingreso hasta la venta.",
  },
  {
    icono: FaCashRegister,
    titulo: "Punto de venta ágil",
    texto: "Cobrá, emití tickets y controlá la caja sin fricción, incluso en horas pico.",
  },
  {
    icono: FaStoreAlt,
    titulo: "Multi-sucursal",
    texto: "Gestioná stock, ventas y usuarios de todas tus tiendas desde un solo panel.",
  },
  {
    icono: TbReportAnalytics,
    titulo: "Reportes en tiempo real",
    texto: "Inventario valorado, stock bajo mínimo y ventas, siempre a un clic.",
  },
  {
    icono: MdOutlinePhotoLibrary,
    titulo: "Galería por variante",
    texto: "Mostrá cada modelo, talle y color de tus joyas en su mejor ángulo.",
  },
  {
    icono: RiShieldCheckLine,
    titulo: "Roles y permisos",
    texto: "Definí qué puede ver y hacer cada usuario, sucursal por sucursal.",
  },
];

const pasos = [
  {
    numero: "01",
    titulo: "Cargá tu catálogo",
    texto: "Productos, variantes y piezas, cada una con su código único.",
  },
  {
    numero: "02",
    titulo: "Vendé desde el POS",
    texto: "Cobrá en segundos e imprimí el comprobante correspondiente.",
  },
  {
    numero: "03",
    titulo: "Analizá resultados",
    texto: "Reportes de ventas y stock actualizados al instante, por sucursal.",
  },
];

export function InicioPublicoTemplate() {
  const navigate = useNavigate();
  return (
    <FondoPublico>
      <Nav>
        <MarcaPublica />
        <a className="navlink" href="#caracteristicas">
          Características
        </a>
        <a className="navlink" href="#como-funciona">
          Cómo funciona
        </a>
        <Btn1
          border="1px"
          funcion={() => navigate("/login")}
          titulo="Iniciar sesión"
          bgcolor={v.colorPrincipal}
          color="#1a1206"
        />
      </Nav>

      <Hero>
        <div className="copy">
          <span className="badge">
            <HiOutlineSparkles /> Sistema de punto de venta para joyerías
          </span>
          <h1>
            El brillo de tu joyería,
            <br />
            <span className="dorado">ordenado en un solo lugar</span>
          </h1>
          <p className="bajada">
            Gestioná ventas, stock serializado y sucursales con la precisión
            que merece cada pieza que vendés.
          </p>
          <div className="acciones">
            <Btn1
              border="2px"
              funcion={() => navigate("/login")}
              titulo="Iniciar sesión"
              bgcolor={v.colorPrincipal}
              color="#1a1206"
              width="220px"
            />
            <a className="ghost" href="#caracteristicas">
              Ver características
            </a>
          </div>
          <ul className="chips">
            <li>Inventario pieza por pieza</li>
            <li>Multi-sucursal</li>
            <li>Reportes en tiempo real</li>
          </ul>
        </div>

        <div className="visual">
          <MockUp>
            <div className="topbar">
              <span className="dot rojo" />
              <span className="dot amarillo" />
              <span className="dot verde" />
            </div>
            <div className="cuerpo">
              <div className="fila destacada">
                <span className="miniatura" />
                <div className="lineas">
                  <span className="linea larga" />
                  <span className="linea corta" />
                </div>
                <span className="precio">$ 128.500</span>
              </div>
              <div className="fila">
                <span className="miniatura" />
                <div className="lineas">
                  <span className="linea larga" />
                  <span className="linea corta" />
                </div>
                <span className="precio">$ 64.200</span>
              </div>
              <div className="fila">
                <span className="miniatura" />
                <div className="lineas">
                  <span className="linea larga" />
                  <span className="linea corta" />
                </div>
                <span className="precio">$ 39.900</span>
              </div>
              <div className="total">
                <span>Total</span>
                <span className="montototal">$ 232.600</span>
              </div>
            </div>
          </MockUp>
          <FloatingCard className="flotante1">
            <RiShieldCheckLine />
            <span>Datos seguros en la nube</span>
          </FloatingCard>
          <FloatingCard className="flotante2">
            <AiOutlineBarcode />
            <span>Código único por pieza</span>
          </FloatingCard>
        </div>
      </Hero>

      <Section id="caracteristicas">
        <SectionHead>
          <span className="etiqueta">Características</span>
          <h2>Todo lo que tu joyería necesita</h2>
          <p>Una plataforma pensada para el detalle, como cada pieza que vendés.</p>
        </SectionHead>
        <Grid>
          {caracteristicas.map((item) => (
            <Card key={item.titulo}>
              <span className="icono">
                <item.icono />
              </span>
              <h3>{item.titulo}</h3>
              <p>{item.texto}</p>
            </Card>
          ))}
        </Grid>
      </Section>

      <Section id="como-funciona" className="pasos">
        <SectionHead>
          <span className="etiqueta">Cómo funciona</span>
          <h2>De la vitrina al reporte, en tres pasos</h2>
        </SectionHead>
        <Pasos>
          {pasos.map((paso, i) => (
            <li key={paso.numero}>
              <span className="numero">{paso.numero}</span>
              <h3>{paso.titulo}</h3>
              <p>{paso.texto}</p>
              {i < pasos.length - 1 && <span className="conector" />}
            </li>
          ))}
        </Pasos>
      </Section>

      <Cta>
        <h2>Tu joyería merece un sistema a la altura.</h2>
        <p>Iniciá sesión y llevá el control de tu negocio al siguiente nivel.</p>
        <Btn1
          border="2px"
          funcion={() => navigate("/login")}
          titulo="Iniciar sesión"
          bgcolor={v.colorPrincipal}
          color="#1a1206"
        />
      </Cta>

      <FooterWrap>
        <Footer />
      </FooterWrap>
    </FondoPublico>
  );
}

const Nav = styled.nav`
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 22px 24px;
  max-width: 1180px;
  margin: 0 auto;
  scroll-behavior: smooth;
  > *:first-child {
    margin-right: auto;
  }
  .navlink {
    color: rgba(244, 241, 232, 0.75);
    text-decoration: none;
    font-size: 14px;
    display: none;
    @media ${Device.tablet} {
      display: inline-block;
    }
    &:hover {
      color: ${v.colorPrincipal};
    }
  }
`;

const Hero = styled.section`
  position: relative;
  z-index: 1;
  max-width: 1180px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  display: grid;
  gap: 50px;
  align-items: center;
  @media ${Device.laptop} {
    grid-template-columns: 1.05fr 0.95fr;
    padding: 60px 24px 110px;
  }
  .copy {
    text-align: center;
    @media ${Device.laptop} {
      text-align: left;
    }
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 30px;
    background: rgba(243, 210, 12, 0.12);
    border: 1px solid rgba(243, 210, 12, 0.35);
    color: ${v.colorPrincipal};
    font-size: 12.5px;
    font-weight: 600;
    margin-bottom: 22px;
  }
  h1 {
    font-size: 34px;
    line-height: 1.2;
    font-weight: 700;
    margin: 0 0 18px;
    @media ${Device.tablet} {
      font-size: 46px;
    }
  }
  .dorado {
    background: linear-gradient(100deg, ${v.colorPrincipal}, #fff2b8);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .bajada {
    color: rgba(244, 241, 232, 0.75);
    font-size: 16px;
    max-width: 480px;
    margin: 0 auto 32px;
    @media ${Device.laptop} {
      margin: 0 0 32px;
    }
  }
  .acciones {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: center;
    margin-bottom: 30px;
    @media ${Device.laptop} {
      justify-content: flex-start;
    }
  }
  .ghost {
    color: #f4f1e8;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    padding: 12px 6px;
    border-bottom: 2px solid rgba(244, 241, 232, 0.3);
    transition: 0.2s;
    &:hover {
      border-color: ${v.colorPrincipal};
      color: ${v.colorPrincipal};
    }
  }
  .chips {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
    margin: 0;
    padding: 0;
    justify-content: center;
    @media ${Device.laptop} {
      justify-content: flex-start;
    }
    li {
      font-size: 12.5px;
      color: rgba(244, 241, 232, 0.6);
      display: flex;
      align-items: center;
      gap: 8px;
      &::before {
        content: "";
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: ${v.colorPrincipal};
      }
    }
  }
  .visual {
    position: relative;
    display: flex;
    justify-content: center;
  }
`;

const MockUp = styled.div`
  width: 100%;
  max-width: 380px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 60px -25px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  overflow: hidden;
  .topbar {
    display: flex;
    gap: 6px;
    padding: 12px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
  }
  .rojo {
    background: #ff5f57;
  }
  .amarillo {
    background: #febc2e;
  }
  .verde {
    background: #28c840;
  }
  .cuerpo {
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .fila {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.03);
    &.destacada {
      background: rgba(243, 210, 12, 0.1);
      border: 1px solid rgba(243, 210, 12, 0.25);
    }
  }
  .miniatura {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    flex-shrink: 0;
    background: linear-gradient(135deg, ${v.colorPrincipal}, ${v.colorExito});
  }
  .lineas {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }
  .linea {
    height: 7px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.14);
  }
  .larga {
    width: 80%;
  }
  .corta {
    width: 45%;
  }
  .precio {
    font-size: 12px;
    font-weight: 700;
    color: ${v.colorPrincipal};
    white-space: nowrap;
  }
  .total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
    padding-top: 14px;
    border-top: 1px dashed rgba(255, 255, 255, 0.15);
    font-size: 13px;
    color: rgba(244, 241, 232, 0.7);
  }
  .montototal {
    font-size: 18px;
    font-weight: 700;
    color: #f4f1e8;
  }
`;

const FloatingCard = styled.div`
  position: absolute;
  display: none;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(20, 18, 28, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.6);
  font-size: 12px;
  font-weight: 600;
  color: #f4f1e8;
  svg {
    color: ${v.colorPrincipal};
    font-size: 16px;
    flex-shrink: 0;
  }
  @media ${Device.laptop} {
    display: flex;
  }
  &.flotante1 {
    top: -10px;
    right: -10px;
  }
  &.flotante2 {
    bottom: 10px;
    left: -30px;
  }
`;

const Section = styled.section`
  position: relative;
  z-index: 1;
  max-width: 1180px;
  margin: 0 auto;
  padding: 60px 24px;
  &.pasos {
    padding-top: 20px;
  }
`;

const SectionHead = styled.div`
  text-align: center;
  max-width: 560px;
  margin: 0 auto 44px;
  .etiqueta {
    color: ${v.colorPrincipal};
    font-weight: 700;
    font-size: 12.5px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  h2 {
    font-size: 26px;
    margin: 10px 0 12px;
    @media ${Device.tablet} {
      font-size: 32px;
    }
  }
  p {
    color: rgba(244, 241, 232, 0.7);
    font-size: 15px;
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
  @media ${Device.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }
  @media ${Device.laptop} {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Card = styled.div`
  padding: 26px 22px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: 0.25s;
  &:hover {
    transform: translateY(-4px);
    border-color: rgba(243, 210, 12, 0.35);
    background: rgba(255, 255, 255, 0.05);
  }
  .icono {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(243, 210, 12, 0.12);
    color: ${v.colorPrincipal};
    font-size: 20px;
    margin-bottom: 16px;
  }
  h3 {
    font-size: 16px;
    margin: 0 0 8px;
  }
  p {
    font-size: 14px;
    color: rgba(244, 241, 232, 0.65);
    margin: 0;
    line-height: 1.5;
  }
`;

const Pasos = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 30px;
  grid-template-columns: 1fr;
  @media ${Device.laptop} {
    grid-template-columns: repeat(3, 1fr);
  }
  li {
    position: relative;
    text-align: center;
    padding: 0 12px;
  }
  .numero {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${v.colorPrincipal}, #a9760a);
    color: #1a1206;
    font-weight: 700;
    margin-bottom: 16px;
  }
  h3 {
    font-size: 17px;
    margin: 0 0 8px;
  }
  p {
    font-size: 14px;
    color: rgba(244, 241, 232, 0.65);
    margin: 0 auto;
    max-width: 260px;
    line-height: 1.5;
  }
  .conector {
    display: none;
    position: absolute;
    top: 23px;
    left: calc(50% + 45px);
    width: calc(100% - 70px);
    height: 1px;
    background: repeating-linear-gradient(
      90deg,
      rgba(243, 210, 12, 0.4) 0 6px,
      transparent 6px 12px
    );
    @media ${Device.laptop} {
      display: block;
    }
  }
`;

const Cta = styled.section`
  position: relative;
  z-index: 1;
  max-width: 780px;
  margin: 20px auto 70px;
  padding: 48px 30px;
  border-radius: 24px;
  text-align: center;
  background: linear-gradient(135deg, rgba(243, 210, 12, 0.14), rgba(144, 70, 255, 0.14));
  border: 1px solid rgba(243, 210, 12, 0.25);
  h2 {
    font-size: 24px;
    margin: 0 0 12px;
    @media ${Device.tablet} {
      font-size: 28px;
    }
  }
  p {
    color: rgba(244, 241, 232, 0.75);
    margin: 0 0 26px;
  }
`;

const FooterWrap = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px 30px;
`;
