import { useState } from "react";
import styled from "styled-components";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { Btn1 } from "../../../index";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { EscanerCodigoBarras } from "./EscanerCodigoBarras";
import { PosBuscarPieza } from "../../../supabaseCrud/crudJoyeria";
import { useAgregarPiezaCarritoMutation } from "../../../tanstack/JoyeriaStack";

const ESTADO_LABEL = {
  disponible: "Disponible",
  vendida: "Vendida",
  reservada: "Reservada",
  danada: "Dañada",
  perdida: "Perdida",
};

/**
 * Botón flotante + panel para escanear una pieza de joyería en el POS y
 * agregarla al carrito. No modifica el flujo existente del POS: crea la línea
 * de venta con id_pieza aparte y deja que los triggers de la base manejen la
 * reserva / venta de la pieza.
 */
export function EscanerPiezaPos() {
  const [open, setOpen] = useState(false);
  const [pieza, setPieza] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const { dataempresa } = useEmpresaStore();
  const agregar = useAgregarPiezaCarritoMutation();

  const buscar = async (codigo) => {
    setBuscando(true);
    setPieza(null);
    try {
      const p = await PosBuscarPieza({ codigo, id_empresa: dataempresa?.id });
      if (!p) toast.error("No se encontró ninguna pieza con ese código");
      setPieza(p);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBuscando(false);
    }
  };

  const agregarAlCarrito = () => {
    agregar.mutate(pieza, { onSuccess: () => setPieza(null) });
  };

  const cerrar = () => {
    setOpen(false);
    setPieza(null);
  };

  return (
    <>
      <FloatBtn onClick={() => setOpen(true)} title="Escanear joya">
        <Icon icon="mdi:barcode-scan" fontSize={26} />
      </FloatBtn>

      {open && (
        <Overlay onClick={(e) => e.target === e.currentTarget && cerrar()}>
          <Panel>
            <div className="head">
              <h2>Escanear pieza</h2>
              <span onClick={cerrar}>×</span>
            </div>

            <EscanerCodigoBarras onScan={buscar} />

            {buscando && <p className="muted">Buscando…</p>}

            {pieza && (
              <div className="card">
                <div className="nombre">{pieza.producto}</div>
                <div className="linea">
                  {pieza.material} {pieza.pureza} · {pieza.peso} g
                </div>
                <div className="precio">
                  $ {Number(pieza.precio_venta).toFixed(2)}
                </div>
                <span className={`estado ${pieza.estado}`}>
                  {ESTADO_LABEL[pieza.estado] ?? pieza.estado}
                </span>
                <div className="sku">
                  {pieza.sku} · {pieza.barcode}
                </div>
                <Btn1
                  titulo={
                    agregar.isPending
                      ? "Agregando…"
                      : pieza.estado === "disponible"
                        ? "Agregar al carrito"
                        : "No disponible"
                  }
                  bgcolor="#F9D70B"
                  disabled={pieza.estado !== "disponible" || agregar.isPending}
                  funcion={agregarAlCarrito}
                />
                <p className="hint">Seguí escaneando o cerrá el panel.</p>
              </div>
            )}
          </Panel>
        </Overlay>
      )}
    </>
  );
}

const FloatBtn = styled.button`
  position: fixed;
  bottom: 90px;
  left: 20px;
  z-index: 900;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: #f3d20c;
  color: #222;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.3);
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(10, 9, 9, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
`;

const Panel = styled.div`
  width: 440px;
  max-width: 92%;
  background: ${({ theme }) => theme.bgtotal};
  border-radius: 18px;
  padding: 18px 24px 22px;
  box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
  display: flex;
  flex-direction: column;
  gap: 14px;
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    h2 {
      font-size: 18px;
      font-weight: 600;
    }
    span {
      font-size: 22px;
      cursor: pointer;
    }
  }
  .muted {
    opacity: 0.6;
    margin: 0;
  }
  .card {
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    text-align: center;
  }
  .card .nombre {
    font-weight: 800;
    font-size: 18px;
  }
  .card .linea {
    opacity: 0.85;
  }
  .card .precio {
    font-weight: 800;
    font-size: 22px;
    margin: 4px 0;
  }
  .card .sku {
    font-family: monospace;
    font-size: 12px;
    opacity: 0.7;
    margin-bottom: 6px;
  }
  .card .estado {
    align-self: center;
    padding: 2px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
  }
  .card .estado.disponible {
    background: #d8f5e3;
    color: #1c7a45;
  }
  .card .estado.reservada {
    background: #fdeecd;
    color: #98690f;
  }
  .card .estado.vendida {
    background: #e6e6e6;
    color: #555;
  }
  .card .estado.danada,
  .card .estado.perdida {
    background: #fbdad6;
    color: #a5342a;
  }
  .card .hint {
    font-size: 12px;
    opacity: 0.6;
    margin: 4px 0 0;
  }
`;
