import styled from "styled-components";
import { CodigoBarras } from "../../../utils/codigoBarras";

/**
 * Etiqueta de una pieza (preview en pantalla). Para imprimir en lote se usa
 * `imprimirEtiquetas` de utils/codigoBarras, que arma su propia hoja.
 * @param {{
 *   pieza: {sku:string, barcode:string, peso:(number|string), precio_venta:(number|string)},
 *   producto?: string, material?: string, pureza?: string
 * }} props
 */
export function EtiquetaPieza({ pieza, producto, material, pureza }) {
  return (
    <Label>
      <div className="nombre">{producto}</div>
      <div className="mat">
        {material} {pureza} · {pieza.peso} g
      </div>
      <div className="precio">$ {pieza.precio_venta}</div>
      <CodigoBarras value={pieza.barcode} module={2} barHeight={46} fontSize={10} />
      <div className="sku">{pieza.sku}</div>
    </Label>
  );
}

const Label = styled.div`
  width: 190px;
  border: 1px dashed #bbb;
  border-radius: 6px;
  padding: 10px;
  text-align: center;
  background: #fff;
  color: #111;
  .nombre {
    font-weight: 700;
    font-size: 13px;
    line-height: 1.1;
  }
  .mat {
    font-size: 11px;
    color: #444;
    margin: 3px 0;
  }
  .precio {
    font-weight: 700;
    font-size: 15px;
    margin-bottom: 3px;
  }
  svg {
    width: 100%;
    height: auto;
  }
  .sku {
    font-family: monospace;
    font-size: 11px;
    margin-top: 3px;
  }
`;
