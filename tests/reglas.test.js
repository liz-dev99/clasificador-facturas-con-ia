// Pruebas de las reglas de validación. Ejecutar con: node --test tests/
const test = require("node:test");
const assert = require("node:assert");
const R = require("../reglas.js");

test("dígito verificador del RUT", () => {
  assert.strictEqual(R.dv("76543210"), "3");
  assert.strictEqual(R.rutValido("76.543.210-3"), true);
  assert.strictEqual(R.rutValido("78.002.345-2"), false);
  assert.strictEqual(R.rutValido("78.002.345-7"), true);
});

test("lee montos en formato chileno", () => {
  assert.strictEqual(R.num("$1.234.567"), 1234567);
  assert.strictEqual(R.num("90.630"), 90630);
  assert.strictEqual(R.num("1.234,50"), 1234.5);
  assert.strictEqual(R.num(""), null);
});

test("factura correcta no tiene observaciones", () => {
  const ok = { tipo: "factura", emisor: "Distribuidora Los Andes SpA", rut_emisor: "76.543.210-3", folio: "18452", fecha: "2026-11-03", neto: 76160, iva: 14470, total: 90630 };
  assert.deepStrictEqual(R.validar(ok), []);
});

test("detecta IVA mal calculado", () => {
  const d = { tipo: "factura", emisor: "Lácteos del Sur", rut_emisor: "76.881.234-9", folio: "9031", fecha: "2026-11-05", neto: 61390, iva: 11900, total: 73290 };
  const obs = R.validar(d);
  assert.strictEqual(obs.length, 1);
  assert.match(obs[0].txt, /IVA/);
});

test("detecta duplicados por RUT y folio", () => {
  const a = { tipo: "factura", emisor: "X", rut_emisor: "76.543.210-3", folio: "018452", fecha: "2026-11-03", neto: 100, iva: 19, total: 119 };
  const b = { ...a, folio: "18452" };
  assert.match(R.validar(b, [a]).map((o) => o.txt).join(), /duplicado/);
});

test("detecta total que no cuadra", () => {
  const d = { tipo: "boleta", emisor: "Y", rut_emisor: "76.543.210-3", folio: "1", fecha: "2026-11-01", neto: 1000, iva: 190, total: 1500 };
  assert.match(R.validar(d).map((o) => o.txt).join(), /no cuadra/);
});
