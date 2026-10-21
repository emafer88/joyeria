import { Icon } from "@iconify/react/dist/iconify.js";
import styled from "styled-components";
import { Device } from "../../../styles/breakpoints";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import { useEmpresaStore } from "../../../store/EmpresaStore";
// formato="cantidad": número sin signo de pesos (ej. piezas vendidas).
// detalle: texto chico bajo el valor (ej. "12 ventas").
export const CardTotales = ({ title, icon, value, percentage, formato, detalle }) => {
  const isPositive = percentage > 0;
  const isNeutral = percentage === 0;
  const {dataempresa} = useEmpresaStore()

  return (
    <Container>
      <Title>
        <TitleText>{title} </TitleText>
        <Icon width="20" height="20" icon={icon} />
      </Title>
      
      <SalesValue>
        {formato === "cantidad"
          ? Number(value || 0).toLocaleString("es-MX", { maximumFractionDigits: 3 })
          : FormatearNumeroDinero(value || 0, dataempresa?.currency, dataempresa?.iso)}
      </SalesValue>
      {detalle && <Detalle>{detalle}</Detalle>}
      {
        percentage!=undefined &&<Percentage isPositive={isPositive} isNeutral={isNeutral}>
       <Icon icon={isNeutral?"akar-icons:minus":isPositive?"iconamoon:arrow-up-2-fill":"iconamoon:arrow-down-2-fill"}   width="16"
          height="16"/>
        {percentage}% al periodo anterior
      </Percentage>
      }
      
    </Container>
  );
};
const Container = styled.div`
  height: 100%;
  position: relative;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
gap:14px;
`;
const Title = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const TitleText = styled.span`
  margin-left: 0.1rem;
  color: ${({ theme }) => theme.colortitlecard};
  font-size: 18px;
  text-align: start;
`;

const SalesValue = styled.span`
  color: ${({ theme }) => theme.text};
  font-size: 5vw;
  line-height: 2.5rem;
  font-weight: bold;
  text-align: start;
  @media ${Device.tablet} {
    font-size: 1.8rem;
  }
`;
const Detalle = styled.span`
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
  text-align: start;
`;
const Percentage = styled.span`
  color: ${(props) =>
    props.isNeutral ? "#6b7280" : props.isPositive ? "#616161" : "#d32f5b"};
   font-weight: 500;
   display: flex;
   align-items: start;
   font-size: 12px;
`;
