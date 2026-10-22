// Zona horaria del navegador (p. ej. "America/Tijuana"). Las ventas del POS
// ya se guardan en hora local; las de la tienda en línea y Mercado Libre van
// en UTC, y la base las pasa a esta zona en el dashboard.
export const ZONA_NAVEGADOR =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Mexico_City";
