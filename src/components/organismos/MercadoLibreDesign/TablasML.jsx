import { useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
  useDisenosMLQuery,
  useGuardarDisenoMLMutation,
  useOrdenesMLQuery,
  usePublicacionesMLQuery,
} from "../../../tanstack/MercadoLibreStack";
import { FormDisenoML } from "./FormDisenoML";
import {
  BtnPastilla,
  CATEGORIAS_ML,
  Chip,
  ESTADOS_ORDEN,
  ESTADOS_PUBLICACION,
  formatoFecha,
  formatoPrecio,
  linkOrden,
  linkPublicacion,
  TablaML,
} from "./comunes";

function Estado({ isLoading, error }) {
  if (isLoading) return <p className="vacio">Cargando...</p>;
  if (error) return <p className="vacio">Error: {error.message}</p>;
  return null;
}

export function DisenosML() {
  const { data, isLoading, error } = useDisenosMLQuery();
  const { mutate, isPending } = useGuardarDisenoMLMutation();
  // undefined = cerrado, null = diseño nuevo, fila = editar ese diseño.
  const [editando, setEditando] = useState(undefined);

  return (
    <>
      <div className="acciones">
        <BtnPastilla type="button" onClick={() => setEditando(null)}>
          <Icon icon="solar:add-circle-bold" width="18" />
          Publicar otro diseño
        </BtnPastilla>
      </div>
      <TablaML>
        <Estado isLoading={isLoading} error={error} />
        {data && (
          <table>
            <thead>
              <tr>
                <th>Diseño</th>
                <th>Categoría</th>
                <th>Piezas disponibles</th>
                <th>Publicaciones activas</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id_producto}>
                  <td>
                    <div className="principal">{d.nombre}</div>
                    {d.publicaciones_con_error > 0 && (
                      <div className="error">
                        {d.publicaciones_con_error} publicación(es) con error: ver la pestaña Publicaciones
                      </div>
                    )}
                    {d.grupos_sospechosos > 0 && (
                      <div className="error">
                        {d.grupos_sospechosos} grupo(s) con precio sospechoso sin publicar: ver Editar
                      </div>
                    )}
                  </td>
                  <td className="suave">{CATEGORIAS_ML[d.ml_category_id]?.label ?? d.ml_category_id}</td>
                  <td>{d.piezas_disponibles}</td>
                  <td>{d.publicaciones_activas}</td>
                  <td>
                    <Chip
                      estado={d.publicar ? "active" : "paused"}
                      estados={{
                        active: { label: "Publicando", color: "#16a34a" },
                        paused: { label: "Pausado", color: "#6b7280" },
                      }}
                    />
                  </td>
                  <td>
                    <div className="botones">
                      {/* Pausar es inmediato; publicar pasa por el formulario
                          para revisar la vista previa (fotos y precios). */}
                      {d.publicar ? (
                        <BtnPastilla
                          type="button"
                          disabled={isPending}
                          onClick={() => mutate({ ...d, publicar: false })}
                        >
                          Pausar
                        </BtnPastilla>
                      ) : (
                        <BtnPastilla type="button" onClick={() => setEditando({ ...d, publicar: true })}>
                          Publicar
                        </BtnPastilla>
                      )}
                      <BtnPastilla type="button" onClick={() => setEditando(d)}>
                        Editar
                      </BtnPastilla>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {data?.length === 0 && <p className="vacio">Todavía no hay diseños publicados en Mercado Libre.</p>}
      </TablaML>
      {editando !== undefined && <FormDisenoML diseno={editando} onClose={() => setEditando(undefined)} />}
    </>
  );
}

export function PublicacionesML() {
  const { data, isLoading, error } = usePublicacionesMLQuery();
  return (
    <TablaML>
      <Estado isLoading={isLoading} error={error} />
      {data && (
        <table>
          <thead>
            <tr>
              <th>Publicación</th>
              <th>Estado</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Sincronizada</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="principal">{p.nombre}</div>
                  <div className="suave">{p.modelo}</div>
                  {p.ultimo_error && <div className="error">{p.ultimo_error}</div>}
                </td>
                <td>
                  {p.estado_ml ? (
                    <Chip estado={p.estado_ml} estados={ESTADOS_PUBLICACION} />
                  ) : (
                    <span className="suave">Creándose</span>
                  )}
                </td>
                <td>{p.cantidad_publicada ?? "-"}</td>
                <td className="monto">{formatoPrecio(p.precio_publicado)}</td>
                <td className="suave">{formatoFecha(p.sincronizado_en)}</td>
                <td>
                  {p.ml_item_id && (
                    <a href={linkPublicacion(p.ml_item_id)} target="_blank" rel="noreferrer">
                      Ver en ML
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data?.length === 0 && <p className="vacio">Todavía no hay publicaciones.</p>}
    </TablaML>
  );
}

export function OrdenesML() {
  const { data, isLoading, error } = useOrdenesMLQuery();
  return (
    <TablaML>
      <Estado isLoading={isLoading} error={error} />
      {data && (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Orden</th>
              <th>Total</th>
              <th>En ML</th>
              <th>Venta</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.map((o) => (
              <tr key={o.ml_order_id}>
                <td className="suave">{formatoFecha(o.created_at)}</td>
                <td>
                  <div className="principal">{o.ml_order_id}</div>
                  <div className="suave">{o.comprador ?? "-"}</div>
                  {o.ultimo_error && <div className="error">{o.ultimo_error}</div>}
                </td>
                <td className="monto">{formatoPrecio(o.total)}</td>
                <td>
                  <Chip estado={o.estado_ml} estados={ESTADOS_ORDEN} />
                </td>
                <td>
                  {o.nro_comprobante ? (
                    <>
                      <div className="principal">{o.nro_comprobante}</div>
                      <div className="suave">{o.estado_venta}</div>
                    </>
                  ) : (
                    <span className="suave">Sin venta</span>
                  )}
                </td>
                <td>
                  <a href={linkOrden(o)} target="_blank" rel="noreferrer">
                    Ver en ML
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {data?.length === 0 && <p className="vacio">Todavía no hay órdenes de Mercado Libre.</p>}
    </TablaML>
  );
}
