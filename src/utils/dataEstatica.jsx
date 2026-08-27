import { v } from "../styles/variables";
import { AiOutlineHome, AiOutlineSetting } from "react-icons/ai";

export const DesplegableUser = [
  {
    text: "Mi perfil",
    icono: <v.iconoUser />,
    tipo: "miperfil",
  },
  {
    text: "Configuracion",
    icono: <v.iconoSettings />,
    tipo: "configuracion",
  },
  {
    text: "Cerrar sesión",
    icono: <v.iconoCerrarSesion />,
    tipo: "cerrarsesion",
  },
];

//data SIDEBAR
// Sin "Home": ya no se muestra en el menú para ningún rol.
// Para empleados (cualquier rol que no sea "superadmin"), VENDER va primero.
export const getLinksArray = (esSuperAdmin) => {
  const dashboard = {
    label: "Dashboard",
    icon: "fluent-emoji-flat:antenna-bars",
    to: "/dashboard",
  };
  const vender = {
    label: "VENDER",
    icon: "flat-color-icons:shop",
    to: "/pos",
  };
  const inventario = {
    label: "Inventario",
    icon: "flat-ui:box",
    to: "/inventario",
  };
  const reportes = {
    label: "Reportes",
    icon: "flat-ui:graph",
    to: "/reportes",
  };

  return esSuperAdmin
    ? [dashboard, vender, inventario, reportes]
    : [vender, dashboard, inventario, reportes];
};
export const SecondarylinksArray = [
  {
    label: "Configuración",
    icon: "icon-park:setting-two",
    to: "/configuracion",
    color: "#CE82FF",
  },
  {
    label: "Mi perfil",
    icon: "icon-park:avatar",
    to: "/miperfil",
    color: "#CE82FF",
  },
];
//temas
export const TemasData = [
  {
    icono: "🌞",
    descripcion: "light",
  },
  {
    icono: "🌚",
    descripcion: "dark",
  },
];

//data configuracion
export const DataModulosConfiguracion = [
  {
    title: "Productos",
    subtitle: "registra tus productos",
    icono: "https://i.ibb.co/85zJ6yG/caja-del-paquete.png",
    link: "/configurar/productos",
  },
  {
    title: "Personal",
    subtitle: "ten el control de tu personal",
    icono: "https://i.ibb.co/5vgZ0fX/hombre.png",
    link: "/configurar/usuarios",
  },

  {
    title: "Tu empresa",
    subtitle: "configura tus opciones básicas",
    icono: "https://i.ibb.co/x7mHPgm/administracion-de-empresas.png",
    link: "/configurar/empresa",
  },
  {
    title: "Categoria de productos",
    subtitle: "asigna categorias a tus productos",
    icono: "https://i.ibb.co/VYbMRLZ/categoria.png",
    link: "/configuracion/categorias",
  },
  {
    title: "Marca de productos",
    subtitle: "gestiona tus marcas",
    icono: "https://i.ibb.co/1qsbCRb/piensa-fuera-de-la-caja.png",
    link: "/configurar/marca",
  },
];
//tipo usuario
export const TipouserData = [
  {
    descripcion: "empleado",
    icono: "🪖",
  },
  {
    descripcion: "administrador",
    icono: "👑",
  },
];
//tipodoc
export const TipoDocData = [
  {
    descripcion: "Dni",
    icono: "🪖",
  },
  {
    descripcion: "Libreta electoral",
    icono: "👑",
  },
  {
    descripcion: "Otros",
    icono: "👑",
  },
];
