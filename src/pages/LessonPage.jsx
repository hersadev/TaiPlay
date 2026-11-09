import { useCallback, useEffect, useState } from 'react';
import { findLesson, findTrack } from '../lessons';
import { findQuestion } from '../data/exams';
import { createShell } from '../engine/terminal/shell.js';
import { useProgress } from '../store/progress';
import { href } from '../hooks/useRoute';
import RichText from '../components/ui/RichText';
import Terminal from '../components/terminal/Terminal';
import QuestionCard from '../components/quiz/QuestionCard';
import ConceptQuiz from '../components/quiz/ConceptQuiz';
import SqlConsole, { SchemaPanel } from '../components/sql/SqlConsole';
import { loadSql } from '../engine/sql/loader.js';
import { createSqlDb } from '../engine/sql/db.js';
import { createSwitch } from '../engine/ios/ios.js';
import Drill from '../components/drill/Drill';
import MatchGame from '../components/quiz/MatchGame';
import CodeExercises from '../components/code/CodeExercises';
import Challenges from '../components/code/Challenges';
import Flashcards from '../components/repaso/Flashcards';
import TemaTest from '../components/repaso/TemaTest';
import { TARJETAS } from '../data/legislacion/tarjetas.js';
import { NotFound } from './LearnPage';

export default function LessonPage({ trackId, lessonId }) {
  const lesson = findLesson(lessonId);
  const track = findTrack(trackId);
  if (!lesson || !track || lesson.trackId !== track.id) return <NotFound />;
  const i = track.lessons.findIndex((l) => l.id === lesson.id);
  const next = track.lessons[i + 1] ?? null;
  const prev = track.lessons[i - 1] ?? null;
  const Component = { terminal: TerminalLesson, sql: SqlLesson, ios: IosLesson, drill: DrillLesson, match: MatchLesson, code: CodeLesson, flashcards: FlashcardsLesson, test: TestLesson }[lesson.type] ?? ConceptLesson;
  return <Component key={lesson.id} lesson={lesson} track={track} next={next} prev={prev} />;
}

function Breadcrumb({ track, lesson }) {
  const i = track.lessons.findIndex((l) => l.id === lesson.id);
  return (
    <p className="text-sm text-gray-400">
      <a href={href(`aprende/${track.id}`)} className="hover:text-gray-200">
        {track.title}
      </a>{' '}
      · Lección {i + 1} de {track.lessons.length}
    </p>
  );
}

function NextNav({ track, next, prev, done }) {
  return (
    <div className="flex flex-wrap gap-2">
      {prev && (
        <a href={href(`aprende/${track.id}/${prev.id}`)} className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-300 hover:border-gray-400">
          ← {prev.title}
        </a>
      )}
      {next ? (
        <a
          href={href(`aprende/${track.id}/${next.id}`)}
          className={`ml-auto rounded-lg px-3 py-2 text-sm font-semibold ${done ? 'bg-yellow-400 text-gray-950 hover:bg-yellow-300' : 'border border-gray-600 text-gray-300'}`}
        >
          {next.title} →
        </a>
      ) : (
        <a href={href(`aprende/${track.id}`)} className="ml-auto rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-300">
          Volver a la ruta
        </a>
      )}
    </div>
  );
}

// Preguntas reales de examen relacionadas con la lección, para practicar
// justo después de aprenderlo.
export function ExamLinks({ ids }) {
  const qs = (ids ?? []).map(findQuestion).filter(Boolean);
  if (!qs.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-gray-100">Así lo preguntaron en el examen</h2>
      {qs.map((q) => (
        <QuestionCard key={q.id} question={q} mode="practice" showContext />
      ))}
    </section>
  );
}

// Objetivos acumulativos: una vez conseguidos se quedan conseguidos, aunque
// después cambie el estado (p. ej. borrar el contenedor que paraste). Se
// evalúan tras cada orden o consulta con evaluate(target), donde target es
// la shell o la base de datos que reciben los check().
function useObjectives(lesson) {
  const saved = useProgress((s) => s.lessons[lesson.id]);
  const { saveObjectives, completeLesson } = useProgress();
  const [done, setDone] = useState(() => lesson.objectives.map((_, i) => Boolean(saved?.objectives?.[i])));
  const allDone = done.every(Boolean);

  useEffect(() => {
    if (allDone && !saved?.done) completeLesson(lesson.id);
  }, [allDone, saved?.done, completeLesson, lesson.id]);

  const evaluate = (target) => {
    const nextDone = lesson.objectives.map((o, i) => {
      if (done[i]) return true;
      try {
        return Boolean(o.check(target));
      } catch (_) {
        return false;
      }
    });
    if (nextDone.some((d, i) => d !== done[i])) {
      setDone(nextDone);
      saveObjectives(lesson.id, nextDone);
    }
  };
  return { done, allDone, evaluate };
}

function ObjectivesBox({ lesson, done, allDone, onRestart, restartLabel }) {
  const [hintsShown, setHintsShown] = useState(0);
  return (
    <section className="rounded-xl border border-gray-700 bg-gray-900 p-4">
      <h2 className="mb-2 font-semibold text-gray-100">Objetivos</h2>
      <ul className="space-y-2">
        {lesson.objectives.map((o, i) => (
          <li key={o.label} className="flex gap-2 text-sm">
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs ${done[i] ? 'bg-green-600 text-white' : 'border border-gray-600'}`}>
              {done[i] ? '✓' : ''}
            </span>
            <span className={done[i] ? 'text-gray-400 line-through' : 'text-gray-200'}>{o.label}</span>
          </li>
        ))}
      </ul>
      {allDone && (
        <p className="mt-3 rounded-lg bg-green-900/50 p-2 text-sm text-green-200">¡Lección completada! Puedes seguir trasteando o pasar a la siguiente.</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {hintsShown < lesson.hints.length && (
          <button type="button" onClick={() => setHintsShown((h) => h + 1)} className="rounded-lg border border-gray-600 px-3 py-1 text-gray-300 hover:border-gray-400">
            💡 {hintsShown ? 'Otra pista' : 'Dame una pista'}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            onRestart();
            setHintsShown(0);
          }}
          className="rounded-lg border border-gray-600 px-3 py-1 text-gray-300 hover:border-gray-400"
        >
          ↺ {restartLabel}
        </button>
      </div>
      {hintsShown > 0 && (
        <ol className="mt-3 space-y-1 text-sm text-yellow-200">
          {lesson.hints.slice(0, hintsShown).map((h) => (
            <li key={h} className="break-words font-mono">
              › {h}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

// Columna de texto común a las prácticas. En el móvil es «display:
// contents»: sus bloques pasan a ser filas de la rejilla y el panel de
// práctica (último hijo de PRACTICE_GRID, order-1) se coloca justo después
// de los objetivos, antes de la curiosidad y las preguntas de examen
// (order-2). En pantalla ancha vuelve a ser una columna con su scroll.
function PracticeText({ lesson, track, next, prev, objectives, onRestart, restartLabel, children }) {
  return (
    <div className="contents lg:block lg:min-h-0 lg:space-y-5 lg:overflow-y-auto lg:pr-1">
      <div>
        <Breadcrumb track={track} lesson={lesson} />
        <h1 className="mt-1 text-2xl font-bold text-gray-100">{lesson.title}</h1>
      </div>
      <RichText text={lesson.body} />
      <ObjectivesBox lesson={lesson} {...objectives} onRestart={onRestart} restartLabel={restartLabel} />
      {children}
      <div className="order-2 space-y-5">
        {lesson.curiosity && <p className="rounded-lg border-l-2 border-purple-400 bg-gray-900 p-3 text-sm text-gray-300">💬 {lesson.curiosity}</p>}
        <ExamLinks ids={lesson.exam} />
        <NextNav track={track} next={next} prev={prev} done={objectives.allDone} />
      </div>
    </div>
  );
}

const PRACTICE_GRID = 'mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-4 [&>*:last-child]:order-1 px-4 py-4 lg:h-[calc(100vh-3.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]';

function TerminalLesson({ lesson, track, next, prev }) {
  const objectives = useObjectives(lesson);
  const [shell, setShell] = useState(() => createShell(lesson.setup));
  return (
    <div className={PRACTICE_GRID}>
      <PracticeText
        {...{ lesson, track, next, prev, objectives }}
        onRestart={() => setShell(createShell(lesson.setup))}
        restartLabel="Reiniciar la máquina"
      />
      <Terminal shell={shell} onCommand={objectives.evaluate} className="h-[60vh] lg:h-auto" />
    </div>
  );
}

function IosLesson({ lesson, track, next, prev }) {
  const objectives = useObjectives(lesson);
  const [sw, setSw] = useState(() => createSwitch(lesson.setup));
  return (
    <div className={PRACTICE_GRID}>
      <PracticeText
        {...{ lesson, track, next, prev, objectives }}
        onRestart={() => setSw(createSwitch(lesson.setup))}
        restartLabel="Reiniciar el switch"
      />
      <Terminal shell={sw} onCommand={objectives.evaluate} className="h-[60vh] lg:h-auto" />
    </div>
  );
}

// Ejercicios generados al azar: cada objetivo pide acertar `need`
// ejercicios de un tipo (`drill`, ver engine/drills).
function DrillLesson({ lesson, track, next, prev }) {
  const objectives = useObjectives(lesson);
  const [counts, setCounts] = useState({});
  const [nonce, setNonce] = useState(0);
  const tabs = lesson.objectives.map((o) => ({ kind: o.drill, need: o.need }));
  const onSolved = (kind) => {
    const nextCounts = { ...counts, [kind]: (counts[kind] ?? 0) + 1 };
    setCounts(nextCounts);
    objectives.evaluate(nextCounts);
  };
  return (
    <div className={PRACTICE_GRID}>
      <PracticeText {...{ lesson, track, next, prev, objectives }} onRestart={() => setNonce((n) => n + 1)} restartLabel="Otro ejercicio" />
      <Drill tabs={tabs} counts={counts} onSolved={onSolved} nonce={nonce} className="lg:h-auto" />
    </div>
  );
}

// Página de lectura con una actividad debajo (emparejar, código, tarjetas…).
function ReadingLayout({ lesson, track, next, prev, done, wide = false, children }) {
  return (
    <div className={`mx-auto ${wide ? 'max-w-4xl' : 'max-w-3xl'} space-y-6 px-4 py-6`}>
      <div>
        <Breadcrumb track={track} lesson={lesson} />
        <h1 className="mt-1 text-2xl font-bold text-gray-100">{lesson.title}</h1>
      </div>
      <RichText text={lesson.body} />
      {children}
      <ExamLinks ids={lesson.exam} />
      <NextNav track={track} next={next} prev={prev} done={done} />
    </div>
  );
}

// Ejercicios de código y, al final, retos de programar. En objectives se
// guarda cuáles están resueltos: primero los ejercicios y después los retos.
// La lección se completa cuando están todos.
function CodeLesson({ lesson, track, next, prev }) {
  const saved = useProgress((s) => s.lessons[lesson.id]);
  const { saveObjectives, completeLesson } = useProgress();
  const nEx = lesson.exercises.length;
  const solved = [...lesson.exercises, ...lesson.challenges].map((_, i) => Boolean(saved?.objectives?.[i]));
  const onSolve = (i) => {
    const nextSolved = solved.map((v, k) => v || k === i);
    saveObjectives(lesson.id, nextSolved);
    if (nextSolved.every(Boolean) && !saved?.done) completeLesson(lesson.id);
  };
  return (
    <ReadingLayout {...{ lesson, track, next, prev }} done={Boolean(saved?.done)}>
      <CodeExercises exercises={lesson.exercises} solved={solved.slice(0, nEx)} onSolve={onSolve} />
      <Challenges lessonId={lesson.id} challenges={lesson.challenges} solved={solved.slice(nEx)} onSolve={(i) => onSolve(nEx + i)} />
    </ReadingLayout>
  );
}

// Repaso espaciado: se completa al haber visto todas las tarjetas.
function FlashcardsLesson({ lesson, track, next, prev }) {
  const saved = useProgress((s) => s.lessons[lesson.id]);
  const cards = useProgress((s) => s.cards);
  const completeLesson = useProgress((s) => s.completeLesson);
  const allSeen = TARJETAS.filter((c) => lesson.temas.includes(c.tema)).every((c) => cards[c.id]);
  useEffect(() => {
    if (allSeen && !saved?.done) completeLesson(lesson.id);
  }, [allSeen, saved?.done, completeLesson, lesson.id]);
  return (
    <ReadingLayout {...{ lesson, track, next, prev }} done={Boolean(saved?.done)}>
      <Flashcards temas={lesson.temas} />
    </ReadingLayout>
  );
}

function TestLesson({ lesson, track, next, prev }) {
  const saved = useProgress((s) => s.lessons[lesson.id]);
  const completeLesson = useProgress((s) => s.completeLesson);
  const onPass = useCallback(() => completeLesson(lesson.id), [completeLesson, lesson.id]);
  return (
    <ReadingLayout {...{ lesson, track, next, prev }} done={Boolean(saved?.done)}>
      {saved?.done && <p className="rounded-lg bg-green-900/40 p-2 text-sm text-green-200">✓ Ya lo superaste. Puedes seguir haciendo rondas para repasar.</p>}
      <TemaTest temas={lesson.temas} done={Boolean(saved?.done)} onPass={onPass} />
    </ReadingLayout>
  );
}

function MatchLesson({ lesson, track, next, prev }) {
  const saved = useProgress((s) => s.lessons[lesson.id]);
  const completeLesson = useProgress((s) => s.completeLesson);
  const onComplete = useCallback(() => completeLesson(lesson.id), [completeLesson, lesson.id]);
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div>
        <Breadcrumb track={track} lesson={lesson} />
        <h1 className="mt-1 text-2xl font-bold text-gray-100">{lesson.title}</h1>
      </div>
      <RichText text={lesson.body} />
      <MatchGame pairs={lesson.pairs} leftTitle={lesson.leftTitle} rightTitle={lesson.rightTitle} done={Boolean(saved?.done)} onComplete={onComplete} />
      <ExamLinks ids={lesson.exam} />
      <NextNav track={track} next={next} prev={prev} done={Boolean(saved?.done)} />
    </div>
  );
}

function SqlLesson({ lesson, track, next, prev }) {
  const objectives = useObjectives(lesson);
  const [SQL, setSQL] = useState(null);
  const [db, setDb] = useState(null);
  const [tables, setTables] = useState([]);
  const [loadError, setLoadError] = useState(null);

  // sql.js (WebAssembly) se carga la primera vez que se abre una lección SQL.
  useEffect(() => {
    let alive = true;
    loadSql()
      .then((mod) => alive && setSQL(mod))
      .catch((e) => alive && setLoadError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const reset = useCallback(() => {
    if (!SQL) return;
    const fresh = createSqlDb(SQL, lesson.seed);
    setDb((old) => {
      old?.close();
      return fresh;
    });
    setTables(fresh.tables());
  }, [SQL, lesson.seed]);

  useEffect(() => {
    reset();
  }, [reset]);

  const onRun = (d) => {
    setTables(d.tables());
    objectives.evaluate(d);
  };

  return (
    <div className={PRACTICE_GRID}>
      <PracticeText {...{ lesson, track, next, prev, objectives }} onRestart={reset} restartLabel="Reiniciar la base de datos">
        {tables.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-gray-300">Esquema de la base de datos</h2>
            <SchemaPanel tables={tables} />
          </section>
        )}
      </PracticeText>
      {db ? (
        <SqlConsole key={lesson.id} db={db} onRun={onRun} className="min-h-[60vh] lg:min-h-0" />
      ) : (
        <div className="grid min-h-[40vh] place-items-center rounded-lg border border-gray-700 text-sm text-gray-400">
          {loadError ? `No se pudo cargar el motor SQL: ${loadError}` : 'Cargando el motor SQL…'}
        </div>
      )}
    </div>
  );
}

function ConceptLesson({ lesson, track, next, prev }) {
  const saved = useProgress((s) => s.lessons[lesson.id]);
  const completeLesson = useProgress((s) => s.completeLesson);
  const onComplete = useCallback(() => completeLesson(lesson.id), [completeLesson, lesson.id]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div>
        <Breadcrumb track={track} lesson={lesson} />
        <h1 className="mt-1 text-2xl font-bold text-gray-100">{lesson.title}</h1>
      </div>
      <RichText text={lesson.body} />
      <ConceptQuiz quiz={lesson.quiz} done={Boolean(saved?.done)} onComplete={onComplete} />
      <ExamLinks ids={lesson.exam} />
      <NextNav track={track} next={next} prev={prev} done={Boolean(saved?.done)} />
    </div>
  );
}
