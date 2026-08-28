import { useMemo, useState } from "react";
import styled from "styled-components";
import { useForm } from "react-hook-form";
import { Btn1 } from "../../../index";
import { v } from "../../../styles/variables";
import { useJoyeriaStore } from "../../../store/JoyeriaStore";
import { useMovimientoPiezaMutation } from "../../../tanstack/JoyeriaStack";

const ESTADO_LABEL = {
  disponible: "Disponible",
  vendida: "Vendida",
  reservada: "Reservada",
  danada: "Dañada",
  perdida: "Perdida",
};

const MARCA_OPCIONES = [
  { value: "danada", label: "Dañada" },
  { value: "perdida", label: "Perdida" },
  { value: "disponible", label: "Disponible (revertir)" },
];

/**
 * Modal de movimiento manual sobre una pieza. Se adapta al estado:
 *  - pieza `vendida`  -> devolución (destino disponible / dañada).
 *  - cualquier otro   -> ajuste (peso/costo/precio) o marcar (perdida/dañada/disponible).
 * Las validaciones fuertes las hace la BD (RPC ajustar_pieza / marcar_pieza / devolver_pieza).
 */
export function FormMovimientoPieza({ onClose }) {
  const { piezaSelect: pieza } = useJoyeriaStore();
  const { mutate, isPending } = useMovimientoPiezaMutation();

  const esVendida = pieza?.estado === "vendida";
  const [tab, setTab] = useState(esVendida ? "devolver" : "ajuste");

  const marcaOpciones = useMemo(
    () => MARCA_OPCIONES.filter((o) => o.value !== pieza?.estado),
    [pieza?.estado],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      peso: pieza?.peso ?? "",
      costo: pieza?.costo ?? "",
      precio_venta: pieza?.precio_venta ?? "",
      estado: marcaOpciones[0]?.value ?? "danada",
      destino: "disponible",
      nota: "",
    },
  });

  if (!pieza) return null;

  const onSubmit = (values) => {
    mutate({ tipo: tab, pieza, values }, { onSuccess: onClose });
  };

  const tabs = esVendida
    ? [["devolver", "Devolver"]]
    : [
        ["ajuste", "Ajustar"],
        ["marcar", "Marcar"],
      ];

  return (
    <Container>
      <div className="sub-contenedor">
        <div className="headers">
          <h1>
            Movimiento de pieza
            <small> · {pieza.sku}</small>
          </h1>
          <span onClick={onClose}>x</span>
        </div>

        <div className="pieza-info">
          <span className={`badge ${pieza.estado}`}>
            {ESTADO_LABEL[pieza.estado] ?? pieza.estado}
          </span>
          <span className="txt">
            {pieza.producto} · {pieza.material} {pieza.pureza ?? ""} · {pieza.peso} g
          </span>
        </div>

        <div className="tabs">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? "on" : ""}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
          {tab === "ajuste" && (
            <>
              <p className="hint">
                Dejá un campo vacío para no tocar ese valor. No aplica a piezas vendidas.
              </p>
              <div className="fila">
                <label>
                  Peso (g)
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    {...register("peso")}
                  />
                </label>
                <label>
                  Costo
                  <input type="number" step="0.01" min="0" {...register("costo")} />
                </label>
                <label>
                  Precio
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("precio_venta")}
                  />
                </label>
              </div>
            </>
          )}

          {tab === "marcar" && (
            <label>
              Nuevo estado
              <select {...register("estado", { required: true })}>
                {marcaOpciones.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {tab === "devolver" && (
            <label>
              Destino de la pieza devuelta
              <select {...register("destino", { required: true })}>
                <option value="disponible">Disponible (vuelve a stock)</option>
                <option value="danada">Dañada (no se revende)</option>
              </select>
            </label>
          )}

          <label>
            Nota {tab !== "ajuste" && <em>(recomendada)</em>}
            <input
              type="text"
              placeholder="motivo del movimiento"
              {...register("nota")}
            />
          </label>
          {errors.estado && <p className="err">Elegí un estado</p>}

          <Btn1
            icono={<v.iconoguardar />}
            titulo={isPending ? "Guardando..." : "Registrar movimiento"}
            bgcolor="#F9D70B"
            disabled={isPending}
          />
        </form>
      </div>
    </Container>
  );
}

const Container = styled.div`
  transition: 0.5s;
  top: 0;
  left: 0;
  position: fixed;
  background-color: rgba(10, 9, 9, 0.5);
  display: flex;
  width: 100%;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  .sub-contenedor {
    position: relative;
    width: 560px;
    max-width: 92%;
    border-radius: 20px;
    background: ${({ theme }) => theme.bgtotal};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
    padding: 13px 32px 22px 32px;
  }
  .headers {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    h1 {
      font-size: 19px;
      font-weight: 500;
    }
    small {
      color: #9b9b9b;
      font-family: monospace;
    }
    span {
      font-size: 20px;
      cursor: pointer;
    }
  }
  .pieza-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    font-size: 13px;
  }
  .pieza-info .txt {
    opacity: 0.8;
  }
  .badge {
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
  }
  .badge.disponible {
    background: #d8f5e3;
    color: #1c7a45;
  }
  .badge.reservada {
    background: #fdeecd;
    color: #98690f;
  }
  .badge.vendida {
    background: #e6e6e6;
    color: #555;
  }
  .badge.danada,
  .badge.perdida {
    background: #fbdad6;
    color: #a5342a;
  }
  .tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
  }
  .tabs button {
    background: none;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 999px;
    padding: 5px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    color: ${({ theme }) => theme.text};
    opacity: 0.55;
  }
  .tabs button.on {
    opacity: 1;
    background: ${({ theme }) => theme.color2};
  }
  .formulario {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .formulario .hint {
    font-size: 12px;
    opacity: 0.65;
    margin: 0;
  }
  .formulario .err {
    color: #f46943;
    margin: 0;
  }
  .formulario label {
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 13px;
    font-weight: 600;
    opacity: 0.85;
  }
  .formulario label em {
    font-weight: 400;
    opacity: 0.7;
  }
  .formulario input,
  .formulario select {
    padding: 9px 11px;
    border-radius: 9px;
    border: 1px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgtotal};
    color: ${({ theme }) => theme.text};
    font-size: 14px;
    font-weight: 400;
  }
  .formulario .fila {
    display: flex;
    gap: 12px;
  }
  .formulario .fila label {
    flex: 1;
  }
`;
