import { useRef, useState } from 'react';

const MAX_ROWS = 200;
const isWrite = (sql) => /^(insert|update|delete|replace)\b/i.test(sql);

// Consola SQL: editor + botón Ejecutar (o Ctrl/Cmd+Intro) + resultados de
// cada sentencia. db es el de engine/sql/db.js. onRun se llama tras cada
// ejecución para que la lección revalide sus objetivos.
export default function SqlConsole({ db, onRun, className = '' }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState([]);
  const history = useRef([]);
  const histIdx = useRef(null);

  const run = () => {
    if (!text.trim()) return;
    const res = db.run(text);
    history.current.push(text);
    histIdx.current = null;
    setResults(res);
    onRun?.(db);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      run();
    } else if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.altKey) {
      // Alt+↑/↓ recorre las consultas anteriores
      e.preventDefault();
      const h = history.current;
      if (!h.length) return;
      let i = histIdx.current ?? h.length;
      i = e.key === 'ArrowUp' ? Math.max(0, i - 1) : Math.min(h.length, i + 1);
      histIdx.current = i;
      setText(h[i] ?? '');
    }
  };

  return (
    <div className={`flex min-h-0 flex-col gap-3 ${className}`}>
      <div className="overflow-hidden rounded-lg border border-gray-700 bg-[#1d2021]">
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-gray-500">
          <span>Editor SQL</span>
          <span className="hidden sm:inline">Ctrl+Intro ejecuta · Alt+↑ consulta anterior</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={5}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Editor SQL"
          placeholder="SELECT * FROM …;"
          className="block w-full resize-y bg-transparent px-3 py-2 font-mono text-[13px] leading-relaxed text-gray-100 caret-yellow-400 outline-none placeholder:text-gray-600"
        />
        <div className="flex justify-end gap-2 border-t border-gray-800 px-3 py-2">
          <button type="button" onClick={() => setText('')} className="rounded px-2 py-1 text-xs text-gray-400 hover:text-gray-200">
            Limpiar
          </button>
          <button type="button" onClick={run} className="rounded-lg bg-yellow-400 px-3 py-1 text-sm font-semibold text-gray-950 hover:bg-yellow-300">
            ▶ Ejecutar
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto" role="log" aria-live="polite">
        {results.map((r, i) => (
          <Result key={i} r={r} />
        ))}
      </div>
    </div>
  );
}

function Result({ r }) {
  if (!r.ok) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-800/20 p-3 font-mono text-sm">
        <p className="text-red-300">✗ {r.error}</p>
        {r.error !== r.raw && <p className="mt-1 text-xs text-gray-500">{r.raw}</p>}
      </div>
    );
  }
  if (!r.columns.length) {
    return (
      <p className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 font-mono text-sm text-green-300">
        ✓ {isWrite(r.sql) ? `${r.changes} fila${r.changes === 1 ? '' : 's'} afectada${r.changes === 1 ? '' : 's'}` : 'Hecho'}
        <span className="ml-2 text-xs text-gray-500">{r.sql.slice(0, 60)}</span>
      </p>
    );
  }
  return (
    <div className="overflow-hidden rounded-lg border border-gray-700">
      <div className="max-h-80 overflow-auto">
        <table className="w-full border-collapse font-mono text-xs">
          <thead className="sticky top-0 bg-gray-800">
            <tr>
              {r.columns.map((c, i) => (
                <th key={i} className="whitespace-nowrap px-2 py-1.5 text-left font-semibold text-yellow-300">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.rows.slice(0, MAX_ROWS).map((row, i) => (
              <tr key={i} className="border-t border-gray-800 odd:bg-gray-900">
                {row.map((v, j) => (
                  <td key={j} className={`whitespace-nowrap px-2 py-1 ${v === null ? 'italic text-gray-500' : 'text-gray-200'}`}>
                    {v === null ? 'NULL' : String(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-gray-800 bg-gray-900 px-2 py-1 text-xs text-gray-500">
        {r.rows.length} fila{r.rows.length === 1 ? '' : 's'}
        {r.rows.length > MAX_ROWS && ` (se muestran ${MAX_ROWS})`}
      </p>
    </div>
  );
}

// Esquema de la base de datos en vivo (se actualiza al crear tablas).
export function SchemaPanel({ tables }) {
  return (
    <div className="space-y-2">
      {tables.map((t) => (
        <details key={t.name} className="rounded-lg border border-gray-800 bg-gray-900 text-xs">
          <summary className="cursor-pointer px-2 py-1.5 font-mono text-yellow-300">{t.name}</summary>
          <ul className="space-y-0.5 px-3 pb-2 font-mono">
            {t.columns.map((c) => {
              const fk = t.fks.find((f) => f.from === c.name);
              return (
                <li key={c.name} className="flex justify-between gap-2">
                  <span className={c.pk ? 'font-bold text-gray-100' : fk ? 'italic text-blue-300' : 'text-gray-300'}>
                    {c.pk && <span className="mr-1 text-yellow-400">PK</span>}
                    {fk && <span className="mr-1 not-italic text-blue-400">FK</span>}
                    {c.name}
                  </span>
                  <span className="text-gray-500">{fk ? `→ ${fk.table}` : c.type}</span>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </div>
  );
}
