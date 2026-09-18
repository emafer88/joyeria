import { Spinner1 } from "../components/moleculas/Spinner1";
import { CrudTemplate } from "../components/template/CrudTemplate";
import { TablaPedidosEcommerce } from "../components/organismos/tablas/TablaPedidosEcommerce";
import { useMostrarPedidosEcommerceQuery } from "../tanstack/PedidosEcommerceStack";

export const PedidosEcommerce = () => {
  const { data, isLoading, error } = useMostrarPedidosEcommerceQuery();

  if (isLoading) {
    return <Spinner1 />;
  }
  if (error) {
    return <span>error...{error.message} </span>;
  }
  return (
    <CrudTemplate
      data={data}
      title="Pedidos"
      Tabla={<TablaPedidosEcommerce data={data} />}
    />
  );
};
