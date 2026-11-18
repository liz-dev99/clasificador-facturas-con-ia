/* ===================== Reglas (funciones puras) ===================== */
const Reglas = (() => {
  /** Convierte "$1.234.567" o "1234567,0" en número. */
  function num(x) {
    if (typeof x === "number") return x;
    if (x == null || x === "") return null;
    let s = String(x).replace(/[$\s]/g, "");
    if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/[.,](?=\d{3}(\D|$))/g, "");
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  }
  /** Dígito verificador de un RUT (módulo 11). */
  function dv(cuerpo) {
    let suma = 0, mult = 2;
    for (const d of String(cuerpo).split("").reverse()) { suma += Number(d) * mult; mult = mult === 7 ? 2 : mult + 1; }
    const r = 11 - (suma % 11);
    return r === 11 ? "0" : r === 10 ? "K" : String(r);
  }
  function limpiarRut(rut) { return String(rut || "").toUpperCase().replace(/[^0-9K]/g, ""); }
  function rutValido(rut) {
    const r = limpiarRut(rut);
    if (r.length < 2 || !/^\d+[0-9K]$/.test(r)) return false;
    return dv(r.slice(0, -1)) === r.slice(-1);
  }
  function formatoRut(rut) {
    const r = limpiarRut(rut);
    if (r.length < 2) return rut || "";
    return r.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + r.slice(-1);
  }
  /** Revisa un documento extraído. `anteriores` son los ya procesados (para duplicados). */
  function validar(doc, anteriores = []) {
    const obs = [];
    const neto = num(doc.neto), iva = num(doc.iva), exento = num(doc.exento) || 0, total = num(doc.total);
    for (const [k, nombre] of [["emisor", "emisor"], ["rut_emisor", "RUT del emisor"], ["folio", "folio"], ["fecha", "fecha"], ["total", "total"]])
      if (doc[k] == null || doc[k] === "") obs.push({ nivel: "warn", txt: `Falta el ${nombre}` });
    if (doc.rut_emisor && !rutValido(doc.rut_emisor)) obs.push({ nivel: "crit", txt: `RUT ${doc.rut_emisor} con dígito verificador incorrecto (debería terminar en ${dv(limpiarRut(doc.rut_emisor).slice(0, -1))})` });
    if (doc.tipo === "factura" && neto != null && iva != null) {
      const esperado = Math.round(neto * 0.19);
      if (Math.abs(esperado - iva) > 2) obs.push({ nivel: "crit", txt: `IVA ${clp(iva)} no es el 19% del neto (debería ser ${clp(esperado)})` });
    }
    if (neto != null && total != null) {
      const suma = neto + (iva || 0) + exento;
      if (Math.abs(suma - total) > 2) obs.push({ nivel: "crit", txt: `El total ${clp(total)} no cuadra con neto + IVA + exento (${clp(suma)})` });
    }
    const clave = limpiarRut(doc.rut_emisor) + "|" + String(doc.folio || "").replace(/^0+/, "");
    if (doc.folio && anteriores.some((a) => limpiarRut(a.rut_emisor) + "|" + String(a.folio || "").replace(/^0+/, "") === clave))
      obs.push({ nivel: "crit", txt: "Documento duplicado: mismo RUT emisor y folio que otro ya cargado" });
    return obs;
  }
  const clp = (n) => (n == null || isNaN(n) ? "—" : "$" + Math.round(n).toLocaleString("es-CL"));
  return { num, dv, rutValido, limpiarRut, formatoRut, validar, clp };
})();
if (typeof module !== "undefined") module.exports = Reglas;
