import { useState } from "react";
import styled from "styled-components";
import { useForm, useFieldArray } from "react-hook-form";
import { Btn1 } from "../../../index";
import { v } from "../../../styles/variables";
import { useJoyeriaStore } from "../../../store/JoyeriaStore";
import {
  useAlmacenesJoyeriaQuery,
  useCrearPiezasMasivoMutation,
} from "../../../tanstack/JoyeriaStack";
import { imprimirEtiquetas } from "../../../utils/codigoBarras";
import { EtiquetaPieza } from "./EtiquetaPieza";

const FILA_VACIA = { peso: "", costo: "", precio_venta: "", cantidad: 1 };

/**
 * Alta masiva de piezas físicas para una variante. El usuario carga N líneas
 * (peso / costo / precio / cantidad) y "Generar piezas" crea todas las piezas
 * individuales en una sola transacción vía el RPC crear_piezas_masivo.
 * Después muestra el resultado con SKU y código de barras listos para imprimir.
 */
export function FormAltaMasivaPiezas({ onClose }) {
  const { disenoSelect, varianteSelect } = useJoyeriaStore();
  const { data: almacenes = [] } = useAlmacenesJoyeriaQuery();
  const { mutate, isPending } = useCrearPiezasMasivoMutation();
  const [generadas, setGeneradas] = useState(null); // null = fase formulario

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { id_almacen: "", lineas: [{ ...FILA_VACIA }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "lineas" });

  const lineasWatch = watch("lineas");
  const totalPiezas = (lineasWatch || []).reduce(
    (acc, l) => acc + (Number(l?.cantidad) || 0),
    0
  );

  const onSubmit = (values) => {
    const lineas = values.lineas
      .map((l) => ({
        peso: Number(l.peso),
        costo: Number(l.costo || 0),
        precio_venta: Number(l.precio_venta),
        cantidad: Number(l.cantidad),
      }))
      .filter((l) => l.peso > 0 && l.cantidad >= 1);

    if (lineas.length === 0) return;

    mutate(
      { idVariante: varianteSelect.id, idAlmacen: values.id_almacen, lineas },
      { onSuccess: (data) => setGeneradas(data) }
    );
  };

  const cargarMas = () => {
    setGeneradas(null);
    reset({ id_almacen: "", lineas: [{ ...FILA_VACIA }] });
  };

  const imprimir = () => {
    imprimirEtiquetas(generadas, {
      producto: disenoSelect?.nombre,
      material: varianteSelect?.material,
      pureza: varianteSelect?.pureza,
    });
  };

  return (
    <Container>
      <div className="sub-contenedor">
        <div className="headers">
          <h1>
            Alta masiva de piezas
            <small>
              {" "}
              · {disenoSelect?.nombre} — {varianteSelect?.material}{" "}
              {varianteSelect?.pureza}
            </small>
          </h1>
          <span onClick={onClose}>x</span>
        </div>

        {!generadas ? (
          <form className="formulario" onSubmit={handleSubmit(onSubmit)}>
            <label className="sel-label">Almacén (opcional)</label>
            <select className="select" {...register("id_almacen")}>
              <option value="">— sin asignar —</option>
              {almacenes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                  {a.sucursales?.nombre ? ` (${a.sucursales.nombre})` : ""}
                </option>
              ))}
            </select>

            <table className="tabla">
              <thead>
                <tr>
                  <th>Peso (g)</th>
                  <th>Costo</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {fields.map((f, i) => (
                  <tr key={f.id}>
                    <td>
                      <input
                        type="number"
                        step="0.001"
                        placeholder="7.800"
                        {...register(`lineas.${i}.peso`, {
                          required: true,
                          min: 0.001,
                        })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="4200"
                        {...register(`lineas.${i}.costo`)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="6500"
                        {...register(`lineas.${i}.precio_venta`, {
                          required: true,
                          min: 0,
                        })}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="1"
                        min="1"
                        {...register(`lineas.${i}.cantidad`, {
                          required: true,
                          min: 1,
                        })}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="del"
                        disabled={fields.length === 1}
                        onClick={() => remove(i)}
                      >
                        <v.iconeliminarTabla />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {errors.lineas && (
              <p className="err">
                Revisá las filas: peso y cantidad son obligatorios (peso &gt; 0,
                cantidad &ge; 1).
              </p>
            )}

            <button
              type="button"
              className="agregar"
              onClick={() => append({ ...FILA_VACIA })}
            >
              + agregar fila
            </button>

            <div className="footer">
              <span>
                Total a generar: <strong>{totalPiezas}</strong> pieza(s)
              </span>
              <Btn1
                icono={<v.iconoguardar />}
                titulo={isPending ? "Generando..." : "Generar piezas"}
                bgcolor="#F9D70B"
                disabled={isPending || totalPiezas < 1}
              />
            </div>
          </form>
        ) : (
          <div className="resultado">
            <p className="ok">
              Se generaron <strong>{generadas.length}</strong> piezas.
            </p>
            <div className="preview">
              <span className="preview-lbl">Así se imprime cada etiqueta:</span>
              <EtiquetaPieza
                pieza={generadas[0]}
                producto={disenoSelect?.nombre}
                material={varianteSelect?.material}
                pureza={varianteSelect?.pureza}
              />
            </div>
            <div className="scroll">
              <table className="tabla res">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Código de barras</th>
                    <th>Peso</th>
                    <th>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {generadas.map((p) => (
                    <tr key={p.id}>
                      <td className="mono">{p.sku}</td>
                      <td className="mono">{p.barcode}</td>
                      <td>{p.peso} g</td>
                      <td>{p.precio_venta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="footer">
              <Btn1
                icono={<v.iconocodigobarras />}
                titulo="Imprimir etiquetas"
                bgcolor="#e7e7e7"
                color="#333"
                funcion={imprimir}
              />
              <div className="der">
                <Btn1
                  titulo="Cargar más"
                  bgcolor="#F9D70B"
                  funcion={cargarMas}
                />
                <Btn1 titulo="Cerrar" bgcolor="#d7d7d7" color="#333" funcion={onClose} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}

const Container = styled.div`
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
    width: 640px;
    max-width: 92%;
    border-radius: 20px;
    background: ${({ theme }) => theme.bgtotal};
    box-shadow: -10px 15px 30px rgba(10, 9, 9, 0.4);
    padding: 13px 32px 22px 32px;
    .headers {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      h1 {
        font-size: 18px;
        font-weight: 500;
      }
      small {
        color: #9b9b9b;
        font-weight: 400;
      }
      span {
        font-size: 20px;
        cursor: pointer;
      }
    }
    .formulario,
    .resultado {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .sel-label {
      font-size: 14px;
      color: #9b9b9b;
      margin-bottom: -8px;
    }
    .select {
      font-family: inherit;
      border: none;
      border-bottom: 2px solid #9b9b9b;
      outline: 0;
      font-size: 15px;
      color: ${({ theme }) => theme.text};
      padding: 7px 0;
      background: transparent;
    }
    .select option {
      color: #222;
    }
    .tabla {
      width: 100%;
      border-collapse: collapse;
    }
    .tabla th {
      text-align: left;
      font-size: 13px;
      opacity: 0.7;
      padding: 4px 6px;
    }
    .tabla td {
      padding: 4px 6px;
    }
    .tabla input {
      width: 100%;
      background: transparent;
      border: 1px solid ${({ theme }) => theme.color2};
      border-radius: 8px;
      padding: 8px;
      color: ${({ theme }) => theme.text};
      outline: none;
    }
    .tabla .del {
      background: none;
      border: none;
      color: #d33;
      cursor: pointer;
      font-size: 17px;
    }
    .tabla .del:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    .agregar {
      align-self: flex-start;
      background: none;
      border: 1px dashed #9b9b9b;
      border-radius: 8px;
      padding: 6px 12px;
      cursor: pointer;
      color: ${({ theme }) => theme.text};
    }
    .err {
      color: #f46943;
      margin: 0;
      font-size: 13px;
    }
    .ok {
      margin: 0;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-top: 6px;
    }
    .footer .der {
      display: flex;
      gap: 10px;
    }
    .scroll {
      max-height: 320px;
      overflow: auto;
      border: 1px solid ${({ theme }) => theme.color2};
      border-radius: 10px;
    }
    .res th,
    .res td {
      border-bottom: 1px solid ${({ theme }) => theme.color2};
      padding: 8px 10px;
      font-size: 14px;
    }
    .mono {
      font-family: monospace;
    }
    .preview {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .preview-lbl {
      font-size: 13px;
      opacity: 0.7;
    }
  }
`;
