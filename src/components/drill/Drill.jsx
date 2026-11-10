import { useEffect, useRef, useState } from 'react';
import { DRILL_KINDS, makeExercise, checkExercise } from '../../engine/drills/index.js';
import RichText from '../ui/RichText';

// Teclado del móvil según el tipo de respuesta: solo cifras, cifras con
// punto (IP, máscaras) o el normal (hexadecimal, IPv6, crontab…).
const INPUT_MODE = { int: 'numeric', bin: 'numeric', oct: 'numeric', ip: 'decimal', prefix: 'decimal', mask: 'decimal' };

// Ejercicios generados al azar. tabs: [{ kind, need }]; counts: aciertos
// por tipo; onSolved(kind) se llama con cada acierto. Los fallos no
// restan: se enseña la solución con la explicación y se pasa a otro.
export default function Drill({ tabs, counts, onSolved, nonce = 0, className = '' }) {
  const firstPending = tabs.find((t) => (counts[t.kind] ?? 0) < t.need)?.kind ?? tabs[0].kind;
  const [kind, setKind] = useState(firstPending);
  const [ex, setEx] = useState(() => makeExercise(firstPending));
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const firstInput = useRef(null);
  const nextBtn = useRef(null);

  const fresh = (k = kind) => {
    setKind(k);
    setEx(makeExercise(k));
    setAnswers({});
    setResult(null);
  };

  // «Nuevo ejercicio» desde el cuadro de objetivos.
  useEffect(() => {
    if (nonce) fresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);

  useEffect(() => {
    if (result) nextBtn.current?.focus({ preventScroll: true });
    else if (window.matchMedia?.('(min-width: 1024px)').matches) firstInput.current?.focus({ preventScroll: true });
  }, [result, ex]);

  const submit = (override) => {
    if (result) return;
    const a = override ?? answers;
    const r = checkExercise(ex, a);
    setAnswers(a);
    setResult(r);
    if (r.ok) onSolved(kind);
  };

  // Al completar un tipo se salta solo al siguiente que falte.
  const next = () => {
    const pending = tabs.find((t) => t.kind !== kind && (counts[t.kind] ?? 0) < t.need);
    const doneHere = (counts[kind] ?? 0) >= (tabs.find((t) => t.kind === kind)?.need ?? 0);
    fresh(doneHere && pending ? pending.kind : kind);
  };

  const choiceField = ex.choices ? ex.fields[0] : null;

  return (
    <div className={`flex min-h-0 flex-col gap-4 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 p-4 ${className}`}>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipo de ejercicio">
        {tabs.map((t) => {
          const n = Math.min(counts[t.kind] ?? 0, t.need);
          const done = n >= t.need;
          const active = t.kind === kind;
          return (
            <button
              key={t.kind}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => fresh(t.kind)}
              className={`rounded-full border px-3 py-1 text-xs ${active ? 'border-yellow-400 text-yellow-300' : done ? 'border-green-700 text-green-300' : 'border-gray-600 text-gray-300 hover:border-gray-400'}`}
            >
              {done ? '✓ ' : ''}
              {DRILL_KINDS[t.kind].label} · {n}/{t.need}
            </button>
          );
        })}
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (result) next();
          else submit();
        }}
      >
        <div className="text-lg text-gray-100">
          <RichText text={ex.prompt} />
        </div>

        {choiceField ? (
          <div className="flex flex-wrap gap-2">
            {ex.choices.map((c) => {
              const picked = answers[choiceField.key] === c;
              const tone = !result
                ? 'border-gray-600 hover:border-gray-400'
                : c === choiceField.answer
                  ? 'border-green-500 bg-green-900/40'
                  : picked
                    ? 'border-red-400 bg-red-800/30'
                    : 'border-gray-700 opacity-60';
              return (
                <button
                  key={c}
                  type="button"
                  disabled={Boolean(result)}
                  onClick={() => submit({ [choiceField.key]: c })}
                  className={`min-w-24 rounded-lg border px-4 py-2 text-gray-100 ${tone}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {ex.fields.map((f, i) => {
              const state = result ? (result.fields[f.key] ? 'ok' : 'bad') : null;
              return (
                <label key={f.key} className="block text-sm">
                  <span className="mb-1 block text-gray-300">{f.label}</span>
                  <input
                    ref={i === 0 ? firstInput : undefined}
                    value={answers[f.key] ?? ''}
                    onChange={(e) => setAnswers((a) => ({ ...a, [f.key]: e.target.value }))}
                    readOnly={Boolean(result)}
                    placeholder={f.placeholder}
                    inputMode={INPUT_MODE[f.type] ?? 'text'}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    className={`w-full rounded-lg border bg-gray-950 px-3 py-2 font-mono text-base text-gray-100 outline-none placeholder:text-gray-600 focus:border-yellow-400 ${state === 'ok' ? 'border-green-500' : state === 'bad' ? 'border-red-400' : 'border-gray-600'}`}
                  />
                  {state === 'bad' && (
                    <span className="mt-1 block font-mono text-xs text-green-300">Correcto: {String(f.type === 'prefix' ? `/${f.answer}` : f.answer)}</span>
                  )}
                </label>
              );
            })}
          </div>
        )}

        {result && (
          <div className={`rounded-lg p-3 text-sm ${result.ok ? 'bg-green-900/40 text-green-100' : 'bg-red-900/30 text-red-100'}`}>
            <p className="mb-1 font-semibold">{result.ok ? '✓ ¡Correcto!' : '✗ No es eso. Fíjate en cómo se calcula:'}</p>
            <RichText text={ex.explain} />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {result ? (
            <button ref={nextBtn} type="submit" className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-yellow-300">
              Siguiente ejercicio →
            </button>
          ) : (
            !choiceField && (
              <button type="submit" className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-yellow-300">
                Comprobar
              </button>
            )
          )}
          {!result && (
            <button type="button" onClick={() => fresh()} className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-300 hover:border-gray-400">
              Otro distinto
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
