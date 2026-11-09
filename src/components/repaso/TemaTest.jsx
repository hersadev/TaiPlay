import { useMemo, useState } from 'react';
import { ALL_QUESTIONS } from '../../data/exams';
import { TEMAS } from '../../data/temario';
import { buildPool, drawRound } from '../../engine/repaso/pool.js';
import { useProgress } from '../../store/progress';
import RichText from '../ui/RichText';

const SIZE = 10;
const PASS = 8;
const SOURCE = { examen: 'Examen real', ficha: 'Ficha del temario', tarjeta: 'Dato para memorizar' };

// Test por temas: rondas de 10 preguntas, una a una y con corrección al
// momento. Las preguntas reales cuentan también para el banco (falladas,
// racha, logros). Se completa al sacar PASS o más.
export default function TemaTest({ temas, done, onPass }) {
  const recordAnswer = useProgress((s) => s.recordAnswer);
  const [round, setRound] = useState(0);
  const questions = useMemo(() => drawRound(buildPool(temas, { questions: ALL_QUESTIONS, temas: TEMAS }), SIZE), [temas, round]); // eslint-disable-line react-hooks/exhaustive-deps
  const [i, setI] = useState(0);
  const [picks, setPicks] = useState({});
  const q = questions[i];
  const finished = i >= questions.length;
  const score = questions.filter((x, k) => picks[k] === x.answer).length;

  const choose = (j) => {
    if (picks[i] !== undefined) return;
    setPicks((p) => ({ ...p, [i]: j }));
    if (q.source === 'examen') recordAnswer(q.id, j === q.answer);
    const total = questions.filter((x, k) => (k === i ? j : picks[k]) === x.answer).length;
    if (i === questions.length - 1 && total >= PASS && !done) onPass();
  };

  const again = () => {
    setRound((r) => r + 1);
    setI(0);
    setPicks({});
  };

  if (finished) {
    const passed = score >= PASS;
    return (
      <section className={`rounded-xl border p-5 ${passed ? 'border-green-700 bg-green-900/30' : 'border-gray-700 bg-gray-900'}`}>
        <p className="text-2xl font-bold text-gray-100">
          {score} / {questions.length}
        </p>
        <p className={passed ? 'text-green-200' : 'text-gray-300'}>
          {passed ? '¡Superado! ' : `Necesitas ${PASS} para superarlo. `}
          Cada ronda trae preguntas distintas.
        </p>
        <ol className="mt-4 space-y-2 text-sm">
          {questions.map((x, k) => (
            <li key={x.id} className="flex gap-2">
              <span className={picks[k] === x.answer ? 'text-green-400' : 'text-red-400'}>{picks[k] === x.answer ? '✓' : '✗'}</span>
              <span className="text-gray-300">
                {x.text.length > 110 ? `${x.text.slice(0, 110)}…` : x.text}
                {picks[k] !== x.answer && <span className="block text-green-300">→ {x.options[x.answer]}</span>}
              </span>
            </li>
          ))}
        </ol>
        <button type="button" onClick={again} className="mt-4 rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-gray-950 hover:bg-yellow-300">
          Otra ronda
        </button>
      </section>
    );
  }

  const pick = picks[i];
  return (
    <section className="rounded-xl border border-gray-700 bg-gray-900 p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
        <span>
          Pregunta {i + 1} de {questions.length} · <span className={q.source === 'examen' ? 'text-yellow-300' : ''}>{SOURCE[q.source]}</span>
          {q.source === 'examen' && ` · ${q.label}`}
        </span>
        <span>
          {score} acierto{score === 1 ? '' : 's'}
        </span>
      </div>
      <div className="mb-3 font-medium text-gray-100">
        <RichText text={q.text} />
      </div>
      <div className="grid gap-2">
        {q.options.map((o, j) => {
          const tone =
            pick === undefined
              ? 'border-gray-700 hover:border-gray-500'
              : j === q.answer
                ? 'border-green-500 bg-green-900/40'
                : pick === j
                  ? 'border-red-400 bg-red-800/30'
                  : 'border-gray-800 opacity-60';
          return (
            <button key={`${j}-${o}`} type="button" onClick={() => choose(j)} disabled={pick !== undefined} className={`flex gap-3 rounded-lg border px-3 py-2 text-left text-sm text-gray-200 ${tone}`}>
              <span className="font-mono text-gray-400">{'abcd'[j]})</span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
      {pick !== undefined && (
        <>
          <div className={`mt-3 rounded-lg p-3 text-sm ${pick === q.answer ? 'bg-green-900/30 text-green-100' : 'bg-red-900/30 text-red-100'}`}>
            <p className="mb-1 font-semibold">{pick === q.answer ? '✓ Correcto' : '✗ Incorrecto'}</p>
            {q.why && <RichText text={q.why} />}
          </div>
          <button type="button" autoFocus onClick={() => setI((k) => k + 1)} className="mt-3 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-yellow-300">
            {i === questions.length - 1 ? 'Ver el resultado' : 'Siguiente →'}
          </button>
        </>
      )}
    </section>
  );
}
