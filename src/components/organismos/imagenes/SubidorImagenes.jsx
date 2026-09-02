import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import Swal from "sweetalert2";
import { v } from "../../../styles/variables";
import { Btn1, Icono, ValidarImagenesProducto } from "../../../index";

/**
 * Galería reutilizable de imágenes (producto y variante de joyería).
 *
 * El padre es dueño de:
 *  - `imagenesExistentes`: filas ya guardadas ({ id, url, path, orden }).
 *  - `pendientes`: File[] elegidos pero aún no subidos; el padre los sube al
 *    guardar el formulario (mismo flujo diferido que RegistrarProductos).
 *
 * Acciones delegadas al padre:
 *  - onPendientesChange(files)      -> nuevo arreglo de File pendientes.
 *  - onEliminarExistente(imagen)    -> confirmar + borrar en storage/DB.
 *  - onReordenar([{ id, orden }])   -> tras drag & drop o "marcar portada".
 *
 * "Portada" = la imagen con `orden` más bajo (no hay columna dedicada); el
 * botón ★ la manda a `orden = 1` y renumera el resto.
 */
export function SubidorImagenes({
  imagenesExistentes = [],
  pendientes = [],
  onPendientesChange,
  onEliminarExistente,
  onReordenar,
  maxImagenes = 10,
  label = "Imágenes (opcional)",
}) {
  const inputRef = useRef(null);
  const arrastrandoRef = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [orden, setOrden] = useState([]);

  // Ordenar por `orden` y re-sincronizar cuando el padre cambia la lista.
  useEffect(() => {
    setOrden(
      [...imagenesExistentes].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)),
    );
  }, [imagenesExistentes]);

  // Previews de los archivos pendientes (object URLs, se revocan al limpiar).
  useEffect(() => {
    const urls = pendientes.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [pendientes]);

  const totalActual = imagenesExistentes.length + pendientes.length;

  const abrir = () => inputRef.current?.click();

  async function elegir(e) {
    const archivos = Array.from(e.target.files);
    e.target.value = "";
    if (archivos.length === 0) return;
    const r = await ValidarImagenesProducto(archivos, totalActual);
    if (!r.valido) {
      Swal.fire({ icon: "error", title: "Oops...", text: r.mensaje });
      return;
    }
    onPendientesChange?.([...pendientes, ...archivos]);
  }

  const quitarPendiente = (i) =>
    onPendientesChange?.(pendientes.filter((_, idx) => idx !== i));

  // --- drag & drop sobre las imágenes ya guardadas ---
  const onDragStart = (i) => {
    arrastrandoRef.current = i;
  };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (i) => {
    const desde = arrastrandoRef.current;
    arrastrandoRef.current = null;
    if (desde === null || desde === i) return;
    const copia = [...orden];
    const [movida] = copia.splice(desde, 1);
    copia.splice(i, 0, movida);
    aplicarOrden(copia);
  };

  const hacerPortada = (id) => {
    const copia = [...orden];
    const idx = copia.findIndex((x) => x.id === id);
    if (idx <= 0) return;
    const [movida] = copia.splice(idx, 1);
    copia.unshift(movida);
    aplicarOrden(copia);
  };

  function aplicarOrden(lista) {
    const conOrden = lista.map((img, idx) => ({ ...img, orden: idx + 1 }));
    setOrden(conOrden);
    onReordenar?.(conOrden.map(({ id, orden }) => ({ id, orden })));
  }

  return (
    <Wrapper>
      <label className="titulo">
        {label} · máx. {maxImagenes}
      </label>

      <Galeria>
        {orden.map((img, i) => (
          <Miniatura
            key={img.id}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(i)}
            $portada={i === 0}
            title="Arrastrá para reordenar"
          >
            <img src={img.url} alt="imagen" />
            {i === 0 && <span className="badge">portada</span>}
            {i !== 0 && (
              <button
                type="button"
                className="acc portada"
                title="Marcar como portada"
                onClick={() => hacerPortada(img.id)}
              >
                ★
              </button>
            )}
            <button
              type="button"
              className="acc quitar"
              title="Quitar"
              onClick={() => onEliminarExistente?.(img)}
            >
              {<v.iconocerrar />}
            </button>
          </Miniatura>
        ))}

        {previews.map((src, i) => (
          <Miniatura key={`nueva-${i}`} $nueva>
            <img src={src} alt="nueva" />
            <span className="badge nueva">nueva</span>
            <button
              type="button"
              className="acc quitar"
              title="Quitar"
              onClick={() => quitarPendiente(i)}
            >
              {<v.iconocerrar />}
            </button>
          </Miniatura>
        ))}

        {orden.length === 0 && previews.length === 0 && (
          <Icono>{<v.iconoimagenvacia />}</Icono>
        )}
      </Galeria>

      <Btn1
        type="button"
        funcion={abrir}
        titulo="+ imagen(es)"
        color="#5f5f5f"
        bgcolor="rgb(183, 183, 182)"
        icono={<v.iconosupabase />}
        disabled={totalActual >= maxImagenes}
      />
      <input
        type="file"
        accept="image/jpeg,image/png,image/gif,image/bmp"
        multiple
        ref={inputRef}
        style={{ display: "none" }}
        onChange={elegir}
      />
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  .titulo {
    font-size: 14px;
    opacity: 0.85;
  }
`;
const Galeria = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 50px;
`;
const Miniatura = styled.div`
  position: relative;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  cursor: ${({ $nueva }) => ($nueva ? "default" : "grab")};
  border: 2px solid ${({ $portada }) => ($portada ? "#F9D70B" : "transparent")};
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .badge {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    font-size: 9px;
    font-weight: 700;
    text-align: center;
    background: rgba(249, 215, 11, 0.9);
    color: #333;
  }
  .badge.nueva {
    background: rgba(46, 204, 113, 0.9);
    color: #fff;
  }
  .acc {
    position: absolute;
    background: rgba(10, 9, 9, 0.6);
    border: none;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    svg {
      font-size: 12px;
    }
  }
  .acc.quitar {
    top: 0;
    right: 0;
  }
  .acc.portada {
    top: 0;
    left: 0;
    font-size: 11px;
    line-height: 1;
  }
`;
