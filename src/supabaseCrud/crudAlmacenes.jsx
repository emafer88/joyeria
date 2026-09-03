import Swal from "sweetalert2";
import { supabase } from "../index";
const tabla = "almacen";


export async function EditarAlmacen(p) {
  const { error } = await supabase.from(tabla).update(p).eq("id", p.id);
  if (error) {
    throw new Error(error.message);
  }
}
export async function InsertarAlmacen(p) {
  const { error } = await supabase.from(tabla).insert(p);
  if (error) {
    throw new Error(error.message);
  }
}

export async function MostrarAlmacenXSucursal(p) {
  const { data } = await supabase
    .from(tabla)
    .select()
    .eq("id_sucursal", p.id_sucursal)
    .maybeSingle();
  return data;
}
export async function MostrarAlmacenesXEmpresa(p) {
  const { data } = await supabase
    .from("sucursales")
    .select(`*, almacen(*)`)
    .eq("id_empresa", p.id_empresa);
  return data;
}
export async function MostrarAlmacenesXSucursal(p) {
  const { data } = await supabase
    .from(tabla)
    .select()
    .eq("id_sucursal", p.id_sucursal);
  return data;
}
// Lista plana de TODOS los almacenes de la empresa (para el filtro de
// Reportes). Une por `sucursales!inner` para scopear por empresa y traer el
// nombre de la sucursal de cada almacén.
export async function MostrarAlmacenesXEmpresaPlano(p) {
  const { data, error } = await supabase
    .from(tabla)
    .select("id, nombre, id_sucursal, sucursales!inner(nombre, id_empresa)")
    .eq("sucursales.id_empresa", p.id_empresa)
    .order("nombre", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}
export async function EliminarAlmacen(p) {
  const { error } = await supabase.from(tabla).delete().eq("id", p.id);
  if (error) {
    throw new Error(error.message);
  }
}
