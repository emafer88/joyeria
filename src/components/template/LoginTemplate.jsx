import styled from "styled-components";
import {
  Btn1,
  Footer,
  FondoPublico,
  InputText2,
  MarcaPublica,
  Title,
  useAuthStore,
} from "../../index";
import { v } from "../../styles/variables";
import { Device } from "../../styles/breakpoints";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast, Toaster } from "sonner";

export function LoginTemplate({ modo = "empleado" }) {
  const { loginGoogle, loginEmail } = useAuthStore();

  const { register, handleSubmit } = useForm();
  const { mutate } = useMutation({
    mutationKey: ["iniciar con email"],
    mutationFn: loginEmail,
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  const manejadorEmailSesion = (data) => {
    mutate({ email: data.email, password: data.password });
  };
  return (
    <FondoPublico>
      <Toaster />
      <Container>
        <div className="marca">
          <MarcaPublica />
        </div>
        <Card>
          {modo === "admin" ? (
            <PanelModo>
              <Title $paddingbottom="8px">Acceso administrador</Title>
              <p className="ayuda">Ingresá con tu cuenta de Google para crear o administrar tu empresa.</p>
              <Btn1
                border="2px"
                funcion={loginGoogle}
                titulo="Continuar con Google"
                bgcolor="#fff"
                color="#1a1206"
                icono={<v.iconogoogle />}
                width="100%"
              />
            </PanelModo>
          ) : (
            <PanelModo>
              <Title $paddingbottom="8px">Ingresar</Title>
              <p className="ayuda">Accedé con tu email y contraseña de empleado.</p>
              <form onSubmit={handleSubmit(manejadorEmailSesion)}>
                <InputText2>
                  <input
                    className="form__field"
                    placeholder="email"
                    type="text"
                    {...register("email", { required: true })}
                  />
                </InputText2>
                <InputText2>
                  <input
                    className="form__field"
                    placeholder="contraseña"
                    type="password"
                    {...register("password", { required: true })}
                  />
                </InputText2>
                <Btn1
                  border="2px"
                  titulo="INGRESAR"
                  bgcolor={v.colorPrincipal}
                  color="#1a1206"
                  width="100%"
                />
              </form>
            </PanelModo>
          )}
        </Card>
      </Container>
      <FooterWrap>
        <Footer />
      </FooterWrap>
    </FondoPublico>
  );
}

const Container = styled.div`
  min-height: calc(100vh - 90px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 34px;
  padding: 60px 20px 30px;
  position: relative;
  z-index: 1;
`;

const Card = styled.div`
  width: 100%;
  max-width: 380px;
  padding: 34px 30px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 30px 60px -25px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  text-align: center;
  @media ${Device.tablet} {
    padding: 40px 36px;
  }
`;

const PanelModo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  .ayuda {
    color: rgba(244, 241, 232, 0.65);
    font-size: 13.5px;
    margin: 0 0 14px;
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
`;

const FooterWrap = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px 30px;
`;
