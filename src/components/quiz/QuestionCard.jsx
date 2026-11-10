import { useState } from 'react';
import RichText from '../ui/RichText';
import { useProgress } from '../../store/progress';
import { topicLabel } from '../../data/topics';
import { temaLabel } from '../../data/temario';
import { findExam } from '../../data/exams';
import { findLesson } from '../../lessons';
import { href } from '../../hooks/useRoute';
import SupuestoContext from '../exam/SupuestoContext';

const LETTERS = ['a', 'b', 'c', 'd'];

// Una pregunta de examen. Modos:
//   practice: eliges, se corrige al momento y se explica (y cuenta en tus
//             estadísticas); onAnswer(acertada) avisa a quien la usa
//   exam:     eliges sin ver la solución (la corrige quien la usa)
//   review:   muestra tu respuesta y la correcta, con la explicación
export default function QuestionCard({ question: q, mode = 'practice', selected, onSelect, onAnswer, showSource = true, showContext = false }) {
  const recordAnswer = useProgress((s) => s.recordAnswer);
  const [picked, setPicked] = useState(null);
  const [contextOpen, setContextOpen] = useState(false);

  const chosen = mode === 'practice' ? picked : selected;
  const revealed = mode === 'review' || (mode === 'practice' && picked !== null);

  const choose = (letter) => {
    if (mode === 'practice') {
      if (picked !== null) return;
      setPicked(letter);
      if (!q.annulled) recordAnswer(q.id, letter === q.answer);
      onAnswer?.(letter === q.answer);
    } else if (mode === 'exam') {
      onSelect?.(selected === letter ? null : letter);
    }
  };

  const part = showContext && q.partId !== 'primera' ? findExam(q.examId)?.parts.find((p) => p.id === q.partId) : null;
  const lesson = q.learn ? findLesson(q.learn) : null;

  return (
    <article className="rounded-xl border border-gray-700 bg-gray-900 p-4 sm:p-5">
      {showSource && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          {q.oficial === false ? (
            <span className="rounded bg-purple-900/60 px-2 py-0.5 text-purple-200" title="Redactada por TaiPlay a partir de la fuente citada; no procede de un examen">
              No oficial · Fuente: {q.fuente}
            </span>
          ) : (
            <span className="rounded bg-gray-800 px-2 py-0.5 text-gray-300">
              {q.examTitle} · {q.partTitle} · {q.reserve ? 'Reserva ' : 'Pregunta '}
              {q.n}
            </span>
          )}
          <span className="rounded bg-blue-900/60 px-2 py-0.5 text-blue-300">{topicLabel(q.topic)}</span>
          {q.tema && (
            <a href={href(`temario/${q.tema}`)} className="rounded bg-gray-800 px-2 py-0.5 text-yellow-300 hover:bg-gray-700" title="Ver la ficha del tema">
              {temaLabel(q.tema)}
            </a>
          )}
          {q.annulled && <span className="rounded bg-red-800/60 px-2 py-0.5 text-red-200">Anulada por el tribunal</span>}
        </div>
      )}

      {part && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setContextOpen((o) => !o)}
            className="text-sm text-yellow-400 hover:text-yellow-300"
          >
            {contextOpen ? '▾ Ocultar' : '▸ Ver'} el enunciado del {part.title.toLowerCase()}
          </button>
          {contextOpen && (
            <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-gray-700 bg-gray-950 p-3 text-sm">
              <SupuestoContext part={part} />
            </div>
          )}
        </div>
      )}

      {q.intro && <p className="mb-2 border-l-2 border-yellow-700 pl-3 text-sm italic text-gray-400">{q.intro}</p>}
      <RichText text={q.text} className="font-medium text-gray-100" />

      <ol className="mt-4 space-y-2">
        {q.options.map((opt, i) => {
          const letter = LETTERS[i];
          const isChosen = chosen === letter;
          const isRight = q.answer === letter;
          let tone = 'border-gray-700 hover:border-gray-500 hover:bg-gray-800';
          if (revealed && isRight) tone = 'border-green-500 bg-green-900/40';
          else if (revealed && isChosen) tone = 'border-red-400 bg-red-800/30';
          else if (!revealed && isChosen) tone = 'border-yellow-400 bg-yellow-900/30';
          else if (revealed) tone = 'border-gray-800 opacity-70';
          const interactive = mode === 'exam' || (mode === 'practice' && picked === null);
          return (
            <li key={letter}>
              <button
                type="button"
                disabled={!interactive}
                onClick={() => choose(letter)}
                className={`flex w-full gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${tone} ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
                aria-pressed={isChosen}
              >
                <span className={`shrink-0 font-mono font-semibold ${isChosen ? 'text-yellow-300' : 'text-gray-400'}`}>{letter})</span>
                {q.codeOptions ? (
                  <pre className="min-w-0 overflow-x-auto whitespace-pre font-mono text-xs text-gray-200">{opt}</pre>
                ) : (
                  <span className="min-w-0 break-words text-gray-200">{opt}</span>
                )}
                {revealed && isRight && <span className="ml-auto shrink-0 text-green-400">✓</span>}
                {revealed && isChosen && !isRight && <span className="ml-auto shrink-0 text-red-400">✗</span>}
              </button>
            </li>
          );
        })}
      </ol>

      {revealed && (
        <div className="mt-4 rounded-lg bg-gray-800/70 p-3 text-sm">
          {q.annulled ? (
            <p className="mb-1 font-semibold text-red-200">Pregunta anulada: no puntúa.</p>
          ) : chosen ? (
            <p className={`mb-1 font-semibold ${chosen === q.answer ? 'text-green-400' : 'text-red-400'}`}>
              {chosen === q.answer ? '¡Correcto!' : `Incorrecto. La respuesta correcta es la ${q.answer}).`}
            </p>
          ) : (
            <p className="mb-1 font-semibold text-gray-300">Sin responder. La correcta es la {q.answer}).</p>
          )}
          <RichText text={q.explanation} className="text-gray-300" />
          {lesson && (
            <a href={href(`aprende/${lesson.trackId}/${lesson.id}`)} className="mt-2 inline-block text-yellow-400 hover:text-yellow-300">
              → Apréndelo en la lección «{lesson.title}»
            </a>
          )}
        </div>
      )}
    </article>
  );
}
