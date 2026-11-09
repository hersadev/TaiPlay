// Cómo se pinta lo que se pasa a console.log, igual en el navegador (dentro
// del Worker) y en las pruebas (vm de Node): así la salida que ve el alumno
// es exactamente la que comprueban los tests.
//
// IMPORTANTE: esta función se serializa con toString() para meterla en el
// Worker, así que no puede usar nada de fuera de su cuerpo.
export function formatValue(value, top = true, seen = []) {
  if (typeof value === 'string') return top ? value : `'${value}'`;
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'number') return Object.is(value, -0) ? '-0' : String(value);
  if (typeof value === 'bigint') return `${value}n`;
  if (typeof value === 'boolean' || typeof value === 'symbol') return String(value);
  if (typeof value === 'function') return value.name ? `[Function: ${value.name}]` : '[Function (anónima)]';
  if (seen.includes(value)) return '[Circular]';
  const inner = [...seen, value];
  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    const items = [];
    for (let i = 0; i < value.length; i++) items.push(i in value ? formatValue(value[i], false, inner) : '<vacío>');
    return `[ ${items.join(', ')} ]`;
  }
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Map) return `Map(${value.size}) { ${[...value].map(([k, v]) => `${formatValue(k, false, inner)} => ${formatValue(v, false, inner)}`).join(', ')} }`;
  if (value instanceof Set) return `Set(${value.size}) { ${[...value].map((v) => formatValue(v, false, inner)).join(', ')} }`;
  if (typeof value.then === 'function') return 'Promise { <pendiente> }';
  const keys = Object.keys(value);
  const name = value.constructor && value.constructor !== Object ? `${value.constructor.name} ` : '';
  if (!keys.length) return `${name}{}`;
  const key = (k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`);
  return `${name}{ ${keys.map((k) => `${key(k)}: ${formatValue(value[k], false, inner)}`).join(', ')} }`;
}

// Igualdad profunda para corregir los retos: mismo valor, mismos elementos
// y mismas claves (en cualquier orden). Los números se comparan con una
// pequeña tolerancia para que 0.1 + 0.2 valga como 0.3.
// También se serializa para el Worker: autocontenida.
export function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-9;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual(a[k], b[k]));
}

export const MAX_LINES = 200;

// Datos de la API simulada para los ejercicios con fetch (supuesto de 2025).
export const FAKE_API = {
  'http://localhost:8080/alumnos': [
    { id: 1, nombre: 'Lucía' },
    { id: 2, nombre: 'Hugo' },
  ],
};
