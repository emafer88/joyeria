import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Toaster } from "sonner";
import { Btn1 } from "../components/moleculas/Btn1";
import { ListaBanners } from "../components/organismos/banners/ListaBanners";
import { FormBanner } from "../components/organismos/banners/FormBanner";
import { useBannersStore } from "../store/BannersStore";
import { useBannersQuery } from "../tanstack/BannersStack";
import { useEmpresaStore } from "../store/EmpresaStore";
import { useGuardarDisenoTiendaMutation } from "../tanstack/EmpresaStack";
import {
  DISENO_FABRICA,
  ICONOS_BENEFICIO,
  PALETAS_TIENDA,
  SECCIONES,
  TIENDA_URL,
  completarDiseno,
  esUrlValida,
} from "../utils/disenoTienda";

const PESTANAS = ["Secciones", "Banners", "Textos", "Colores", "Contacto"];

// Configuración → Diseño de la tienda. A la derecha, la tienda real en un
// iframe: cada cambio se le manda como borrador (postMessage) y solo se
// publica al guardar.
export const ConfiguracionTienda = () => {
  const { dataempresa } = useEmpresaStore();
  const { mutate, isPending } = useGuardarDisenoTiendaMutation();

  const guardado = useMemo(
    () => completarDiseno(dataempresa?.diseno_tienda),
    [dataempresa?.diseno_tienda]
  );
  const [diseno, setDiseno] = useState(guardado);
  const [pestana, setPestana] = useState(PESTANAS[0]);

  useEffect(() => setDiseno(guardado), [guardado]);

  const sinCambios = JSON.stringify(diseno) === JSON.stringify(guardado);
  const urlsInvalidas = ["instagram", "facebook", "tiktok"].filter(
    (k) => !esUrlValida(diseno.contacto[k].trim())
  );

  const cambiar = (parte, valor) => setDiseno((d) => ({ ...d, [parte]: valor }));

  const guardar = () => {
    const limpio = {
      ...diseno,
      contacto: Object.fromEntries(
        Object.entries(diseno.contacto).map(([k, val]) => [k, val.trim()])
      ),
    };
    limpio.contacto.whatsapp = limpio.contacto.whatsapp.replace(/\D/g, "");
    mutate(limpio);
  };

  return (
    <Container>
      <Toaster />
      <header>
        <h1>Diseño de la tienda</h1>
        <p className="ayuda">
          Cambia el orden, los textos, los colores y los datos de contacto de
          tu tienda en línea. La vista previa se actualiza al momento; los
          clientes ven los cambios cuando guardas.
        </p>
      </header>

      <div className="cuerpo">
        <section className="editor">
          <nav className="pestanas" role="tablist">
            {PESTANAS.map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={pestana === p}
                className={pestana === p ? "on" : ""}
                onClick={() => setPestana(p)}
              >
                {p}
              </button>
            ))}
          </nav>

          {pestana === "Secciones" && (
            <EditorSecciones
              secciones={diseno.secciones}
              onChange={(s) => cambiar("secciones", s)}
            />
          )}
          {pestana === "Banners" && <EditorBanners />}
          {pestana === "Textos" && (
            <EditorTextos
              promo={diseno.promo}
              beneficios={diseno.beneficios}
              onPromo={(p) => cambiar("promo", p)}
              onBeneficios={(b) => cambiar("beneficios", b)}
            />
          )}
          {pestana === "Colores" && (
            <EditorColores paleta={diseno.paleta} onChange={(p) => cambiar("paleta", p)} />
          )}
          {pestana === "Contacto" && (
            <EditorContacto
              contacto={diseno.contacto}
              invalidas={urlsInvalidas}
              onChange={(c) => cambiar("contacto", c)}
            />
          )}

          <div className="acciones">
            {sinCambios ? (
              <span className="estado">Todo guardado</span>
            ) : (
              <>
                <Btn1
                  bgcolor="acento"
                  titulo={isPending ? "GUARDANDO..." : "GUARDAR Y PUBLICAR"}
                  disabled={isPending || urlsInvalidas.length > 0}
                  type="button"
                  funcion={guardar}
                />
                <button type="button" className="enlace" onClick={() => setDiseno(guardado)}>
                  Descartar cambios
                </button>
              </>
            )}
            <button
              type="button"
              className="enlace secundario"
              onClick={() => setDiseno(completarDiseno(DISENO_FABRICA))}
            >
              Restaurar valores de fábrica
            </button>
          </div>
          {urlsInvalidas.length > 0 && (
            <p className="error">
              Revisa los enlaces de redes en la pestaña Contacto: deben empezar con https://
            </p>
          )}
        </section>

        <VistaPreviaTienda diseno={diseno} />
      </div>
    </Container>
  );
};

function EditorSecciones({ secciones, onChange }) {
  const mover = (i, delta) => {
    const j = i + delta;
    if (j < 0 || j >= secciones.length) return;
    const nuevas = [...secciones];
    [nuevas[i], nuevas[j]] = [nuevas[j], nuevas[i]];
    onChange(nuevas);
  };
  const editar = (i, campo, valor) =>
    onChange(secciones.map((s, k) => (k === i ? { ...s, [campo]: valor } : s)));

  return (
    <div className="lista">
      <p className="ayuda">Orden de la página de inicio, de arriba hacia abajo.</p>
      {secciones.map((s, i) => {
        const info = SECCIONES[s.id];
        return (
          <article key={s.id} className={s.visible ? "seccion" : "seccion oculta"}>
            <div className="fila">
              <div className="orden">
                <button
                  type="button"
                  aria-label={`Subir ${info.nombre}`}
                  disabled={i === 0}
                  onClick={() => mover(i, -1)}
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label={`Bajar ${info.nombre}`}
                  disabled={i === secciones.length - 1}
                  onClick={() => mover(i, 1)}
                >
                  ▼
                </button>
              </div>
              <strong>{info.nombre}</strong>
              <label className="interruptor">
                <input
                  type="checkbox"
                  checked={s.visible}
                  onChange={(e) => editar(i, "visible", e.target.checked)}
                />
                <span>{s.visible ? "Visible" : "Oculta"}</span>
              </label>
            </div>
            {s.visible && (info.conTitulo || info.conSubtitulo || info.nota) && (
              <div className="campos">
                {info.conTitulo && (
                  <Campo
                    etiqueta="Título"
                    valor={s.titulo}
                    onChange={(v) => editar(i, "titulo", v)}
                  />
                )}
                {info.conSubtitulo && (
                  <Campo
                    etiqueta="Subtítulo"
                    valor={s.subtitulo}
                    onChange={(v) => editar(i, "subtitulo", v)}
                  />
                )}
                {info.nota && <p className="nota">{info.nota}</p>}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

// Los banners viven en su propia tabla: se publican al guardar cada uno, no
// con el botón de abajo.
function EditorBanners() {
  const { modal, cerrarModal, abrirModal, setBannerSelect } = useBannersStore();

  const nuevoBanner = () => {
    setBannerSelect(null);
    abrirModal("form", "Nuevo");
  };

  return (
    <div className="lista">
      {modal === "form" && <FormBanner onClose={cerrarModal} />}
      <p className="ayuda">
        Imágenes que rotan en el banner principal. Cada banner se publica en
        cuanto lo guardas o lo eliminas; no depende del botón de abajo.
      </p>
      <ListaBanners />
      <button type="button" className="agregar" onClick={nuevoBanner}>
        + Nuevo banner
      </button>
    </div>
  );
}

function EditorTextos({ promo, beneficios, onPromo, onBeneficios }) {
  const editarBeneficio = (i, campo, valor) =>
    onBeneficios(beneficios.map((b, k) => (k === i ? { ...b, [campo]: valor } : b)));

  return (
    <div className="lista">
      <h3>Aviso de promoción</h3>
      <p className="ayuda">Se muestra en lugar de “Ofertas” cuando no hay productos en oferta.</p>
      <Campo etiqueta="Etiqueta" valor={promo.etiqueta} onChange={(v) => onPromo({ ...promo, etiqueta: v })} />
      <Campo etiqueta="Título" valor={promo.titulo} onChange={(v) => onPromo({ ...promo, titulo: v })} />
      <Campo etiqueta="Texto" valor={promo.texto} onChange={(v) => onPromo({ ...promo, texto: v })} />
      <Campo etiqueta="Botón" valor={promo.boton} onChange={(v) => onPromo({ ...promo, boton: v })} />

      <h3>Beneficios</h3>
      <p className="ayuda">Hasta 4. Los que queden sin título ni texto no se muestran.</p>
      {beneficios.map((b, i) => (
        <article key={i} className="seccion">
          <div className="fila">
            <label className="campo-inline">
              Ícono
              <select value={b.icono} onChange={(e) => editarBeneficio(i, "icono", e.target.value)}>
                {ICONOS_BENEFICIO.map((ic) => (
                  <option key={ic.id} value={ic.id}>
                    {ic.nombre}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="enlace peligro"
              onClick={() => onBeneficios(beneficios.filter((_, k) => k !== i))}
            >
              Quitar
            </button>
          </div>
          <div className="campos">
            <Campo etiqueta="Título" valor={b.titulo} onChange={(v) => editarBeneficio(i, "titulo", v)} />
            <Campo etiqueta="Texto" valor={b.texto} onChange={(v) => editarBeneficio(i, "texto", v)} />
          </div>
        </article>
      ))}
      {beneficios.length < 4 && (
        <button
          type="button"
          className="agregar"
          onClick={() => onBeneficios([...beneficios, { icono: "diamante", titulo: "", texto: "" }])}
        >
          + Agregar beneficio
        </button>
      )}
    </div>
  );
}

const GRUPOS_PALETA = [
  { titulo: "Oscuras", claro: false },
  { titulo: "Claras", claro: true },
];

function EditorColores({ paleta, onChange }) {
  return (
    <div className="lista">
      <p className="ayuda">Colores de botones, precios, bordes y fondo de la tienda.</p>
      {GRUPOS_PALETA.map((g) => (
        <div key={g.titulo}>
          <h3 className="grupo">{g.titulo}</h3>
          <div className="paletas" role="radiogroup" aria-label={`Paletas ${g.titulo.toLowerCase()}`}>
            {PALETAS_TIENDA.filter((p) => !!p.claro === g.claro).map((p) => (
              <button
                key={p.id}
                type="button"
                role="radio"
                aria-checked={paleta === p.id}
                className={paleta === p.id ? "paleta activa" : "paleta"}
                onClick={() => onChange(p.id)}
              >
                <span className={p.claro ? "muestra clara" : "muestra"} style={{ background: p.fondo }}>
                  <i style={{ background: p.principal }} />
                  <i style={{ background: p.secundario }} />
                </span>
                <span>{p.nombre}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const CAMPOS_CONTACTO = [
  { k: "nombre", etiqueta: "Nombre de la tienda" },
  { k: "descripcion", etiqueta: "Descripción (pie de página)" },
  { k: "telefono", etiqueta: "Teléfono" },
  { k: "whatsapp", etiqueta: "WhatsApp (con lada, ej. 5215512345678)" },
  { k: "email", etiqueta: "Correo" },
  { k: "direccion", etiqueta: "Dirección" },
  { k: "instagram", etiqueta: "Instagram (enlace)", placeholder: "https://instagram.com/tu-tienda" },
  { k: "facebook", etiqueta: "Facebook (enlace)", placeholder: "https://facebook.com/tu-tienda" },
  { k: "tiktok", etiqueta: "TikTok (enlace)", placeholder: "https://tiktok.com/@tu-tienda" },
];

function EditorContacto({ contacto, invalidas, onChange }) {
  return (
    <div className="lista">
      <p className="ayuda">Aparecen en el pie de página y en la sección de redes. Deja vacío lo que no quieras mostrar.</p>
      {CAMPOS_CONTACTO.map(({ k, etiqueta, placeholder }) => (
        <Campo
          key={k}
          etiqueta={etiqueta}
          valor={contacto[k]}
          placeholder={placeholder}
          error={invalidas.includes(k) ? "Debe empezar con https://" : null}
          onChange={(v) => onChange({ ...contacto, [k]: v })}
        />
      ))}
    </div>
  );
}

function Campo({ etiqueta, valor, onChange, placeholder, error }) {
  return (
    <label className="campo">
      <span>{etiqueta}</span>
      <input
        value={valor}
        maxLength={200}
        placeholder={placeholder}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <small className="error">{error}</small>}
    </label>
  );
}

const ANCHO_ESCRITORIO = 1280;

function VistaPreviaTienda({ diseno }) {
  const iframe = useRef(null);
  const caja = useRef(null);
  // En pantallas angostas la tienda de escritorio escalada no se lee.
  const [modo, setModo] = useState(() =>
    window.innerWidth < 900 ? "celular" : "escritorio"
  );
  const [ancho, setAncho] = useState(600);
  const origen = useMemo(() => new URL(TIENDA_URL).origin, []);
  const { dataUpdatedAt: bannersAl } = useBannersQuery();
  const primeraCarga = useRef(true);

  const enviar = () =>
    iframe.current?.contentWindow?.postMessage({ tipo: "cubiks-diseno", diseno }, origen);

  // La tienda avisa cuando está lista para recibir el borrador.
  useEffect(() => {
    const listo = (e) => {
      if (e.origin === origen && e.data?.tipo === "cubiks-diseno-listo") enviar();
    };
    window.addEventListener("message", listo);
    return () => window.removeEventListener("message", listo);
  });

  useEffect(() => {
    const t = setTimeout(enviar, 200);
    return () => clearTimeout(t);
  }, [diseno]);

  // Los banners no viajan en el borrador: al cambiar alguno se recarga la
  // tienda para que los vuelva a leer.
  useEffect(() => {
    if (!bannersAl) return;
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    if (iframe.current) iframe.current.src = TIENDA_URL;
  }, [bannersAl]);

  useEffect(() => {
    if (!caja.current) return;
    const obs = new ResizeObserver(([e]) => setAncho(e.contentRect.width));
    obs.observe(caja.current);
    return () => obs.disconnect();
  }, []);

  const escala = modo === "escritorio" ? Math.min(1, ancho / ANCHO_ESCRITORIO) : 1;
  const alto = 640;

  return (
    <section className="previa">
      <div className="barra">
        <h2>Vista previa</h2>
        <div className="modos" role="group" aria-label="Tamaño de la vista previa">
          {["escritorio", "celular"].map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={modo === m}
              className={modo === m ? "on" : ""}
              onClick={() => setModo(m)}
            >
              {m === "escritorio" ? "Escritorio" : "Celular"}
            </button>
          ))}
        </div>
        <a href={TIENDA_URL} target="_blank" rel="noreferrer" className="abrir">
          Abrir tienda ↗
        </a>
      </div>
      <div ref={caja} className="marco" style={{ height: alto }}>
        <iframe
          ref={iframe}
          title="Vista previa de la tienda"
          src={TIENDA_URL}
          onLoad={enviar}
          style={
            modo === "escritorio"
              ? {
                  width: ANCHO_ESCRITORIO,
                  height: alto / escala,
                  transform: `scale(${escala})`,
                  transformOrigin: "0 0",
                }
              : { width: Math.min(390, ancho), height: alto, margin: "0 auto", display: "block" }
          }
        />
      </div>
    </section>
  );
}

const Container = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  color: ${({ theme }) => theme.text};
  h1 {
    font-size: 24px;
    margin-bottom: 6px;
  }
  h2 {
    font-size: 15px;
    margin: 0;
    opacity: 0.8;
  }
  h3 {
    font-size: 15px;
    margin: 16px 0 0;
  }
  .ayuda {
    color: ${({ theme }) => theme.colorSubtitle};
    font-size: 13px;
    margin: 0 0 14px;
  }
  .cuerpo {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    @media (min-width: 1100px) {
      grid-template-columns: minmax(360px, 420px) minmax(0, 1fr);
      align-items: start;
    }
  }
  .pestanas {
    display: flex;
    gap: 16px;
    border-bottom: 1px solid ${({ theme }) => theme.color2};
    margin-bottom: 14px;
    overflow-x: auto;
    button {
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      padding: 8px 2px;
      font: inherit;
      font-weight: 600;
      color: ${({ theme }) => theme.text};
      opacity: 0.55;
      cursor: pointer;
      white-space: nowrap;
    }
    .on {
      opacity: 1;
      border-bottom-color: ${({ theme }) => theme.acentoLinea};
    }
  }
  .lista {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .seccion {
    border: 1px solid ${({ theme }) => theme.bordercolorDash};
    background: ${({ theme }) => theme.bgcards};
    border-radius: 12px;
    padding: 10px 12px;
  }
  .seccion.oculta strong {
    opacity: 0.45;
  }
  .fila {
    display: flex;
    align-items: center;
    gap: 10px;
    strong {
      flex: 1;
      font-size: 14px;
    }
  }
  .orden {
    display: flex;
    flex-direction: column;
    button {
      background: none;
      border: 1px solid ${({ theme }) => theme.color2};
      color: ${({ theme }) => theme.text};
      border-radius: 6px;
      width: 28px;
      height: 20px;
      font-size: 10px;
      line-height: 1;
      cursor: pointer;
      &:disabled {
        opacity: 0.3;
        cursor: default;
      }
    }
  }
  .interruptor {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    cursor: pointer;
    input {
      width: 16px;
      height: 16px;
      accent-color: ${({ theme }) => theme.acentoLinea};
    }
  }
  .campos {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
  }
  .campo {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    span {
      opacity: 0.75;
    }
    input {
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid ${({ theme }) => theme.color2};
      background: ${({ theme }) => theme.body};
      color: ${({ theme }) => theme.text};
      font: inherit;
      font-size: 14px;
      &[aria-invalid="true"] {
        border-color: #e53935;
      }
    }
  }
  .campo-inline {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    flex: 1;
    select {
      padding: 6px 8px;
      border-radius: 8px;
      border: 1px solid ${({ theme }) => theme.color2};
      background: ${({ theme }) => theme.body};
      color: ${({ theme }) => theme.text};
    }
  }
  .nota {
    font-size: 12px;
    margin: 0;
    color: ${({ theme }) => theme.colorSubtitle};
  }
  .error {
    color: #e53935;
    font-size: 12px;
  }
  .agregar {
    align-self: flex-start;
    background: none;
    border: 1px dashed ${({ theme }) => theme.acentoLinea};
    color: ${({ theme }) => theme.text};
    border-radius: 10px;
    padding: 8px 14px;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
  }
  .paletas {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 10px;
  }
  .paleta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    border-radius: 12px;
    border: 2px solid ${({ theme }) => theme.color2};
    background: ${({ theme }) => theme.bgcards};
    color: ${({ theme }) => theme.text};
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    &.activa {
      border-color: ${({ theme }) => theme.text};
      box-shadow: 0 0 0 1px ${({ theme }) => theme.text};
    }
  }
  .grupo {
    margin: 4px 0 8px;
    font-size: 13px;
    opacity: 0.75;
  }
  .muestra.clara {
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
  }
  .muestra {
    display: flex;
    gap: 6px;
    padding: 10px;
    border-radius: 8px;
    i {
      width: 22px;
      height: 22px;
      border-radius: 50%;
    }
  }
  .acciones {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    margin-top: 20px;
  }
  .estado {
    font-size: 14px;
    color: ${({ theme }) => theme.colorSubtitle};
  }
  .enlace {
    background: none;
    border: none;
    padding: 0;
    color: ${({ theme }) => theme.text};
    text-decoration: underline;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    &.secundario {
      opacity: 0.65;
    }
    &.peligro {
      color: #e53935;
    }
  }
  .previa {
    position: sticky;
    top: 70px;
  }
  .barra {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 10px;
    h2 {
      flex: 1;
    }
  }
  .modos {
    display: flex;
    border: 1px solid ${({ theme }) => theme.color2};
    border-radius: 10px;
    overflow: hidden;
    button {
      background: none;
      border: none;
      padding: 6px 12px;
      font: inherit;
      font-size: 13px;
      color: ${({ theme }) => theme.text};
      cursor: pointer;
    }
    .on {
      background: ${({ theme }) => theme.acento};
      color: ${({ theme }) => theme.acentoTexto};
      font-weight: 600;
    }
  }
  .abrir {
    font-size: 13px;
    color: ${({ theme }) => theme.text};
  }
  .marco {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.bordercolorDash};
    background: #0b0a10;
    iframe {
      border: 0;
    }
  }
`;
