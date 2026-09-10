import styled from "styled-components";
import { Btn1, Title } from "../../index";
import { v } from "../../styles/variables";
import { useBannersStore } from "../../store/BannersStore";
import { ListaBanners } from "../organismos/banners/ListaBanners";
import { FormBanner } from "../organismos/banners/FormBanner";

/**
 * Pestaña "Banners" (dentro de Productos): CRUD del hero rotativo del home
 * del ecommerce. Leído desde joyeria-ecommerce vía ecommerce_listar_banners.
 */
export function BannersTemplate() {
  const { modal, cerrarModal, abrirModal, setBannerSelect } = useBannersStore();

  const nuevoBanner = () => {
    setBannerSelect(null);
    abrirModal("form", "Nuevo");
  };

  return (
    <Container>
      {modal === "form" && <FormBanner onClose={cerrarModal} />}

      <section className="area1">
        <Title>Banners del home</Title>
        <Btn1
          funcion={nuevoBanner}
          bgcolor={v.colorPrincipal}
          titulo="nuevo banner"
          icono={<v.iconoagregar />}
        />
      </section>
      <section className="main">
        <ListaBanners />
      </section>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  .area1 {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
  }
`;
