// Base de datos SQL de práctica sobre sql.js (SQLite en WebAssembly): las
// consultas del alumno se ejecutan de verdad. createSqlDb recibe el módulo
// SQL ya inicializado (en el navegador lo carga loader.js; en las pruebas,
// sql.js directamente), así que no depende del navegador.
//
// Cada sentencia ejecutada queda en db.log como
//   { sql, ok, columns, rows, changes, error }
// para que los validadores de las lecciones puedan revisar lo que se hizo.

import { SEEDS } from './seeds.js';

// Mensajes de SQLite más habituales, en castellano y con pista.
const ERRORS = [
  [/no such table: (\S+)/, (m) => `No existe la tabla «${m[1]}». Revisa el nombre (mira el esquema de la izquierda).`],
  [/no such column: (\S+)/, (m) => `No existe la columna «${m[1]}».`],
  [/near "(.*?)": syntax error/, (m) => `Error de sintaxis cerca de «${m[1]}».`],
  [/incomplete input/, () => 'La sentencia está incompleta (¿falta cerrar un paréntesis o unas comillas?).'],
  [/UNIQUE constraint failed: (\S+)/, (m) => `Se viola la restricción UNIQUE de ${m[1]}: ese valor ya existe.`],
  [/NOT NULL constraint failed: (\S+)/, (m) => `${m[1]} no admite valores nulos (NOT NULL).`],
  [/FOREIGN KEY constraint failed/, () => 'Se viola una clave foránea: el valor no existe en la tabla referenciada (o hay filas que dependen de esta).'],
  [/table (\S+) already exists/, (m) => `La tabla «${m[1]}» ya existe.`],
  [/ambiguous column name: (\S+)/, (m) => `La columna «${m[1]}» es ambigua: está en varias tablas. Pon delante el nombre de la tabla (Tabla.columna).`],
  [/misuse of aggregate/, () => 'Uso incorrecto de una función de agregado (COUNT, SUM…): ¿falta un GROUP BY o deberías usar HAVING?'],
  [/cannot (commit|rollback) - no transaction is active/, () => 'No hay ninguna transacción abierta (empieza con BEGIN).'],
];

export function translateError(message) {
  for (const [re, fn] of ERRORS) {
    const m = message.match(re);
    if (m) return fn(m);
  }
  return message;
}

export function createSqlDb(SQL, seed) {
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  for (const name of [].concat(seed ?? [])) db.run(SEEDS[name]);

  const api = {
    log: [],

    // Ejecuta una o varias sentencias. Devuelve la lista de resultados (uno
    // por sentencia); se detiene en el primer error, como un cliente SQL.
    run(text) {
      const results = [];
      try {
        for (const stmt of db.iterateStatements(text)) {
          const sql = stmt.getSQL().trim();
          const columns = stmt.getColumnNames();
          const rows = [];
          try {
            while (stmt.step()) rows.push(stmt.get());
          } finally {
            stmt.free();
          }
          const entry = { sql, ok: true, columns, rows, changes: columns.length ? 0 : db.getRowsModified() };
          results.push(entry);
          api.log.push(entry);
        }
      } catch (e) {
        const entry = { sql: text.trim(), ok: false, error: translateError(e.message), raw: e.message };
        results.push(entry);
        api.log.push(entry);
      }
      return results;
    },

    // Consulta de solo lectura para validadores y para el panel de esquema:
    // no queda en el log.
    query(sql) {
      const res = db.exec(sql);
      return res[0] ? { columns: res[0].columns, rows: res[0].values } : { columns: [], rows: [] };
    },

    tables() {
      const names = api.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").rows.map((r) => r[0]);
      return names.map((name) => ({
        name,
        columns: api.query(`PRAGMA table_info("${name}")`).rows.map(([, col, type, notnull, , pk]) => ({ name: col, type, pk: pk > 0, notnull: Boolean(notnull) })),
        // PRAGMA foreign_key_list: id, seq, table, from, to, …
        fks: api.query(`PRAGMA foreign_key_list("${name}")`).rows.map((r) => ({ table: r[2], from: r[3], to: r[4] })),
      }));
    },

    close() {
      db.close();
    },
  };
  return api;
}

// Compara dos resultados ignorando los nombres de las columnas y, salvo que
// se pida, el orden de las filas.
export function sameResult(a, b, { ordered = false } = {}) {
  if (!a || !b || a.columns.length !== b.columns.length || a.rows.length !== b.rows.length) return false;
  const norm = (rows) => rows.map((r) => JSON.stringify(r.map((v) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v))));
  const x = norm(a.rows);
  const y = norm(b.rows);
  if (!ordered) {
    x.sort();
    y.sort();
  }
  return x.every((v, i) => v === y[i]);
}
