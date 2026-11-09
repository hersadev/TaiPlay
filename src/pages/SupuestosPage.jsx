import { useState } from 'react';
import { EXAMS, ALL_QUESTIONS, findExam } from '../data/exams';
import { useProgress } from '../store/progress';
import { href, navigate } from '../hooks/useRoute';
import ExamRunner from '../components/exam/ExamRunner';
import SupuestoContext from '../components/exam/SupuestoContext';
import QuestionCard from '../components/quiz/QuestionCard';
import { NotFound } from './LearnPage';

const SUPUESTOS = EXAMS.flatMap((e) => e.parts.filter((p) => p.id !== 'primera').map((p) => ({ exam: e, part: p })));

const partQuestions = (examId, partId) => ALL_QUESTIONS.filter((q) => q.examId === examId && q.partId === partId);

export function SupuestosList() {
  const attempts = useProgress((s) => s.attempts);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100">Supuestos prácticos</h1>
      <p className="mt-1 max-w-2xl text-gray-400">
        Los supuestos reales del examen: un escenario (un sistema de becas, una red ministerial…) y 20 preguntas sobre él, más 5 de
        reserva. En el examen eliges uno de los dos. Practícalos en modo estudio, con explicación al momento, o en modo examen, con
        cronómetro.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {SUPUESTOS.map(({ exam, part }) => {
          const title = `${exam.title} · ${part.title}`;
          const best = attempts.filter((a) => a.title === title).sort((a, b) => b.net - a.net)[0];
          return (
            <div key={exam.id + part.id} className="flex flex-col rounded-xl border border-gray-700 bg-gray-900 p-5">
              <p className="text-xs text-gray-500">{exam.title}</p>
              <h2 className="font-semibold text-gray-100">{part.title}</h2>
              <p className="mt-2 line-clamp-4 flex-1 text-sm text-gray-400">{part.context[0]}</p>
              {best && (
                <p className="mt-2 text-xs text-green-300">
                  Mejor intento: {best.net.toFixed(2)} netos de {best.total}
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <a href={href(`supuestos/${exam.id}/${part.id}`, { modo: 'estudio' })} className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-200 hover:border-gray-400">
                  Modo estudio
                </a>
                <a href={href(`supuestos/${exam.id}/${part.id}`, { modo: 'examen' })} className="rounded-lg bg-yellow-400 px-3 py-1.5 text-sm font-semibold text-gray-950 hover:bg-yellow-300">
                  Modo examen ⏱
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SupuestoPage({ examId, partId, params }) {
  const exam = findExam(examId);
  const part = exam?.parts.find((p) => p.id === partId && p.id !== 'primera');
  const minutes = useProgress((s) => s.settings.supuestoMin);
  const [started, setStarted] = useState(false);
  if (!part) return <NotFound />;
  const questions = partQuestions(examId, partId);
  const title = `${exam.title} · ${part.title}`;

  if (params.get('modo') === 'examen') {
    if (started) return <ExamRunner title={title} questions={questions} timeLimitMin={minutes} kind="supuesto" onExit={() => navigate('supuestos')} />;
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-100">{title}</h1>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-gray-300">
          <li>{questions.filter((q) => !q.reserve).length} preguntas + {questions.filter((q) => q.reserve).length} de reserva.</li>
          <li>Tiempo: {minutes} minutos (puedes cambiarlo en Simulacro → Ajustes).</li>
          <li>No verás la solución hasta entregar. Puedes marcar preguntas para revisarlas.</li>
          <li>Las reservas solo cuentan si alguna pregunta resultó anulada, igual que en el examen real.</li>
        </ul>
        <button type="button" onClick={() => setStarted(true)} className="mt-6 rounded-lg bg-yellow-400 px-5 py-2 font-semibold text-gray-950 hover:bg-yellow-300">
          Empezar
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="rounded-xl border border-gray-700 bg-gray-900 p-4 text-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <a href={href('supuestos')} className="text-gray-400 hover:text-gray-200">
          ← Supuestos
        </a>
        <h1 className="mb-3 mt-1 text-lg font-semibold text-yellow-400">{title}</h1>
        <SupuestoContext part={part} />
      </aside>
      <div className="min-w-0 space-y-4">
        <p className="text-sm text-gray-400">Modo estudio: cada pregunta se corrige y se explica al momento.</p>
        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} mode="practice" showSource />
        ))}
      </div>
    </div>
  );
}
