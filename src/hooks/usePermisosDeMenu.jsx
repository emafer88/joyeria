import { useQuery } from "@tanstack/react-query";
import { usePermisosStore } from "../store/PermisosStore";
import { useUsuariosStore } from "../store/UsuariosStore";

// Rutas que cualquier usuario logueado puede ver sin necesitar un permiso
// específico (son de su propia cuenta, no de un módulo de negocio).
// La usa también ProtectedRoute.jsx para no bloquear el acceso directo.
export const RUTAS_SIN_PERMISO = ["/miperfil"];

// Da la info necesaria para decidir qué mostrar en el menú (Sidebar /
// MenuMovil) según los permisos reales del usuario logueado, en vez de
// mostrar siempre todos los links de forma fija.
export function usePermisosDeMenu() {
  const { datausuarios } = useUsuariosStore();
  const { mostrarPermisosGlobales } = usePermisosStore();
  const esSuperAdmin = datausuarios?.roles?.nombre === "superadmin";

  const { data: dataPermisosGlobales } = useQuery({
    queryKey: ["mostrar permisos globales", datausuarios?.id],
    queryFn: () => mostrarPermisosGlobales({ id_usuario: datausuarios?.id }),
    enabled: !!datausuarios?.id,
  });

  const puedeVer = (to) =>
    esSuperAdmin ||
    RUTAS_SIN_PERMISO.includes(to) ||
    !!dataPermisosGlobales?.some((item) => item.modulos?.link === to);

  return { esSuperAdmin, puedeVer };
}
