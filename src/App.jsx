import styled, { ThemeProvider } from "styled-components";
import {
  AuthContextProvider,
  Dark,
  GlobalStyles,
  Light,
  MyRoutes,
  useEmpresaStore,
  useThemeStore,
  useUsuariosStore,
} from "./index";
import { aplicarPaleta } from "./styles/paletas";
import { Device } from "./styles/breakpoints";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useLicencia } from "./hooks/useLicencia";
import { CuentaSuspendida } from "./pages/CuentaSuspendida";

function App() {
  const { setTheme } = useThemeStore();
  const { datausuarios } = useUsuariosStore();
  const { dataempresa } = useEmpresaStore();
  const location = useLocation();
  const { suspendida, mensajeSuspension } = useLicencia();
  // Claro/oscuro es de cada usuario; la paleta de colores, de la empresa.
  const paleta = dataempresa?.paleta_admin;
  const themeStyle = useMemo(
    () => aplicarPaleta(datausuarios?.tema === "light" ? Light : Dark, paleta),
    [datausuarios?.tema, paleta]
  );
  useEffect(() => {
    if (location.pathname === "/login") {
      setTheme({
        tema: "light",
        style: Light,
      });
    } else {
      if (datausuarios) {
        setTheme({
          tema: datausuarios?.tema,
          style: themeStyle,
        });
      }
    }
  }, [datausuarios, themeStyle]);
  return (
    <ThemeProvider theme={themeStyle}>
      <AuthContextProvider>
        <GlobalStyles />

        {/* Cuenta suspendida por el dueño del sistema: nada de la app
            funciona (la base tampoco deja), solo se muestra el aviso. */}
        {suspendida ? <CuentaSuspendida mensaje={mensajeSuspension} /> : <MyRoutes />}

        <ReactQueryDevtools initialIsOpen={true} />
      </AuthContextProvider>
    </ThemeProvider>
  );
}

export default App;
