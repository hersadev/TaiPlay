import { useState } from 'react';
import QuestionCard from '../quiz/QuestionCard';
import { topicLabel } from '../../data/topics';
import { useProgress } from '../../store/progress';

const pct = (x) => `${Math.round(x * 100)} %`;
const PENALTY_LABEL = { 0: 'sin penalización', [1 / 4]: '−1/4 por error', [1 / 3]: '−1/3 por error' };

export default function ExamResults({ title, questions, answers, result, seen, onExit }) {
  const penalty = useProgress((s) => s.settings.penalty);
  const [filter, setFilter] = useState('wrong');
  const counted = new Set(result.countedIds);
  const shown = questions.filter((q) => {
    const a = answers[q.id] ?? null;
    if (filter === 'wrong') return a !== null && a !== q.answer && !q.annulled;
    if (filter === 'blank') return a === null && counted.has(q.id);
    return true;
  });
  const topics = Object.entries(result.topics).sort((a, b) => a[1].pct - b[1].pct);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <header className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <p className="text-sm text-gray-400">Resultado · {title}</p>
        <div className="mt-2 flex flex-wrap items-end gap-6">
          <div>
            <p className="text-4xl font-bold text-yellow-400">{result.net.toFixed(2)}</p>
            <p className="text-xs text-gray-400">
              aciertos netos de {result.total} ({PENALTY_LABEL[penalty] ?? `−${penalty.toFixed(2)} por error`})
            </p>
          </div>
          <Stat label="Aciertos" value={result.correct} tone="text-green-400" />
          <Stat label="Fallos" value={result.wrong} tone="text-red-400" />
          <Stat label="En blanco" value={result.blank} tone="text-gray-300" />
          <Stat label="Rendimiento" value={pct(result.pct)} tone="text-blue-300" />
        </div>
        {seen?.total > 0 && <SeenNote seen={seen} />}
        <p className="mt-3 text-xs text-gray-500">
          La nota oficial se obtiene transformando las puntuaciones directas según la fórmula que publica el tribunal; esto es una
          estimación para compararte contigo mismo. Las preguntas anuladas no cuentan y en su lugar entran las de reserva.
        </p>
      </header>

      <section className="rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h2 className="mb-3 font-semibold text-gray-100">Por temas (de peor a mejor)</h2>
        <ul className="space-y-2">
          {topics.map(([id, t]) => (
            <li key={id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
              <div>
                <div className="flex justify-between text-gray-300">
                  <span>{topicLabel(id)}</span>
                  <span className="text-gray-500">
                    {t.correct}✓ {t.wrong}✗ {t.blank}○
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded bg-gray-800">
                  <div
                    className={`h-1.5 rounded ${t.pct >= 0.7 ? 'bg-green-500' : t.pct >= 0.4 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${Math.round(t.pct * 100)}%` }}
                  />
                </div>
              </div>
              <span className="w-12 text-right font-mono text-gray-300">{pct(t.pct)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto font-semibold text-gray-100">Revisión</h2>
          {[
            ['wrong', 'Falladas'],
            ['blank', 'En blanco'],
            ['all', 'Todas'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`rounded-full px-3 py-1 text-sm ${filter === id ? 'bg-yellow-400 text-gray-950' : 'bg-gray-800 text-gray-300'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {shown.length === 0 && <p className="text-gray-400">Nada que mostrar con este filtro. 🎉</p>}
        {shown.map((q) => (
          <QuestionCard key={q.id} question={q} mode="review" selected={answers[q.id] ?? null} />
        ))}
      </section>

      <button type="button" onClick={onExit} className="rounded-lg bg-gray-700 px-4 py-2 text-gray-100 hover:bg-gray-600">
        ← Volver
      </button>
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div>
      <p className={`text-2xl font-semibold ${tone}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

// Aviso de cuánto de la nota puede ser memoria: preguntas que ya se habían
// respondido antes de empezar.
function SeenNote({ seen }) {
  const frac = seen.seen / seen.total;
  if (frac === 0)
    return <p className="mt-3 rounded-lg bg-green-900/30 p-2 text-sm text-green-100">Todas las preguntas eran nuevas para ti: esta nota mide tu nivel real.</p>;
  return (
    <p className={`mt-3 rounded-lg p-2 text-sm ${frac >= 0.5 ? 'bg-yellow-900/40 text-yellow-100' : 'bg-gray-800 text-gray-200'}`}>
      Ya habías respondido antes {seen.seen} de las {seen.total} preguntas ({Math.round(frac * 100)} %).
      {frac >= 0.5
        ? ' Buena parte de la nota puede ser memoria y no conocimiento: para medir tu nivel real, usa el simulacro mezclado con «priorizar preguntas nuevas».'
        : ' Tenlo en cuenta al compararte con otros simulacros.'}
    </p>
  );
}
