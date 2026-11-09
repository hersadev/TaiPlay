// Carga perezosa de sql.js en el navegador: el módulo WebAssembly (~650 KB)
// solo se descarga la primera vez que se abre una lección de SQL.
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

let promise = null;

export function loadSql() {
  promise ??= initSqlJs({ locateFile: () => wasmUrl });
  return promise;
}
