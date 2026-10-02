import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseCrud/supabase.config";
import { MostrarUsuarios } from "../index";
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

        verificarAcceso(session?.user.id);
      }
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);
  // Solo entra el personal dado de alta (fila ACTIVA en `usuarios`; RLS no
  // le deja ver la fila a nadie más). Antes acá se creaba una empresa nueva y
  // el trigger insertpordefecto hacía superadmin a cualquier cuenta que
  // entrara; ahora las empresas las da de alta solo el dueño de la plataforma.
  const verificarAcceso = async (id_auth) => {
    const response = await MostrarUsuarios({ id_auth: id_auth });
    // undefined = falló la consulta (red, etc.): no se cierra la sesión por eso.
    if (response !== null) return;
    await supabase.auth.signOut();
    Swal.fire({
      icon: "error",
      title: "Sin acceso",
      text: "Tu cuenta no tiene acceso al panel. Pide al administrador que te dé de alta.",
    });
  };

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};
export const UserAuth = () => {
  return useContext(AuthContext);
};
