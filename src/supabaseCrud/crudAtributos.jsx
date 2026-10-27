import { supabase } from "../index";

// Atributos de producto (Género, Piedra, ...) con sus valores. Tablas
// atributos / atributo_valores / producto_atributos; las policies dejan leer
// al personal y escribir a quien tiene el módulo de productos.

export async function MostrarAtributos({ id_empresa }) {
  const { data, error } = await supabase
    .from("atributos")
    .select("id, nombre, orden, valores:atributo_valores(id, nombre, orden)")
    .eq("id_empresa", id_empresa)
    .order("orden")
    .order("nombre");
  if (error) throw new Error(error.message);
  return (data ?? []).map((a) => ({
    ...a,
    valores: [...a.valores].sort(
      (x, y) => x.orden - y.orden || x.nombre.localeCompare(y.nombre)
    ),
  }));
}

export async function InsertarAtributo({ id_empresa, nombre, valores = [] }) {
  const { data, error } = await supabase
    .from("atributos")
    .insert({ id_empresa, nombre: nombre.trim() })
    .select("id")
    .single();
  if (error) throw new Error(mensajeDuplicado(error, "Ya existe ese atributo"));
  if (valores.length) {
    const { error: e2 } = await supabase.from("atributo_valores").insert(
      valores.map((v, i) => ({ id_atributo: data.id, nombre: v, orden: i + 1 }))
    );
    if (e2) throw new Error(e2.message);
  }
  return data.id;
}

export async function RenombrarAtributo({ id, nombre }) {
  const { error } = await supabase
    .from("atributos")
    .update({ nombre: nombre.trim() })
    .eq("id", id);
  if (error) throw new Error(mensajeDuplicado(error, "Ya existe ese atributo"));
}

export async function EliminarAtributo({ id }) {
  const { error } = await supabase.from("atributos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function InsertarValorAtributo({ id_atributo, nombre, orden }) {
  const { error } = await supabase
    .from("atributo_valores")
    .insert({ id_atributo, nombre: nombre.trim(), orden });
  if (error) throw new Error(mensajeDuplicado(error, "Ese valor ya existe"));
}

export async function EliminarValorAtributo({ id }) {
  const { error } = await supabase.from("atributo_valores").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Ids de los valores que tiene un producto.
export async function AtributosDeProducto(idProducto) {
  const { data, error } = await supabase
    .from("producto_atributos")
    .select("id_valor")
    .eq("id_producto", idProducto);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.id_valor);
}

// Reemplaza todos los valores del producto.
export async function SetAtributosProducto(idProducto, idsValor) {
  const { error } = await supabase.rpc("set_atributos_producto", {
    _id_producto: idProducto,
    _ids_valor: idsValor ?? [],
  });
  if (error) throw new Error(error.message);
}

function mensajeDuplicado(error, texto) {
  return error.code === "23505" ? texto : error.message;
}
