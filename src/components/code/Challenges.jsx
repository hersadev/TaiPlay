import { useState } from 'react';
import RichText from '../ui/RichText';
import CodeEditor, { ConsoleOutput } from './CodeEditor';
import { runJs, runJsTests } from '../../engine/js/run.js';
import { gapOk } from '../../lessons/_retos.js';

const LANG = { java: 'Java', csharp: 'C#' };

// Borrador de cada reto en el navegador, para no perderlo al recargar.
// localStorage puede no estar disponible: entonces simplemente no se guarda.
const draftKey = (lessonId, i) => `taiplay:reto:${lessonId}:${i}`;
const loadDraft = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const saveDraft = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* sin almacenamiento: no pasa nada */
  }
};

// Retos de programar al final de una lección (ver lessons/_retos.js).
export default function Challenges({ lessonId, challenges, solved, onSolve }) {
  if (!challenges.length) return null;
  const n = solved.filter(Boolean).length;
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold text-gray-100">Ahora programas tú</h2>
        <p className="text-sm text-gray-400">
          {n} de {challenges.length} retos
        </p>
      </div>
      {challenges.map((c, i) =>
        c.kind === 'js' ? (
          <JsChallenge key={c.title} n={i + 1} c={c} draft={draftKey(lessonId, i)} solved={Boolean(solved[i])} onSolve={() => onSolve(i)} />
        ) : (
          <GapChallenge key={c.title} n={i + 1} c={c} solved={Boolean(solved[i])} onSolve={() => onSolve(i)} />
        ),
      )}
    </section>
  );
}

function Header({ n, c, lang, solved }) {
  return (
    <>
      <header className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-yellow-400/15 px-2 py-0.5 text-yellow-300">
          Reto {n} · {lang}
        </span>
        {solved && <span className="rounded bg-green-900/60 px-2 py-0.5 text-green-200">✓ Superado</span>}
      </header>
      <h3 className="font-semibold text-gray-100">{c.title}</h3>
      <div className="mb-3 mt-1 text-sm text-gray-300">
        <RichText text={c.task} />
      </div>
    </>
  );
}

const callText = (fn, args) => `${fn}(${args.map((a) => JSON.stringify(a)).join(', ')})`;

function JsChallenge({ n, c, draft, solved, onSolve }) {
  const [code, setCode] = useState(() => loadDraft(draft) ?? c.starter);
  const [result, setResult] = useState(null);
  const [output, setOutput] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const edit = (v) => {
    setCode(v);
    saveDraft(draft, v);
  };

  const check = async () => {
    setBusy(true);
    setOutput(null);
    const r = await runJsTests(code, c.fn, c.tests);
    setResult(r);
    setBusy(false);
    if (r.results?.every((x) => x.ok)) onSolve();
    else setFails((f) => f + 1);
  };

  const run = async () => {
    setBusy(true);
    setOutput(await runJs(code));
    setBusy(false);
  };

  const passed = result?.results?.filter((x) => x.ok).length ?? 0;
  const allOk = result?.results && passed === c.tests.length;

  return (
    <article className="rounded-xl border border-yellow-400/30 bg-gray-900 p-4">
      <Header n={n} c={c} lang="JavaScript" solved={solved} />
      <CodeEditor value={code} onChange={edit} onRun={check} label={`Código del reto ${c.title}`} />
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <button type="button" onClick={check} disabled={busy} className="rounded-lg bg-yellow-400 px-3 py-1.5 font-semibold text-gray-950 hover:bg-yellow-300 disabled:opacity-60">
          {busy ? 'Comprobando…' : '✓ Comprobar'}
        </button>
        <button type="button" onClick={run} disabled={busy} className="rounded-lg border border-gray-600 px-3 py-1.5 text-gray-300 hover:border-gray-400">
          ▶ Ejecutar (ver la consola)
        </button>
        {code !== c.starter && (
          <button type="button" onClick={() => edit(c.starter)} className="rounded-lg border border-gray-600 px-3 py-1.5 text-gray-300 hover:border-gray-400">
            ↺ Empezar de nuevo
          </button>
        )}
        {fails >= 2 && !allOk && (
          <button type="button" onClick={() => setShowSolution((s) => !s)} className="rounded-lg border border-gray-600 px-3 py-1.5 text-gray-300 hover:border-gray-400">
            {showSolution ? 'Ocultar la solución' : 'Ver una solución'}
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">Ctrl+Intro comprueba · Tab sangra · Esc sale del editor</p>

      {result && (
        <div className={`mt-3 rounded-lg p-3 text-sm ${allOk ? 'bg-green-900/30 text-green-100' : 'bg-gray-950 text-gray-200'}`}>
          {result.timedOut && <p className="text-red-300">⏱ Tu código no terminó a tiempo: ¿hay un bucle infinito?</p>}
          {result.missing && <p className="text-red-300">No encuentro la función «{c.fn}». ¿Le has cambiado el nombre?</p>}
          {result.results && (
            <>
              <p className="mb-2 font-semibold">{allOk ? `✓ ¡Reto superado! ${passed}/${c.tests.length} pruebas.` : `${passed} de ${c.tests.length} pruebas superadas`}</p>
              <ul className="space-y-1 font-mono text-xs">
                {result.results.map((x, i) => (
                  <li key={i} className={x.ok ? 'text-green-300' : 'text-red-300'}>
                    {x.ok ? '✓' : '✗'} {callText(c.fn, c.tests[i].args)} → {x.error ?? x.got}
                    {!x.ok && !x.error && <span className="text-gray-400"> (se esperaba {JSON.stringify(c.tests[i].expect)})</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
          {result.lines.length > 0 && <ConsoleOutput lines={result.lines} className="mt-2 max-h-40" />}
        </div>
      )}
      {output && <ConsoleOutput lines={output.lines} className="mt-3 max-h-48" />}
      {showSolution && (
        <pre className="mt-3 overflow-x-auto rounded-lg border border-gray-700 bg-[#1d2021] p-3 font-mono text-[13px] text-gray-200">
          <code>{c.solution}</code>
        </pre>
      )}
    </article>
  );
}

function GapChallenge({ n, c, solved, onSolve }) {
  const parts = c.code.split(/\{\{(\d+)\}\}/);
  const [values, setValues] = useState(() => c.gaps.map(() => ''));
  const [checked, setChecked] = useState(null);
  const [fails, setFails] = useState(0);
  const allOk = checked?.every(Boolean);

  const check = () => {
    const r = c.gaps.map((g, i) => gapOk(g, values[i]));
    setChecked(r);
    if (r.every(Boolean)) onSolve();
    else setFails((f) => f + 1);
  };

  const reveal = () => {
    setValues(c.gaps.map((g) => g.accept[0]));
    setChecked(null);
  };

  return (
    <article className="rounded-xl border border-yellow-400/30 bg-gray-900 p-4">
      <Header n={n} c={c} lang={LANG[c.lang]} solved={solved} />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          check();
        }}
      >
        <pre className="overflow-x-auto rounded-lg bg-[#1d2021] p-3 font-mono text-[13px] leading-loose text-gray-200">
          <code>
            {parts.map((p, i) => {
              if (i % 2 === 0) return <span key={i}>{p}</span>;
              const g = Number(p) - 1;
              const state = checked ? (checked[g] ? 'ok' : 'bad') : null;
              const width = Math.max(4, ...c.gaps[g].accept.map((a) => a.length)) + 1;
              return (
                <input
                  key={i}
                  value={values[g]}
                  onChange={(e) => {
                    const v = [...values];
                    v[g] = e.target.value;
                    setValues(v);
                    setChecked(null);
                  }}
                  readOnly={allOk}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="off"
                  aria-label={`Hueco ${g + 1}`}
                  style={{ width: `${Math.min(width, 34)}ch` }}
                  className={`mx-0.5 max-w-full rounded border bg-gray-950 px-1 py-0.5 font-mono text-yellow-200 outline-none focus:border-yellow-400 ${state === 'ok' ? 'border-green-500' : state === 'bad' ? 'border-red-400' : 'border-gray-500'}`}
                />
              );
            })}
          </code>
        </pre>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          {!allOk && (
            <button type="submit" className="rounded-lg bg-yellow-400 px-3 py-1.5 font-semibold text-gray-950 hover:bg-yellow-300">
              ✓ Comprobar
            </button>
          )}
          {fails >= 2 && !allOk && (
            <button type="button" onClick={reveal} className="rounded-lg border border-gray-600 px-3 py-1.5 text-gray-300 hover:border-gray-400">
              Ver la solución
            </button>
          )}
        </div>
      </form>
      {checked && !allOk && <p className="mt-2 text-sm text-red-300">✗ {checked.filter((x) => !x).length === 1 ? 'Hay un hueco' : 'Hay huecos'} que no está{checked.filter((x) => !x).length === 1 ? '' : 'n'} bien (en rojo).</p>}
      {(allOk || (solved && !checked)) && (
        <div className="mt-3 rounded-lg bg-green-900/30 p-3 text-sm text-green-100">
          {allOk && <p className="mb-1 font-semibold">✓ ¡Reto superado!</p>}
          <RichText text={c.why} />
        </div>
      )}
      <p className="mt-2 text-xs text-gray-500">Java y C# no se pueden compilar en el navegador: la respuesta se compara con las formas válidas, sin tener en cuenta los espacios.</p>
    </article>
  );
}
