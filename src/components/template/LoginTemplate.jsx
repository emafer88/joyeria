import styled from "styled-components";
import {
  Btn1,
  Footer,
  InputText2,
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
    <Container>
      <Toaster />
      <div className="card">
        <ContentLogo>
          <img src={v.logo} />
          <span>CUBIKS JEWELRY</span>
        </ContentLogo>
        {modo === "admin" ? (
          <PanelModo>
            <Title $paddingbottom="40px">Acceso administrador</Title>
            <Btn1
              border="2px"
              funcion={loginGoogle}
              titulo="Google"
              bgcolor="#fff"
              icono={<v.iconogoogle />}
            />
          </PanelModo>
        ) : (
          <PanelModo>
            <Title $paddingbottom="40px">Ingresar</Title>
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
                bgcolor="#1CB0F6"
                color="255,255,255"
                width="100%"
              />
            </form>
          </PanelModo>
        )}
      </div>
      <Footer />
    </Container>
  );
}
const Container = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  flex-direction: column;
  padding: 0 10px;
  color: ${({ theme }) => theme.text};
  .card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    width: 100%;
    margin: 20px;
    @media ${Device.tablet} {
      width: 400px;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  }
`;
const ContentLogo = styled.section`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px;
  span {
    font-weight: 700;
  }
  img {
    width: 10%;
  }
`;
const PanelModo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
