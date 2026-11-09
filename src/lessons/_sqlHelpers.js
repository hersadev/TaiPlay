// Validadores de las lecciones de SQL. Cada uno devuelve (db) => boolean y
// se evalúa tras cada ejecución; db es el de engine/sql/db.js (con su log
// de sentencias y query() de solo lectura).

const norm = (sql) => sql.replace(/\s+/g, ' ').trim();

// Alguna sentencia ejecutada (con éxito, o fallida si ok: false) encaja.
export const ranSql = (re, { ok = true } = {}) => (db) =>
  db.log.some((e) => e.ok === ok && re.test(norm(e.sql)));

// Alguna consulta del alumno devuelve lo mismo que `expected`, sin exigir
// las mismas columnas ni su orden: basta con que cada columna del resultado
// esperado aparezca, con los mismos valores (como multiconjunto), en alguna
// columna del suyo y con el mismo número de filas. Así vale tanto
// «SELECT * …» como «SELECT nombre …» si lo que se pide son los nombres.
// Con ordered: true, el orden de las filas también cuenta.
export const returnsSame = (expected, { ordered = false } = {}) => (db) => {
  const want = db.query(expected);
  const wantCols = want.columns.map((_, i) => want.rows.map((r) => r[i]));
  const key = (vals) => {
    const v = vals.map((x) => JSON.stringify(typeof x === 'number' ? Math.round(x * 1e6) / 1e6 : x));
    return (ordered ? v : v.sort()).join('|');
  };
  return db.log.some((e) => {
    if (!e.ok || !e.columns?.length || e.rows.length !== want.rows.length) return false;
    const got = e.columns.map((_, i) => key(e.rows.map((r) => r[i])));
    return wantCols.every((col) => got.includes(key(col)));
  });
};

// Comprueba el estado actual de la base de datos con una consulta propia.
export const dbHas = (sql, pred) => (db) => {
  try {
    return Boolean(pred(db.query(sql).rows));
  } catch (_) {
    return false;
  }
};

export const count = (sql, n) => dbHas(sql, (rows) => rows[0]?.[0] === n);

export const tableHas = (table, columns) => (db) => {
  const t = db.tables().find((x) => x.name.toLowerCase() === table.toLowerCase());
  return Boolean(t) && columns.every((c) => t.columns.some((col) => col.name.toLowerCase() === c.toLowerCase()));
};

export const hasForeignKey = (table, refTable) => (db) => {
  const t = db.tables().find((x) => x.name.toLowerCase() === table.toLowerCase());
  return Boolean(t?.fks.some((f) => f.table.toLowerCase() === refTable.toLowerCase()));
};

export const allSql = (...fns) => (db) => fns.every((f) => f(db));
