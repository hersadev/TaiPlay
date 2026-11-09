import { useState } from 'react';
import RichText from '../ui/RichText';
import { runJs } from '../../engine/js/run.js';
import CodeEditor, { ConsoleOutput } from './CodeEditor';

const LANG = { js: 'JavaScript', java: 'Java', csharp: 'C#' };

// Ejercicios de leer código (lecciones «code»). solved[i] indica los ya
// resueltos; onSolve(i) se llama al acertar uno. Ver lessons/programacion.js.
export default function CodeExercises({ exercises, solved, onSolve }) {
  const n = solved.filter(Boolean).length;
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-gray-100">Ejercicios</h2>
        <p className="text-sm text-gray-400">
          {n} de {exercises.length} resueltos
        </p>
      </div>
      {exercises.map((ex, i) => (
        <Exercise key={`${i}-${ex.q}`} n={i + 1} ex={ex} solved={Boolean(solved[i])} onSolve={() => onSolve(i)} />
      ))}
      {n === exercises.length && <p className="rounded-lg bg-green-900/50 p-2 text-sm text-green-200">¡Ejercicios resueltos! La lección se completa al superar también los retos.</p>}
    </section>
  );
}

function Exercise({ n, ex, solved, onSolve }) {
  const [pick, setPick] = useState(null);
  const [attempted, setAttempted] = useState(solved);
  const right = pick !== null && (ex.task === 'line' ? [ex.answer].flat().includes(pick) : pick === ex.answer);
  const done = solved || right;

  const choose = (v) => {
    if (right) return;
    setPick(v);
    setAttempted(true);
    if (ex.task === 'line' ? [ex.answer].flat().includes(v) : v === ex.answer) onSolve();
  };

  return (
    <article className="rounded-xl border border-gray-700 bg-gray-900 p-4">
      <header className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-gray-800 px-2 py-0.5 text-gray-300">
          {n} · {LANG[ex.lang]}
        </span>
        {done && <span className="rounded bg-green-900/60 px-2 py-0.5 text-green-200">✓ Resuelto</span>}
      </header>
      <p className="mb-3 font-medium text-gray-100">{ex.q}</p>

      {ex.task === 'line' ? (
        <LinePicker code={ex.code} pick={pick} answer={[ex.answer].flat()} right={right} onPick={choose} />
      ) : (
        <>
          <CodeBlock code={ex.code} />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ex.options.map((o, j) => {
              const tone =
                pick === j ? (j === ex.answer ? 'border-green-500 bg-green-900/40' : 'border-red-400 bg-red-800/30') : 'border-gray-700 hover:border-gray-500';
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => choose(j)}
                  disabled={right}
                  className={`rounded-lg border px-3 py-2 text-left text-sm text-gray-200 font-mono ${tone}`}
                >
                  <span className="whitespace-pre-wrap break-words">{o}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {pick !== null && !right && <p className="mt-2 text-sm text-red-300">✗ No es eso. Prueba otra vez.</p>}
      {(right || (solved && pick === null)) && (
        <div className="mt-3 rounded-lg bg-green-900/30 p-3 text-sm text-green-100">
          {ex.error && <p className="mb-1 font-semibold">Error de {ex.error}.</p>}
          <RichText text={ex.why} />
        </div>
      )}
      {ex.lang === 'js' && attempted && <Runner code={ex.code} />}
    </article>
  );
}

function CodeBlock({ code }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-[#1d2021] p-3 font-mono text-[13px] leading-relaxed text-gray-200">
      <code>{code}</code>
    </pre>
  );
}

// Código con las líneas numeradas y pulsables (¿dónde está el error?).
function LinePicker({ code, pick, answer, right, onPick }) {
  const lines = code.split('\n');
  return (
    <div className="overflow-x-auto rounded-lg bg-[#1d2021] py-2 font-mono text-[13px] leading-relaxed" role="group" aria-label="Pulsa la línea del error">
      {lines.map((l, i) => {
        const num = i + 1;
        const chosen = pick === num;
        const tone = chosen ? (answer.includes(num) ? 'bg-green-900/50' : 'bg-red-900/40') : right && answer.includes(num) ? 'bg-green-900/30' : 'hover:bg-gray-800';
        return (
          <button
            key={num}
            type="button"
            disabled={right}
            onClick={() => onPick(num)}
            className={`flex w-full min-w-max text-left ${tone}`}
            aria-label={`Línea ${num}: ${l.trim() || '(vacía)'}`}
          >
            <span className="w-10 shrink-0 select-none pr-3 text-right text-gray-500">{num}</span>
            <span className="whitespace-pre pr-3 text-gray-200">{l || ' '}</span>
          </button>
        );
      })}
    </div>
  );
}

// Ejecuta el código (o una versión modificada) de verdad en un Worker.
function Runner({ code: original }) {
  const [code, setCode] = useState(original);
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setResult(await runJs(code));
    setRunning(false);
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2 text-sm">
        <button type="button" onClick={run} disabled={running} className="rounded-lg bg-yellow-400 px-3 py-1.5 font-semibold text-gray-950 hover:bg-yellow-300 disabled:opacity-60">
          {running ? 'Ejecutando…' : '▶ Ejecutar'}
        </button>
        <button type="button" onClick={() => setEditing((e) => !e)} className="rounded-lg border border-gray-600 px-3 py-1.5 text-gray-300 hover:border-gray-400">
          {editing ? 'Cerrar el editor' : '✎ Modificar el código'}
        </button>
        {code !== original && (
          <button type="button" onClick={() => setCode(original)} className="rounded-lg border border-gray-600 px-3 py-1.5 text-gray-300 hover:border-gray-400">
            ↺ Original
          </button>
        )}
      </div>
      {editing && <CodeEditor value={code} onChange={setCode} onRun={run} label="Código JavaScript" />}
      {result && <ConsoleOutput lines={result.lines} />}
    </div>
  );
}
