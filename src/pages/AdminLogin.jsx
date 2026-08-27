import { LoginTemplate } from "../index";

// Alta/ingreso de super admin (crea una empresa nueva vinculada a la cuenta
// de Google). A propósito no está linkeada desde el login de empleados
// (/login): solo se accede escribiendo /admin directamente en la URL.
export function AdminLogin() {
  return (<LoginTemplate modo="admin" />);
}
