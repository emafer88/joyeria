import styled from "styled-components";

// Atributos obligatorios por categoría de ML (consultados en la API, ver
// README de joyeria-mercadolibre). SIZE no va acá: ml-sincronizar lo agrega
// por pieza desde piezas_inventario.talla. SELLER_SKU también es automático.
export const CATEGORIAS_ML = {
  MLM457416: {
    label: "Collares y cadenas",
    atributos: [
      { id: "BRAND", label: "Marca", defecto: "Genérica" },
      { id: "MODEL", label: "Modelo" },
      { id: "NECKLACE_STYLES", label: "Estilo", defecto: "Cadena" },
      { id: "GENDER", label: "Género", defecto: "Sin género", opciones: ["Mujer", "Hombre", "Sin género"] },
    ],
  },
  MLM1438: {
    label: "Anillos",
    atributos: [
      { id: "BRAND", label: "Marca", defecto: "Genérica" },
      { id: "MODEL", label: "Modelo" },
      { id: "MATERIAL", label: "Material", defecto: "Oro" },
    ],
  },
  MLM1432: {
    label: "Aretes",
    atributos: [
      { id: "BRAND", label: "Marca", defecto: "Genérica" },
      { id: "MODEL", label: "Modelo" },
      { id: "MATERIAL", label: "Material", defecto: "Oro" },
      { id: "WITH_GEMSTONE", label: "Con piedra", defecto: "No", opciones: ["Sí", "No"] },
    ],
  },
};

export const ESTADOS_PUBLICACION = {
  active: { label: "Activa", color: "#16a34a" },
  paused: { label: "Pausada", color: "#d97706" },
  closed: { label: "Cerrada", color: "#6b7280" },
  under_review: { label: "En revisión", color: "#dc2626" },
  inactive: { label: "Cerrándose", color: "#6b7280" },
};

export const ESTADOS_ORDEN = {
  paid: { label: "Pagada", color: "#16a34a" },
  cancelled: { label: "Cancelada", color: "#6b7280" },
  invalid: { label: "Inválida", color: "#6b7280" },
  confirmed: { label: "Sin pagar", color: "#d97706" },
  payment_required: { label: "Sin pagar", color: "#d97706" },
  payment_in_process: { label: "Pago en proceso", color: "#0284c7" },
};

export const linkPublicacion = (mlItemId) =>
  `https://articulo.mercadolibre.com.mx/${mlItemId.replace(/^MLM/, "MLM-")}`;

// Detalle de la venta en la web del vendedor: se identifica por el pack
// ("Venta #...") y, si la orden no tiene pack, por su propio id.
export const linkOrden = (orden) =>
  `https://www.mercadolibre.com.mx/ventas/${orden.pack_id ?? orden.ml_order_id}/detalle`;

export const formatoFecha =(valor) =>
  valor
    ? new Date(valor).toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

export const formatoPrecio = (valor) =>
  valor == null ? "-" : `$ ${Number(valor).toLocaleString("es-MX")}`;

export function Chip({ estado, estados }) {
  const { label, color } = estados[estado] ?? { label: estado ?? "-", color: "#6b7280" };
  return <ChipStyled $color={color}>{label}</ChipStyled>;
}

const ChipStyled = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid ${(p) => p.$color};
  background: ${(p) => p.$color}22;
  color: ${(p) => p.$color};
  font-weight: 700;
  font-size: 11.5px;
  white-space: nowrap;
`;

export const TablaML = styled.div`
  overflow-x: auto;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.color2};
  background: ${({ theme }) => theme.bg};
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
  }
  thead th {
    text-align: left;
    padding: 14px 16px;
    font-weight: 700;
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    opacity: 0.6;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    white-space: nowrap;
  }
  tbody tr:not(:last-child) td {
    border-bottom: 1px solid ${({ theme }) => theme.color2};
  }
  tbody tr:hover {
    background: ${({ theme }) => theme.bgAlpha};
  }
  td {
    padding: 12px 16px;
    vertical-align: middle;
  }
  .principal {
    font-weight: 600;
    text-transform: capitalize;
  }
  .suave {
    font-size: 12px;
    opacity: 0.6;
  }
  .monto {
    font-weight: 700;
    color: #f88533;
    white-space: nowrap;
  }
  .error {
    margin-top: 4px;
    font-size: 12px;
    color: #dc2626;
    white-space: normal;
    max-width: 420px;
  }
  .vacio {
    text-align: center;
    padding: 30px;
    opacity: 0.6;
  }
  a {
    color: #0284c7;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    &:hover {
      text-decoration: underline;
    }
  }
`;

export const BtnPastilla = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.color2};
  background: transparent;
  color: ${({ theme }) => theme.text};
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: 0.15s ease;
  &:hover:not(:disabled) {
    border-color: #f88533;
    color: #f88533;
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;
