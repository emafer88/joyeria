// Subcategorías (categorias.id_padre, un solo nivel). Para las listas se arma
// "Ropa › Playeras" y se ordena por ese nombre, así cada hija queda debajo de
// su padre.
export function conNombreCompleto(categorias) {
  if (!categorias) return categorias;
  const porId = new Map(categorias.map((c) => [c.id, c]));
  return categorias
    .map((c) => {
      const padre = c.id_padre ? porId.get(c.id_padre) : null;
      return {
        ...c,
        nombre_completo: padre ? `${padre.nombre} › ${c.nombre}` : c.nombre,
      };
    })
    .sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
}
