import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import Swal from "sweetalert2";
import { ValidarImagenesProducto } from "../../../index";

/**
 * Fotos de cada color del producto (ropa y calzado). Las ya guardadas se
 * quitan o cambian de color al momento; las nuevas quedan pendientes por
 * color y se suben al guardar el producto.
 *  - colores: [{ nombre, hex }] de las tallas y colores del formulario.
 *  - imagenes: fotos guardadas del producto (con su `color`).
 *  - pendientes: { [color]: File[] }.
 *  - pendientesGenerales: cuántas fotos generales nuevas hay (el límite de
 *    fotos es por producto).
 */
export function FotosPorColor({
  colores,
  imagenes,
  pendientes,
  pendientesGenerales = 0,
  onPendientesChange,
  onQuitarExistente,
  onCambiarColor,
}) {
  const totalProducto =
    imagenes.length +
    pendientesGenerales +
    Object.values(pendientes).reduce((n, fs) => n + fs.length, 0);

  // Colores que ya no están en el producto pero tienen fotos: se muestran
  // para poder moverlas o borrarlas.
  const grupos = useMemo(() => {
    const lista = colores.map((c) => ({ ...c, huerfano: false }));
    for (const img of imagenes) {
      if (img.color && !lista.some((c) => c.nombre === img.color)) {
        lista.push({ nombre: img.color, hex: null, huerfano: true });
      }
    }
    return lista;
  }, [colores, imagenes]);

  if (grupos.length === 0) return null;

  return (
    <Container>
      <span className="titulo">Fotos por color</span>
      <span className="ayuda">
        En la tienda, al elegir un color se ven sus fotos. Si un color no tiene
        fotos propias se muestran las generales (las de arriba).
      </span>
      {grupos.map((c) => (
        <GrupoColor
          key={c.nombre}
          color={c}
          colores={colores}
          imagenes={imagenes.filter((i) => i.color === c.nombre)}
          pendientes={pendientes[c.nombre] ?? []}
          totalProducto={totalProducto}
          onPendientesChange={(files) =>
            onPendientesChange({ ...pendientes, [c.nombre]: files })
          }
          onQuitarExistente={onQuitarExistente}
          onCambiarColor={onCambiarColor}
        />
      ))}
    </Container>
  );
}

function GrupoColor({
  color,
  colores,
  imagenes,
  pendientes,
  totalProducto,
  onPendientesChange,
  onQuitarExistente,
  onCambiarColor,
}) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    const urls = pendientes.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [pendientes]);

  async function elegir(e) {
    const archivos = Array.from(e.target.files);
    e.target.value = "";
    if (archivos.length === 0) return;
    const r = await ValidarImagenesProducto(archivos, totalProducto);
    if (!r.valido) {
      Swal.fire({ icon: "error", title: "Oops...", text: r.mensaje });
      return;
    }
    onPendientesChange([...pendientes, ...archivos]);
  }

  return (
    <div className="grupo">
      <div className="encabezado">
        <i className="muestra" style={{ background: color.hex || "transparent" }} />
        <strong>{color.nombre}</strong>
        <span className="cuantas">
          {imagenes.length + pendientes.length} foto
          {imagenes.length + pendientes.length === 1 ? "" : "s"}
        </span>
        {color.huerfano && (
          <span className="aviso">Este color ya no está en el producto</span>
        )}
      </div>
      <div className="fotos">
        {imagenes.map((img) => (
          <figure key={img.id}>
            <img src={img.url} alt="" />
            <button
              type="button"
              className="quitar"
              aria-label="Eliminar foto"
              onClick={() => onQuitarExistente(img)}
            >
              ×
            </button>
            <select
              value={img.color ?? ""}
              aria-label="Color de la foto"
              onChange={(e) => onCambiarColor(img, e.target.value)}
            >
              <option value="">Todos los colores</option>
              {colores.map((c) => (
                <option key={c.nombre} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
              {color.huerfano && (
                <option value={color.nombre}>{color.nombre}</option>
              )}
            </select>
          </figure>
        ))}
        {previews.map((url, i) => (
          <figure key={url} className="pendiente">
            <img src={url} alt="" />
            <button
              type="button"
              className="quitar"
              aria-label="Quitar foto"
              onClick={() =>
                onPendientesChange(pendientes.filter((_, idx) => idx !== i))
              }
            >
              ×
            </button>
            <span className="etiqueta">Se sube al guardar</span>
          </figure>
        ))}
        {!color.huerfano && (
          <button type="button" className="agregar" onClick={() => inputRef.current?.click()}>
            + agregar fotos
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/bmp"
          hidden
          onChange={elegir}
        />
      </div>
    </div>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed ${({ theme }) => theme.color2};
  .titulo {
    font-weight: 600;
    font-size: 14px;
  }
  .ayuda {
    font-size: 12px;
    opacity: 0.7;
  }
  .grupo {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 0;
  }
  .grupo + .grupo {
    border-top: 1px solid ${({ theme }) => theme.color2};
  }
  .encabezado {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 14px;
  }
  .muestra {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid rgba(128, 128, 128, 0.6);
  }
  .cuantas {
    font-size: 12px;
    opacity: 0.6;
  }
  .aviso {
    font-size: 12px;
    color: #f46943;
  }
  .fotos {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-start;
  }
  figure {
    position: relative;
    margin: 0;
    width: 104px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    img {
      width: 104px;
      height: 104px;
      object-fit: cover;
      border-radius: 8px;
    }
    &.pendiente img {
      outline: 2px dashed ${({ theme }) => theme.acento};
      outline-offset: -2px;
    }
    .quitar {
      position: absolute;
      top: 4px;
      right: 4px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.65);
      color: #fff;
      font-size: 16px;
      line-height: 1;
      cursor: pointer;
    }
    select {
      padding: 4px;
      border-radius: 6px;
      border: 1px solid ${({ theme }) => theme.color2};
      background: ${({ theme }) => theme.body};
      color: ${({ theme }) => theme.text};
      font-size: 12px;
    }
    .etiqueta {
      font-size: 11px;
      opacity: 0.7;
      text-align: center;
    }
  }
  .agregar {
    width: 104px;
    height: 104px;
    border-radius: 8px;
    border: 1px dashed ${({ theme }) => theme.color2};
    background: transparent;
    color: ${({ theme }) => theme.text};
    font-size: 13px;
    cursor: pointer;
  }
`;
