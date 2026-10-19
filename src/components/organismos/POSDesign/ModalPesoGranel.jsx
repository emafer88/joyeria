import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { Btn1 } from "../../moleculas/Btn1";
import { BtnClose } from "../../ui/buttons/BtnClose";
import { InputText2 } from "../formularios/InputText2";
import { useEmpresaStore } from "../../../store/EmpresaStore";
import { FormatearNumeroDinero } from "../../../utils/Conversiones";
import { v } from "../../../styles/variables";
import { unidadPeso } from "../../../utils/granel";

// Pide el peso de un producto por peso antes de agregarlo a la venta. El peso
// se escribe a mano (leído de la báscula) en la unidad del producto (kg o g);
// el importe es precio por unidad × peso.
export function ModalPesoGranel({ producto, onConfirmar, onCerrar }) {
  const { dataempresa } = useEmpresaStore();
  const unidad = unidadPeso(producto);
  const [peso, setPeso] = useState("");
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const kg = parseFloat(peso);
  const valido = Number.isFinite(kg) && kg > 0;
  const importe = valido ? kg * Number(producto.precio_venta) : 0;
  const dinero = (n) =>
    FormatearNumeroDinero(n, dataempresa?.currency, dataempresa?.iso);

  function confirmar(e) {
    e.preventDefault();
    if (!valido) return;
    onConfirmar(Math.round(kg * 1000) / 1000);
  }

  return (
    <Container
      onKeyDown={(e) => {
        if (e.key === "Escape") onCerrar();
      }}
    >
      <Caja onSubmit={confirmar}>
        <BtnClose funcion={onCerrar} />
        <span className="titulo">Peso del producto</span>
        <span className="producto">{producto.nombre}</span>
        <span className="precio">
          {dinero(Number(producto.precio_venta))} por {unidad}
        </span>
        <InputText2>
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            step="0.001"
            min="0"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            placeholder={unidad}
            className="form__field"
          />
          <label className="form__label">
            {unidad === "kg" ? "peso en kg (ej. 0.350)" : "peso en gramos (ej. 350)"}
          </label>
        </InputText2>
        <span className="importe">
          Importe: <strong>{dinero(importe)}</strong>
        </span>
        <Btn1
          type="submit"
          disabled={!valido}
          titulo="Agregar"
          bgcolor={v.colorPrincipal}
          width="100%"
        />
      </Caja>
    </Container>
  );
}

const Container = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: rgba(18, 18, 18, 0.5);
`;
const Caja = styled.form`
  position: relative;
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.bgtotal};
  color: ${({ theme }) => theme.text};
  .titulo {
    font-size: 20px;
    font-weight: 700;
  }
  .producto {
    font-weight: 600;
  }
  .precio {
    opacity: 0.8;
  }
  .importe {
    font-size: 18px;
  }
`;
