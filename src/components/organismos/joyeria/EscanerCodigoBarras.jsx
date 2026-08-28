import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { v } from "../../../styles/variables";

/**
 * Entrada para lector de código de barras. Los lectores USB actúan como
 * teclado y terminan el envío con Enter, así que basta un input enfocado.
 * @param {{ onScan:(codigo:string)=>void, autoFocus?:boolean, placeholder?:string }} props
 */
export function EscanerCodigoBarras({
  onScan,
  autoFocus = true,
  placeholder = "Escaneá o tecleá el código y Enter…",
}) {
  const [valor, setValor] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  const enviar = () => {
    const codigo = valor.trim();
    if (!codigo) return;
    onScan(codigo);
    setValor("");
    ref.current?.focus();
  };

  return (
    <Wrap>
      <v.iconocodigobarras className="ic" />
      <input
        ref={ref}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            enviar();
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
      />
      <button type="button" onClick={enviar}>
        Buscar
      </button>
    </Wrap>
  );
}

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border: 2px solid ${({ theme }) => theme.color2};
  border-radius: 12px;
  padding: 10px 14px;
  .ic {
    font-size: 22px;
    opacity: 0.7;
  }
  input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 18px;
    color: ${({ theme }) => theme.text};
  }
  button {
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: 700;
    cursor: pointer;
    background: #f3d20c;
    color: #222;
  }
`;
