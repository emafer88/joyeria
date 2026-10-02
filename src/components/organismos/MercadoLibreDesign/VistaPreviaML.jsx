import styled from "styled-components";
import { usePrevisualizarDisenoMLQuery } from "../../../tanstack/MercadoLibreStack";
import { formatoPrecio } from "./comunes";

// Lo que se va a publicar, armado igual que ml-sincronizar: una publicación
// por grupo de piezas iguales. Sirve para ver las fotos y los precios ANTES
// de que ML los modere (fotos que no son de la joya, precios mal cargados).
export function VistaPreviaML({ idProducto }) {
  const { data, isLoading, error } = usePrevisualizarDisenoMLQuery(idProducto);

  if (!idProducto) return null;
  if (isLoading) return <Caja>Armando la vista previa...</Caja>;
  if (error) return <Caja className="mal">Error: {error.message}</Caja>;
  if (!data?.length) return <Caja className="mal">El diseño no tiene piezas disponibles: no se publica nada.</Caja>;

  // Las fotos dependen solo de la variante: se muestran una vez por variante.
  const variantes = [...new Map(data.map((g) => [g.id_variante, g])).values()];
  const sospechosos = data.filter((g) => g.sospechoso);

  return (
    <Caja>
      <h3>Vista previa</h3>
      {variantes.map((v) => (
        <div key={v.id_variante} className="variante">
          <p className="titulo">{v.titulo}</p>
          <p className="suave">Título aproximado: el definitivo lo arma Mercado Libre.</p>
          {v.fotos.length ? (
            <div className="fotos">
              {v.fotos.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt="" />
                </a>
              ))}
            </div>
          ) : (
            <p className="mal">Sin fotos: ML exige al menos una.</p>
          )}
        </div>
      ))}

      <table>
        <thead>
          <tr>
            <th>Variante</th>
            <th>Peso</th>
            <th>Talla</th>
            <th>Precio</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {data.map((g) => (
            <tr key={`${g.id_variante}|${g.peso}|${g.talla}|${g.precio}`} className={g.sospechoso ? "sospechoso" : ""}>
              <td>{g.variante}</td>
              <td>{Number(g.peso)} g</td>
              <td>{g.talla ?? "-"}</td>
              <td>{formatoPrecio(g.precio)}</td>
              <td>{g.piezas}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {sospechosos.length > 0 && (
        <p className="mal">
          {sospechosos.length === 1 ? "1 grupo tiene" : `${sospechosos.length} grupos tienen`} un precio muy por
          debajo del resto de su variante y no se va a publicar hasta que corrijas el precio de esas piezas.
        </p>
      )}
      <p className="suave">
        Revisa que las fotos sean de la joya (sin capturas de pantalla, logos, teléfonos ni links): si no, ML
        modera la publicación.
      </p>
    </Caja>
  );
}

const Caja = styled.div`
  border: 1px solid ${({ theme }) => theme.color2};
  border-radius: 12px;
  padding: 14px;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  h3 {
    margin: 0;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #f88533;
  }
  p {
    margin: 0;
  }
  .titulo {
    font-weight: 700;
  }
  .suave {
    font-size: 12px;
    opacity: 0.6;
  }
  .mal,
  &.mal {
    color: #dc2626;
  }
  .variante {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .fotos {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 4px;
    img {
      width: 64px;
      height: 64px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid ${({ theme }) => theme.color2};
    }
  }
  table {
    width: 100%;
    border-collapse: collapse;
    th {
      text-align: left;
      font-size: 11px;
      opacity: 0.6;
      padding: 4px 6px;
    }
    td {
      padding: 4px 6px;
      border-top: 1px solid ${({ theme }) => theme.color2};
    }
    tr.sospechoso td {
      color: #dc2626;
      font-weight: 700;
    }
  }
`;
