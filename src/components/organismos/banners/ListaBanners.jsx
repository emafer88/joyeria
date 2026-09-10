import styled from "styled-components";
import Swal from "sweetalert2";
import { Spinner1 } from "../../../index";
import { v } from "../../../styles/variables";
import { useBannersStore } from "../../../store/BannersStore";
import { useBannersQuery, useEliminarBannerMutation } from "../../../tanstack/BannersStack";

export function ListaBanners() {
  const { abrirModal, setBannerSelect } = useBannersStore();
  const { data: banners = [], isLoading, error } = useBannersQuery();
  const eliminarBanner = useEliminarBannerMutation();

  if (isLoading) return <Spinner1 />;
  if (error) return <p className="err">Error: {error.message}</p>;
  if (banners.length === 0)
    return <p className="vacio">Sin banners todavía. El home muestra unos genéricos hasta que cargues el primero.</p>;

  const editar = (banner) => {
    setBannerSelect(banner);
    abrirModal("form", "Editar");
  };
  const borrar = (banner) => {
    Swal.fire({
      title: "¿Eliminar el banner?",
      text: banner.titulo,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, eliminar",
    }).then((r) => {
      if (r.isConfirmed) eliminarBanner.mutate(banner);
    });
  };

  return (
    <Container>
      {banners.map((banner) => (
        <div className="fila" key={banner.id}>
          <img className="miniatura" src={banner.imagen_url} alt={banner.titulo} />
          <div className="info">
            <strong>{banner.titulo}</strong>
            {banner.subtitulo && <span className="sub">{banner.subtitulo}</span>}
            <span className={`estado ${banner.activo ? "on" : "off"}`}>
              {banner.activo ? "Activo" : "Inactivo"} · orden {banner.orden}
            </span>
          </div>
          <div className="acciones">
            <button title="Editar" onClick={() => editar(banner)}>
              <v.iconeditarTabla />
            </button>
            <button title="Eliminar" className="del" onClick={() => borrar(banner)}>
              <v.iconeliminarTabla />
            </button>
          </div>
        </div>
      ))}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  .fila {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px;
    border-radius: 12px;
    border: 1px solid ${({ theme }) => theme.color2};
  }
  .miniatura {
    width: 96px;
    height: 54px;
    object-fit: cover;
    border-radius: 8px;
    flex-shrink: 0;
  }
  .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .sub {
    font-size: 12.5px;
    opacity: 0.7;
  }
  .estado {
    font-size: 11.5px;
    font-weight: 600;
  }
  .estado.on {
    color: #2ecc71;
  }
  .estado.off {
    color: #f46943;
  }
  .acciones {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
    button {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      color: ${({ theme }) => theme.text};
      padding: 6px;
    }
    button.del {
      color: #f46943;
    }
  }
`;
