import { css } from "styled-components";

// En pantallas menores a tablet cada fila de la tabla se muestra como tarjeta:
// la celda .celda-principal va arriba sin etiqueta, las celdas con data-title
// muestran la etiqueta a la izquierda y el valor a la derecha, y la celda
// .celda-acciones (botones/links) queda abajo a la derecha.
// Se aplica dentro del contenedor que tiene el <table>.
export const tablaTarjetasMovil = css`
  @media (max-width: 767.98px) {
    table,
    tbody {
      display: block;
      width: 100%;
    }
    thead {
      display: none;
    }
    tbody tr {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 14px 16px;
    }
    tbody tr:not(:last-child) {
      border-bottom: 1px solid ${({ theme }) => theme.color2};
    }
    tbody tr td {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 0;
      border: none !important;
      white-space: normal;
      text-align: right;
    }
    td[data-title]::before {
      content: attr(data-title);
      flex-shrink: 0;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: ${({ theme }) => theme.text};
      opacity: 0.6;
      text-align: left;
    }
    /* La etiqueta hereda la opacidad de la celda: en las celdas "suaves" se
       quitaría casi por completo, así que ahí la celda queda opaca. */
    td.suave[data-title] {
      opacity: 1;
    }
    td.celda-principal {
      order: -1;
      display: block;
      text-align: left;
      padding-bottom: 4px;
    }
    td.celda-acciones {
      justify-content: flex-end;
      padding-top: 6px;
    }
    td.celda-acciones:empty {
      display: none;
    }
    .error {
      max-width: none;
    }
  }
`;
