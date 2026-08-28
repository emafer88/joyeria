import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseCrud/supabase.config";
import {
  MostrarUsuarios,
  InsertarEmpresa,
  InsertarAdmin,
  MostrarTipoDocumentos,
  MostrarRolesXnombre,
} from "../index";
import Swal from "sweetalert2";

const AuthContext = createContext();
export const AuthContextProvider = ({ children }) => {
  // undefined = todavía no se sabe si hay sesión (esperando a Supabase);
  // null = confirmado que no hay sesión; objeto = usuario logueado.
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session == null) {
        setUser(null);
      } else {
        setUser(session?.user);

        insertarDatos(session?.user.id, session?.user.email);
      }
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);
  const insertarDatos = async (id_auth, correo) => {
    const response = await MostrarUsuarios({ id_auth: id_auth });
    if (response) {
      return;
    } else {
      await InsertarEmpresa({ id_auth: id_auth, correo: correo });
    }
  };

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};
export const UserAuth = () => {
  return useContext(AuthContext);
};
