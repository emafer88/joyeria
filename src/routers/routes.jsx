import { Routes, Route, Navigate } from "react-router-dom";
import {
  Categorias,
  Configuraciones,
  Login,
  AdminLogin,
  InicioPublico,
  Productos,
  ProtectedRoute,
  POS,
  Layout,
  PageNot,
  Empresa,
  ClientesProveedores,
} from "../index";
import { UserAuth } from "../context/AuthContent";
import { useUsuariosStore } from "../store/UsuariosStore";
import { BasicosConfig } from "../components/organismos/EmpresaConfigDesign/BasicosConfig";
import { MonedaConfig } from "../components/organismos/EmpresaConfigDesign/MonedaConfig";
import { MetodosPago } from "../pages/MetodosPago";
import { Dashboard } from "../pages/Dashboard";
import { SucursalesCaja } from "../pages/SucursalesCaja";
import { Impresoras } from "../pages/Impresoras";
import { Usuarios } from "../pages/Usuarios";
import { Almacenes } from "../pages/Almacenes";
import { ConfiguracionTicket } from "../pages/ConfiguracionTicket";
import { MiPerfil } from "../pages/MiPerfil";
import { SerializacionComprobantes } from "../pages/SerializacionComprobantes";
import { Reportes } from "../pages/Reportes";
import { ReportInventarios } from "../components/organismos/reports/ReportInventarios";
import ReportVentas from "../components/organismos/reports/ReportVentas";
import ReportStockBajoMinimo from "../components/organismos/reports/ReportStockBajoMinimo";

// "/" es pública: a un visitante sin sesión le muestra la home con el botón
// "Iniciar sesión". A un usuario ya logueado lo manda directo a su pantalla
// principal según el rol: superadmin -> /dashboard, cualquier otro -> /pos.
function HomeRoute() {
  const { user } = UserAuth();
  if (user === undefined) {
    return <span>cargando...</span>;
  }
  if (user) {
    return (
      <Layout>
        <RedirigirSegunRol />
      </Layout>
    );
  }
  return <InicioPublico />;
}

// Se monta dentro de <Layout>, que ya esperó a que datausuarios esté
// resuelto antes de renderizar hijos, así que acá el rol ya está disponible.
function RedirigirSegunRol() {
  const { datausuarios } = useUsuariosStore();
  const esSuperAdmin = datausuarios?.roles?.nombre === "superadmin";
  return <Navigate to={esSuperAdmin ? "/dashboard" : "/pos"} replace />;
}

export function MyRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <ProtectedRoute accessBy="non-authenticated">
            <Login />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute accessBy="non-authenticated">
            <AdminLogin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/configuracion"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <Configuraciones />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/miperfil"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <MiPerfil />
            </ProtectedRoute>
          </Layout>
        }
      />
      
      {/* "Inventario" ahora vive dentro de Configuración > Productos como sub-pestaña. */}
      <Route
        path="/inventario"
        element={<Navigate to="/configuracion/productos" replace />}
      />
       <Route
        path="/reportes"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <Reportes />
            </ProtectedRoute>
          </Layout>
        }
      >
        <Route index element={<Navigate to="inventario_valorado" replace />} />
        <Route path="inventario_valorado" element={<ReportInventarios/>}  />
        <Route path="report_ventas" element={<ReportVentas/>}  />
         <Route path="report_stock_bajo_minimo" element={<ReportStockBajoMinimo />} />
      </Route>
      <Route
        path="/configuracion/categorias"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <Categorias />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/configuracion/serializacion"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <SerializacionComprobantes />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/configuracion/ticket"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <ConfiguracionTicket />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/configuracion/productos"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <Productos />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/configuracion/empresa"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <Empresa />
            </ProtectedRoute>
          </Layout>
        }
      >
        <Route index element={<Navigate to="empresabasicos" />} />
        <Route path="empresabasicos" element={<BasicosConfig />} />
        <Route path="monedaconfig" element={<MonedaConfig />} />
      </Route>
      <Route
        path="/pos"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <POS />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route path="*" element={<PageNot />} />
      <Route
        path="/configuracion/clientes"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <ClientesProveedores />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/configuracion/proveedores"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <ClientesProveedores />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/configuracion/metodospago"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <MetodosPago />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route path="/" element={<HomeRoute />} />
      <Route
        path="/dashboard"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <Dashboard />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/configuracion/sucursalcaja"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <SucursalesCaja />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/configuracion/impresoras"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <Impresoras />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/configuracion/usuarios"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <Usuarios />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/configuracion/almacenes"
        element={
          <Layout>
            <ProtectedRoute accessBy="authenticated">
              <Almacenes />
            </ProtectedRoute>
          </Layout>
        }
      />
    </Routes>
  );
}
