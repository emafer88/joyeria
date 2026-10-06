import { Navigate, useLocation } from "react-router-dom";
import { UserAuth } from "../context/AuthContent";
import { usePermisosStore } from "../store/PermisosStore";
import { useQuery } from "@tanstack/react-query";
import { useUsuariosStore } from "../store/UsuariosStore";
import { RUTAS_SIN_PERMISO } from "./usePermisosDeMenu";
import { useLicencia } from "./useLicencia";

export const ProtectedRoute = ({ children, accessBy }) => {
  const { user } = UserAuth();
  const { mostrarPermisosGlobales } = usePermisosStore();
  const location = useLocation();
  const { datausuarios } = useUsuariosStore();
  const { rutaPermitida, isLoading: isLoadingLicencia } = useLicencia();

  const {
    data: dataPermisosGlobales,
    isLoading: isLoadingPermisosGlobales,
    error: errorPermisosGlobales,
  } = useQuery({
    queryKey: ["mostrar permisos globales", datausuarios?.id],
    queryFn: () => mostrarPermisosGlobales({ id_usuario: datausuarios?.id }),
    enabled: !!datausuarios?.id,
  });
  if (user === undefined) {
    // Todavía no se confirmó si hay sesión o no (Supabase no respondió aún):
    // no decidir ninguna redirección todavía para no rebotar de más.
    return <span>cargando...</span>;
  }
  if (isLoadingPermisosGlobales || isLoadingLicencia) {
    return <span>cargando permisos...</span>;
  }
  const esSuperAdmin = datausuarios?.roles?.nombre === "superadmin";
  // Lo que el plan de la joyería no incluye no lo ve nadie, ni el superadmin.
  const hasPermission =
    rutaPermitida(location.pathname) &&
    (esSuperAdmin ||
      RUTAS_SIN_PERMISO.includes(location.pathname) ||
      dataPermisosGlobales?.some((item) => {
        const link = item.modulos?.link;
        if (!link) return false;
        // "/reportes" tiene subpáginas (/reportes/report_ventas, etc.) que
        // comparten el mismo permiso del módulo padre.
        return (
          location.pathname === link ||
          (link === "/reportes" && location.pathname.startsWith("/reportes/"))
        );
      }));

  if (accessBy === "non-authenticated") {
    if (!user) {
      console.log("no hay usuario");
      return children;
    } else {
      return <Navigate to="/" />;
    }
  } else if (accessBy === "authenticated") {
    if (user) {
      if (!hasPermission) {
        return <Navigate to="/404" />;
      }

      return children;
    }
  }
  return <Navigate to="/login" />;
};
