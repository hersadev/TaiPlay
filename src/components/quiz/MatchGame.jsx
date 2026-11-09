import { useEffect, useMemo, useState } from 'react';

const shuffle = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Juego de emparejar: se elige un elemento de cada columna y, si son
// pareja, se quedan fijados. Al emparejarlos todos se llama a onComplete.
export default function MatchGame({ pairs, done, onComplete, leftTitle = 'Nombre', rightTitle = 'Qué hace' }) {
  const [round, setRound] = useState(0);
  const lefts = useMemo(() => shuffle(pairs.map((p) => p.left)), [pairs, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const rights = useMemo(() => shuffle(pairs.map((p) => p.right)), [pairs, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [matched, setMatched] = useState(() => new Set());
  const [sel, setSel] = useState({ left: null, right: null });
  const [miss, setMiss] = useState(null);
  const [errors, setErrors] = useState(0);
  const finished = matched.size === pairs.length;

  useEffect(() => {
    if (finished && !done) onComplete();
  }, [finished, done, onComplete]);

  const rightOf = (left) => pairs.find((p) => p.left === left).right;

  const choose = (side, value) => {
    if (finished) return;
    const next = { ...sel, [side]: sel[side] === value ? null : value };
    setMiss(null);
    if (next.left && next.right) {
      if (rightOf(next.left) === next.right) {
        setMatched((m) => new Set(m).add(next.left));
      } else {
        setMiss(next);
        setErrors((e) => e + 1);
      }
      setSel({ left: null, right: null });
    } else setSel(next);
  };

  const restart = () => {
    setRound((r) => r + 1);
    setMatched(new Set());
    setSel({ left: null, right: null });
    setMiss(null);
    setErrors(0);
  };

  const tone = (side, value, isMatched) => {
    if (isMatched) return 'border-green-700 bg-green-900/30 text-green-200';
    if (miss?.[side] === value) return 'border-red-400 bg-red-800/30 text-gray-100';
    if (sel[side] === value) return 'border-yellow-400 bg-yellow-400/10 text-gray-100';
    return 'border-gray-700 text-gray-200 hover:border-gray-500';
  };
  const matchedRights = new Set([...matched].map(rightOf));

  return (
    <section className="rounded-xl border border-gray-700 bg-gray-900 p-4 sm:p-5">
      <h2 className="font-semibold text-gray-100">Empareja cada una con su función</h2>
      <p className="mb-4 text-sm text-gray-400">
        Toca una de cada columna. Llevas {matched.size} de {pairs.length}
        {errors ? ` · ${errors} fallo${errors > 1 ? 's' : ''}` : ''}.
      </p>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,5fr)]">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{leftTitle}</h3>
          <div className="flex flex-wrap gap-2 sm:flex-col">
            {lefts.map((l) => {
              const isMatched = matched.has(l);
              return (
                <button
                  key={l}
                  type="button"
                  disabled={isMatched}
                  aria-pressed={sel.left === l}
                  onClick={() => choose('left', l)}
                  className={`rounded-lg border px-3 py-2 text-left font-mono text-sm ${tone('left', l, isMatched)}`}
                >
                  {isMatched ? '✓ ' : ''}
                  {l}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{rightTitle}</h3>
          <div className="flex flex-col gap-2">
            {rights.map((r) => {
              const isMatched = matchedRights.has(r);
              const owner = isMatched ? pairs.find((p) => p.right === r).left : null;
              return (
                <button
                  key={r}
                  type="button"
                  disabled={isMatched}
                  aria-pressed={sel.right === r}
                  onClick={() => choose('right', r)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${tone('right', r, isMatched)}`}
                >
                  {owner && <span className="mr-2 font-mono font-semibold">{owner}</span>}
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {miss && <p className="mt-3 text-sm text-red-300">✗ {miss.left} no es eso. Prueba otra vez.</p>}
      {(finished || done) && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-green-900/50 p-2 text-sm text-green-200">
          <span>{finished ? `¡Completado${errors ? ` con ${errors} fallo${errors > 1 ? 's' : ''}` : ' sin fallos'}!` : '¡Completado!'}</span>
          <button type="button" onClick={restart} className="rounded-lg border border-green-700 px-3 py-1 text-green-100 hover:border-green-500">
            ↺ Barajar y repetir
          </button>
        </div>
      )}
    </section>
  );
}
