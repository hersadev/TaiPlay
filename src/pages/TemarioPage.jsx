import { useCallback, useMemo } from 'react';
import { BLOQUES, findTema, TEMAS } from '../data/temario';
import { ALL_QUESTIONS } from '../data/exams';
import { findLesson } from '../lessons';
import { useProgress } from '../store/progress';
import { href } from '../hooks/useRoute';
import RichText from '../components/ui/RichText';
import ConceptQuiz from '../components/quiz/ConceptQuiz';
import { NotFound } from './LearnPage';

const questionsOf = (temaId) => ALL_QUESTIONS.filter((q) => q.tema === temaId);
const MAX_WEIGHT = Math.max(...TEMAS.map((t) => questionsOf(t.id).length));

// Estado de un tema para el alumno: ficha superada (test) y dominio de sus
// preguntas reales (acertadas la última vez / total no anuladas).
function useTemaStats() {
  const { lessons, answers } = useProgress();
  return useMemo(() => {
    const stats = {};
    for (const t of TEMAS) {
      const qs = questionsOf(t.id).filter((q) => !q.annulled);
      stats[t.id] = {
        done: Boolean(lessons[t.id]?.done),
        total: qs.length,
        ok: qs.filter((q) => answers[q.id]?.last === 'ok').length,
        seen: qs.filter((q) => answers[q.id]).length,
      };
    }
    return stats;
  }, [lessons, answers]);
}

export function TemarioPage() {
  const stats = useTemaStats();
  const done = Object.values(stats).filter((s) => s.done).length;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100">Temario</h1>
      <p className="mt-1 max-w-3xl text-gray-400">
        Los 33 temas del programa oficial, con una ficha de repaso de lo esencial, un test corto y las preguntas reales que han
        caído de cada uno. La barra amarilla indica cuánto ha pesado el tema en los exámenes de 2024 y 2025.
      </p>
      <p className="mt-2 text-sm text-gray-500">
        {done}/{TEMAS.length} fichas superadas
      </p>

      <div className="mt-6 space-y-8">
        {BLOQUES.map((b) => (
          <section key={b.n}>
            <h2 className="mb-3 font-semibold text-yellow-400">
              Bloque {b.roman} · <span className="text-gray-100">{b.title}</span>
            </h2>
            <ol className="grid gap-2 md:grid-cols-2">
              {TEMAS.filter((t) => t.bloque === b.n).map((t) => {
                const s = stats[t.id];
                const weight = questionsOf(t.id).length;
                return (
                  <li key={t.id}>
                    <a
                      href={href(`temario/${t.id}`)}
                      className="flex h-full items-start gap-3 rounded-xl border border-gray-700 bg-gray-900 p-3 hover:border-yellow-400"
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-mono text-sm ${
                          s.done ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {s.done ? '✓' : t.n}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-100">{t.short}</p>
                        <p className="line-clamp-1 text-xs text-gray-500">{t.title}</p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <span className="h-1.5 w-16 rounded bg-gray-800" title={`${weight} preguntas en los exámenes`}>
                            <span className="block h-1.5 rounded bg-yellow-400" style={{ width: `${(weight / MAX_WEIGHT) * 100}%` }} />
                          </span>
                          <span>{weight} preguntas</span>
                          {s.seen > 0 && (
                            <span className="ml-auto text-green-300">
                              {s.ok}/{s.total} dominadas
                            </span>
                          )}
                        </div>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

export function TemaPage({ temaId }) {
  const tema = findTema(temaId);
  const saved = useProgress((s) => s.lessons[temaId]);
  const completeLesson = useProgress((s) => s.completeLesson);
  const stats = useTemaStats()[temaId];
  const onComplete = useCallback(() => completeLesson(temaId), [completeLesson, temaId]);
  if (!tema) return <NotFound />;

  const i = TEMAS.findIndex((t) => t.id === tema.id);
  const prev = TEMAS[i - 1];
  const next = TEMAS[i + 1];
  const lessons = tema.lessons.map(findLesson).filter(Boolean);
  const nQ = questionsOf(tema.id).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div>
        <a href={href('temario')} className="text-sm text-gray-400 hover:text-gray-200">
          ← Temario · Bloque {tema.roman}
        </a>
        <p className="mt-2 font-mono text-sm text-yellow-400">Tema {tema.n}</p>
        <h1 className="text-2xl font-bold text-gray-100">{tema.short}</h1>
        <p className="mt-2 text-sm italic text-gray-400">{tema.title}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <a
          href={href('preguntas', { programa: tema.id, orden: 'examen' })}
          className="rounded-lg bg-yellow-400 px-3 py-1.5 font-semibold text-gray-950 hover:bg-yellow-300"
        >
          Practicar sus {nQ} preguntas de examen →
        </a>
        {stats.seen > 0 && (
          <span className="rounded-lg bg-gray-800 px-3 py-1.5 text-gray-300">
            Dominas {stats.ok} de {stats.total}
          </span>
        )}
      </div>

      <RichText text={tema.body} />

      {lessons.length > 0 && (
        <section className="rounded-xl border border-gray-700 bg-gray-900 p-4">
          <h2 className="mb-2 font-semibold text-gray-100">Practícalo en TaiPlay</h2>
          <ul className="space-y-1 text-sm">
            {lessons.map((l) => (
              <li key={l.id}>
                <a href={href(`aprende/${l.trackId}/${l.id}`)} className="text-yellow-400 hover:text-yellow-300">
                  → {l.title}
                </a>
                <span className="text-gray-500"> · {l.type === 'terminal' ? 'práctica con terminal' : 'lectura + test'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <ConceptQuiz key={tema.id} quiz={tema.quiz} done={Boolean(saved?.done)} onComplete={onComplete} />

      <p className="text-xs text-gray-500">
        Ficha de repaso: resume lo esencial y lo que más se pregunta, pero no sustituye al estudio completo del tema ni a la lectura de
        la norma.
      </p>

      <div className="flex flex-wrap gap-2">
        {prev && (
          <a href={href(`temario/${prev.id}`)} className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-300 hover:border-gray-400">
            ← {prev.short}
          </a>
        )}
        {next && (
          <a href={href(`temario/${next.id}`)} className="ml-auto rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-300 hover:border-gray-400">
            {next.short} →
          </a>
        )}
      </div>
    </div>
  );
}
