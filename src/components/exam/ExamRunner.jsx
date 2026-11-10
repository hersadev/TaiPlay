import { useEffect, useMemo, useRef, useState } from 'react';
import QuestionCard from '../quiz/QuestionCard';
import SupuestoContext from './SupuestoContext';
import ExamResults from './ExamResults';
import { scoreExam } from '../../utils/scoring';
import { useProgress } from '../../store/progress';
import { findExam } from '../../data/exams';
import { seenBefore } from '../../engine/simulacro';

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Examen cronometrado: respondes sin ver soluciones, puedes marcar preguntas
// para revisar y saltar entre ellas, y al entregar (o al acabarse el tiempo)
// se corrige con la penalización configurada.
export default function ExamRunner({ title, questions, timeLimitMin, kind, onExit }) {
  const { settings, addAttempt, recordAnswer } = useProgress();
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [left, setLeft] = useState(timeLimitMin * 60);
  const startedAt = useRef(Date.now());
  // Se cuenta al empezar: al corregir, todas pasan a estar respondidas.
  const [seen] = useState(() => seenBefore(questions, useProgress.getState().answers));

  const q = questions[idx];
  const part = useMemo(
    () => (q.partId !== 'primera' ? findExam(q.examId)?.parts.find((p) => p.id === q.partId) : null),
    [q.examId, q.partId],
  );

  const finish = () => {
    const r = scoreExam(questions, answers, settings.penalty);
    for (const qq of questions) {
      if (answers[qq.id] && !qq.annulled) recordAnswer(qq.id, answers[qq.id] === qq.answer);
    }
    addAttempt({
      at: Date.now(),
      kind,
      title,
      seconds: Math.round((Date.now() - startedAt.current) / 1000),
      correct: r.correct,
      wrong: r.wrong,
      blank: r.blank,
      total: r.total,
      net: r.net,
      penalty: settings.penalty,
      seen: seen.seen,
      seenTotal: seen.total,
    });
    setResult(r);
    window.scrollTo(0, 0);
  };

  // Cuenta atrás; al llegar a cero se entrega solo.
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => {
    if (result) return undefined;
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [result]);
  useEffect(() => {
    if (left === 0 && !result) finishRef.current();
  }, [left, result]);

  if (result) return <ExamResults title={title} questions={questions} answers={answers} result={result} seen={seen} onExit={onExit} />;

  const answered = questions.filter((x) => answers[x.id]).length;
  const sections = [];
  questions.forEach((x, i) => {
    const key = `${x.partTitle}${x.reserve ? ' · reserva' : ''}`;
    if (sections[sections.length - 1]?.key !== key) sections.push({ key, items: [] });
    sections[sections.length - 1].items.push({ x, i });
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <div className="sticky top-0 z-10 -mx-4 mb-4 flex flex-wrap items-center gap-3 border-b border-gray-800 bg-gray-950/95 px-4 py-3 backdrop-blur">
        <h1 className="min-w-0 flex-1 truncate font-semibold text-gray-100">{title}</h1>
        <span className="text-sm text-gray-400">
          {answered}/{questions.length} respondidas
        </span>
        <span className={`rounded px-2 py-1 font-mono text-sm ${left < 300 ? 'bg-red-800/60 text-red-100' : 'bg-gray-800 text-gray-100'}`}>
          ⏱ {fmt(left)}
        </span>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg bg-yellow-400 px-3 py-1.5 text-sm font-semibold text-gray-950 hover:bg-yellow-300"
        >
          Entregar
        </button>
      </div>

      {confirming && (
        <div className="mb-4 rounded-xl border border-yellow-700 bg-yellow-900/30 p-4 text-sm">
          <p className="mb-3 text-gray-100">
            ¿Entregar ya? Tienes {questions.length - answered} sin responder
            {Object.values(flags).some(Boolean) ? ' y algunas marcadas para revisar' : ''}.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={finish} className="rounded-lg bg-yellow-400 px-3 py-1.5 font-semibold text-gray-950">
              Sí, corregir
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-lg border border-gray-600 px-3 py-1.5 text-gray-200">
              Seguir
            </button>
          </div>
        </div>
      )}

      <div className={`grid gap-4 ${part ? 'lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]' : ''}`}>
        {part && (
          <aside className="rounded-xl border border-gray-700 bg-gray-900 p-4 text-sm lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <details className="lg:hidden">
              <summary className="cursor-pointer text-yellow-400">Enunciado del {part.title.toLowerCase()}</summary>
              <div className="mt-3">
                <SupuestoContext part={part} />
              </div>
            </details>
            <div className="hidden lg:block">
              <h2 className="mb-2 font-semibold text-yellow-400">{part.title}</h2>
              <SupuestoContext part={part} />
            </div>
          </aside>
        )}

        <div className="min-w-0 space-y-4">
          <QuestionCard
            key={q.id}
            question={q}
            mode="exam"
            selected={answers[q.id] ?? null}
            onSelect={(l) => setAnswers((a) => ({ ...a, [q.id]: l }))}
            showSource={false}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={idx === 0}
              onClick={() => setIdx(idx - 1)}
              className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-200 disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}
              className={`rounded-lg border px-3 py-1.5 text-sm ${flags[q.id] ? 'border-orange-500 text-orange-300' : 'border-gray-600 text-gray-300'}`}
            >
              {flags[q.id] ? '★ Marcada' : '☆ Marcar para revisar'}
            </button>
            <button
              type="button"
              disabled={idx === questions.length - 1}
              onClick={() => setIdx(idx + 1)}
              className="ml-auto rounded-lg bg-gray-700 px-3 py-1.5 text-sm text-gray-100 hover:bg-gray-600 disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>

          <nav className="space-y-3 rounded-xl border border-gray-800 p-3" aria-label="Ir a la pregunta">
            {sections.map((s) => (
              <div key={s.key}>
                <p className="mb-1 text-xs text-gray-500">{s.key}</p>
                <div className="flex flex-wrap gap-1">
                  {s.items.map(({ x, i }) => (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => setIdx(i)}
                      className={`h-8 w-8 rounded text-xs font-mono ${
                        i === idx
                          ? 'bg-yellow-400 text-gray-950'
                          : flags[x.id]
                            ? 'bg-orange-700 text-white'
                            : answers[x.id]
                              ? 'bg-blue-700 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                      aria-label={`Pregunta ${x.seq ?? x.n}${answers[x.id] ? ', respondida' : ''}`}
                    >
                      {x.seq ?? x.n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
