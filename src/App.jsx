import styled, { ThemeProvider } from "styled-components";
import {
  AuthContextProvider,
  Dark,
  GlobalStyles,
  Light,
  MyRoutes,
  useThemeStore,
  useUsuariosStore,
} from "./index";
import { Device } from "./styles/breakpoints";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useLicencia } from "./hooks/useLicencia";
import { CuentaSuspendida } from "./pages/CuentaSuspendida";

function App() {
  const { setTheme } = useThemeStore();
  const { datausuarios } = useUsuariosStore();
  const location = useLocation();
  const { suspendida, mensajeSuspension } = useLicencia();
  const themeStyle = datausuarios?.tema ==="light"?Light:Dark
  useEffect(() => {
    if (location.pathname === "/login") {
      setTheme({
        tema: "light",
        style: Light,
      });
    } else {
      if (datausuarios) {
        const themeStyle = datausuarios?.tema === "light" ? Light : Dark;
        setTheme({
          tema: datausuarios?.tema,
          style: themeStyle,
        });
      }
    }
  }, [datausuarios]);
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
