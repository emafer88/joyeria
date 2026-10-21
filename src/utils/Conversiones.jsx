
export function ConvertirCapitalize(input) {
    return (input.charAt(0).toUpperCase()+input.slice(1).toLowerCase());
  }
  export function ConvertirMinusculas(input){
    return input.toLowerCase()
  }
  export function FormatearNumeroDinero(numero,currency,iso){
    if(currency===undefined){
      return;
    }
    const esiso="es-" + iso
    const numeroconvertido=numero.toLocaleString(esiso,{style:"currency",currency:`${currency}` })
    return numeroconvertido
  }
  export  const urlToBase64 = async(imageUrl)=>{
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const reader = new FileReader()
    return new Promise ((resolve,reject)=>{
      reader.onloadend=()=>{
        resolve(reader.result)
      }
      reader.onerror = reject;
      reader.readAsDataURL(blob)
    })
  }
  // 0 a 29 tienen nombre propio; de 30 en adelante es "TREINTA Y UNO".
  const MENORES_30 = [
    "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
    "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISÉIS", "DIECISIETE",
    "DIECIOCHO", "DIECINUEVE", "VEINTE", "VEINTIUNO", "VEINTIDÓS", "VEINTITRÉS",
    "VEINTICUATRO", "VEINTICINCO", "VEINTISÉIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE",
  ];
  const DECENAS = ["", "", "", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const CENTENAS = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
    "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  // 1 a 999
  function centenasALetras(n) {
    if (n === 100) return "CIEN";
    const c = Math.floor(n / 100);
    const r = n % 100;
    let resto = "";
    if (r < 30) resto = MENORES_30[r];
    else resto = DECENAS[Math.floor(r / 10)] + (r % 10 ? " Y " + MENORES_30[r % 10] : "");
    return [CENTENAS[c], resto].filter(Boolean).join(" ");
  }

  // Antes de MIL/MILLONES "UNO" se dice "UN": VEINTIÚN MIL, TREINTA Y UN MIL.
  function apocopar(texto) {
    return texto.replace(/VEINTIUNO$/, "VEINTIÚN").replace(/UNO$/, "UN");
  }

  function enteroALetras(n) {
    if (n === 0) return "CERO";
    const millones = Math.floor(n / 1000000);
    const miles = Math.floor((n % 1000000) / 1000);
    const resto = n % 1000;
    const partes = [];
    if (millones === 1) partes.push("UN MILLÓN");
    else if (millones > 1) partes.push(`${apocopar(enteroALetras(millones))} MILLONES`);
    if (miles === 1) partes.push("MIL");
    else if (miles > 1) partes.push(`${apocopar(centenasALetras(miles))} MIL`);
    if (resto > 0) partes.push(centenasALetras(resto));
    return partes.join(" ");
  }

  export function numeroALetras(num,nombreMoneda) {
    const [entero, decimal] = Number(num || 0).toFixed(2).split(".");
    const texto = enteroALetras(parseInt(entero, 10));
    // nombre_moneda vale "-" si la empresa no lo configuró.
    const moneda = nombreMoneda && nombreMoneda !== "-" ? ` ${nombreMoneda}` : "";
    return `SON: ${texto} CON ${decimal}/100${moneda}`;
  }
  