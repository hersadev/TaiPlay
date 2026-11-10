import { useState } from 'react';
import { ALL_QUESTIONS } from '../data/exams';
import { useProgress } from '../store/progress';
import { href } from '../hooks/useRoute';
import QuestionCard from '../components/quiz/QuestionCard';
import { buildRoad, alocadoRoad, drawRun, PATHS, RUN, EMPTY_ROAD } from '../engine/road.js';

const SEGURO = buildRoad(ALL_QUESTIONS);
const STAGES_BY_PATH = { seguro: SEGURO, alocado: alocadoRoad(SEGURO) };
const ROMAN = ['I', 'II', 'III', 'IV'];
// Desplazamiento lateral de cada tramo para que el camino serpentee.
const ZIG = [0, 1, 2, 1, 0, -1, -2, -1];

// Road: el camino de tramos. Cada tramo son 10 preguntas seguidas; si se
// falla una se pierde la tirada y se vuelve al principio del tramo. Los
// tramos ya superados se pueden repetir para repasar (no cambian nada).
// Hay dos caminos con su propio avance (?camino=alocado): el seguro pregunta
// por los temas de cada tramo y el alocado, por cualquier tema.
export default function RoadPage({ params }) {
  const mode = params?.get('camino') === 'alocado' ? 'alocado' : 'seguro';
  const path = PATHS[mode];
  const STAGES = STAGES_BY_PATH[mode];
  const road = useProgress((s) => s[path.key]) ?? EMPTY_ROAD;
  const [run, setRun] = useState(null);
  const cleared = Math.min(road.cleared, STAGES.length);
  const current = STAGES[cleared] ?? null;

  // replay se fija al empezar: al superar el tramo actual, cleared avanza y
  // la tirada no debe pasar a considerarse un repaso.
  const start = (stage) => setRun({ stage, key: Date.now(), replay: STAGES.indexOf(stage) < cleared });

  if (run) {
    return (
      <RunView
        key={run.key}
        stage={run.stage}
        stages={STAGES}
        mode={mode}
        replay={run.replay}
        onRetry={() => start(run.stage)}
        onNext={(next) => (next ? start(next) : setRun(null))}
        onExit={() => setRun(null)}
      />
    );
  }

  const sections = [...[1, 2, 3, 4].map((b) => ({ key: `B${b}`, title: `Bloque ${ROMAN[b - 1]}`, stages: STAGES.filter((s) => s.bloque === b) })), { key: 'meta', title: 'Recta final', stages: STAGES.filter((s) => s.kind === 'meta') }].filter((s) => s.stages.length);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100">Road</h1>
      <p className="mt-1 text-gray-400">
        Un camino por todo el temario. Cada tramo son <strong className="text-gray-200">{RUN} preguntas seguidas</strong>: si fallas una,
        pierdes la tirada y vuelves al principio del tramo. Aciértalas todas y se abre el siguiente.
      </p>

      <div role="tablist" aria-label="Camino" className="mt-5 grid gap-2 sm:grid-cols-2">
        {Object.entries(PATHS).map(([id, p]) => (
          <a
            key={id}
            role="tab"
            aria-selected={mode === id}
            href={href('road', id === 'alocado' ? { camino: 'alocado' } : undefined)}
            className={`rounded-xl border p-3 ${mode === id ? (id === 'alocado' ? 'border-purple-400 bg-purple-900/30' : 'border-yellow-400 bg-yellow-900/20') : 'border-gray-700 hover:border-gray-500'}`}
          >
            <span className="font-semibold text-gray-100">
              {p.icon} {p.name}
            </span>
            <span className="mt-0.5 block text-xs text-gray-400">
              {id === 'alocado'
                ? 'Los mismos tramos, pero cada tirada mezcla preguntas de todo el temario.'
                : 'Cada tramo pregunta solo por sus temas, bloque a bloque.'}
            </span>
          </a>
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-yellow-700/60 bg-gray-900 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-gray-400">
            Tramo {Math.min(cleared + 1, STAGES.length)} de {STAGES.length}
          </p>
          <p className="font-mono text-sm text-gray-300">{Math.round((cleared / STAGES.length) * 100)} %</p>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-800" role="progressbar" aria-valuemin={0} aria-valuemax={STAGES.length} aria-valuenow={cleared}>
          <div className="h-2 rounded-full bg-yellow-400" style={{ width: `${(cleared / STAGES.length) * 100}%`, minWidth: cleared ? '8px' : 0 }} />
        </div>
        {current ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-gray-100">{current.title}</p>
              <p className="text-sm text-gray-400">
                {current.subtitle}
                {road.fails[current.id] ? ` · ${road.fails[current.id]} ${road.fails[current.id] === 1 ? 'intento fallido' : 'intentos fallidos'}` : ''}
              </p>
            </div>
            <button type="button" onClick={() => start(current)} className="rounded-lg bg-yellow-400 px-5 py-2.5 font-semibold text-gray-950 hover:bg-yellow-300">
              {road.fails[current.id] ? 'Reintentar el tramo' : 'Empezar el tramo'} →
            </button>
          </div>
        ) : (
          <p className="mt-4 text-lg font-semibold text-yellow-300">🏁 ¡Has completado el Road! Puedes repetir cualquier tramo para repasar.</p>
        )}
      </section>

      <div className="mt-8 space-y-10 [--zig:1.5rem] sm:[--zig:3.5rem]">
        {sections.map((sec) => (
          <section key={sec.key} aria-labelledby={`road-${sec.key}`}>
            <h2 id={`road-${sec.key}`} className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-gray-500">
              {sec.title}
            </h2>
            <ol className="flex flex-col items-center">
              {sec.stages.map((s) => {
                const i = STAGES.indexOf(s);
                const state = i < cleared ? 'done' : i === cleared ? 'current' : 'locked';
                return (
                  <li key={s.id} className="flex flex-col items-center" style={{ transform: `translateX(calc(var(--zig) * ${ZIG[i % ZIG.length]}))` }}>
                    {i > 0 && <span aria-hidden="true" className={`h-6 border-l-2 border-dashed ${state === 'locked' ? 'border-gray-800' : 'border-yellow-700'}`} />}
                    <StageNode stage={s} n={i + 1} state={state} fails={road.fails[s.id] ?? 0} onPlay={() => start(s)} />
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

function StageNode({ stage, n, state, fails, onPlay }) {
  const icon = state === 'done' ? '✓' : state === 'locked' ? '🔒' : stage.kind === 'jefe' ? '⚔' : stage.kind === 'meta' ? '🏁' : n;
  const tone = {
    done: 'border-green-600 bg-green-900/50 text-green-200 hover:border-green-400',
    current: 'border-yellow-400 bg-yellow-400 text-gray-950 ring-4 ring-yellow-400/25 hover:bg-yellow-300',
    locked: 'border-gray-700 bg-gray-900 text-gray-600',
  }[state];
  const big = stage.kind !== 'temas';
  return (
    <button
      type="button"
      disabled={state === 'locked'}
      onClick={onPlay}
      title={state === 'done' ? 'Repetir este tramo para repasar' : undefined}
      className="group flex w-56 items-center gap-3 text-left disabled:cursor-not-allowed"
    >
      <span
        className={`grid shrink-0 place-items-center rounded-full border-2 font-semibold ${big ? 'h-14 w-14 text-xl' : 'h-12 w-12'} ${tone}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className={`block truncate text-sm font-medium ${state === 'locked' ? 'text-gray-600' : 'text-gray-200 group-hover:text-yellow-300'}`}>{stage.title}</span>
        <span className="block truncate text-xs text-gray-500">
          {stage.subtitle}
          {state === 'done' && fails === 0 ? ' · a la primera' : ''}
        </span>
        <span className="sr-only">{state === 'done' ? 'Superado.' : state === 'current' ? 'Tramo actual.' : 'Bloqueado.'}</span>
      </span>
    </button>
  );
}

// Una tirada: 10 preguntas seguidas, con corrección y explicación al
// momento. Fallar una acaba la tirada (y cuenta como intento fallido si es
// el tramo actual).
function RunView({ stage, stages: STAGES, mode, replay, onRetry, onNext, onExit }) {
  const answers = useProgress.getState().answers;
  const [questions] = useState(() => drawRun(stage, ALL_QUESTIONS, answers));
  const { roadPass, roadFail } = useProgress();
  const key = PATHS[mode].key;
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState([]);
  const [phase, setPhase] = useState('playing'); // playing | failed | passed
  const q = questions[idx];
  const answered = results.length > idx;
  const next = STAGES[STAGES.indexOf(stage) + 1] ?? null;

  const onAnswer = (ok) => {
    setResults((r) => [...r, ok]);
    if (!ok) {
      if (!replay) roadFail(STAGES, stage.id, key);
      setPhase('failed');
    }
  };

  const advance = () => {
    if (idx + 1 < questions.length) {
      setIdx(idx + 1);
      window.scrollTo(0, 0);
    } else {
      if (!replay) roadPass(STAGES, stage.id, key);
      setPhase('passed');
      window.scrollTo(0, 0);
    }
  };

  if (phase === 'passed') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center">
        <p className="text-5xl" aria-hidden="true">
          {next ? '🎉' : '🏁'}
        </p>
        <h1 className="mt-3 text-2xl font-bold text-gray-100">{replay ? 'Tramo repasado' : next ? '¡Tramo superado!' : (mode === 'alocado' ? '¡Has completado el camino alocado!' : '¡Has completado el Road!')}</h1>
        <p className="mt-2 text-gray-400">
          {stage.title}: {RUN} de {RUN} seguidas.
          {replay ? ' Ya lo tenías superado, así que tu avance no cambia.' : next ? ` Se abre «${next.title}».` : ' Has recorrido todo el temario.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {next && !replay && (
            <button type="button" onClick={() => onNext(next)} className="rounded-lg bg-yellow-400 px-5 py-2.5 font-semibold text-gray-950 hover:bg-yellow-300">
              Seguir: {next.title} →
            </button>
          )}
          <button type="button" onClick={onExit} className="rounded-lg border border-gray-600 px-5 py-2.5 text-gray-200 hover:border-gray-400">
            Volver al camino
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-100">
            {stage.title}
            {mode === 'alocado' && <span className="ml-2 text-xs font-normal text-purple-300">🎲 alocado</span>}
            {replay && <span className="ml-2 text-xs font-normal text-gray-500">(repaso)</span>}
          </p>
          <p className="text-xs text-gray-500">{stage.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (phase !== 'playing' || window.confirm('¿Salir del tramo? Perderás esta tirada.')) onExit();
          }}
          className="rounded-lg border border-gray-600 px-3 py-1.5 text-sm text-gray-300 hover:border-gray-400"
        >
          Salir
        </button>
      </div>

      <ol className="mb-4 flex gap-1.5" aria-label={`Pregunta ${idx + 1} de ${questions.length}`}>
        {questions.map((x, i) => (
          <li
            key={x.id}
            className={`h-2 flex-1 rounded-full ${
              results[i] === true ? 'bg-green-500' : results[i] === false ? 'bg-red-400' : i === idx ? 'bg-yellow-400' : 'bg-gray-800'
            }`}
          />
        ))}
      </ol>

      <QuestionCard key={q.id} question={q} mode="practice" onAnswer={onAnswer} />

      {phase === 'failed' ? (
        <div className="mt-4 rounded-xl border border-red-800 bg-red-900/30 p-4">
          <p className="font-semibold text-red-100">Tirada perdida en la pregunta {idx + 1} de {RUN}.</p>
          <p className="mt-1 text-sm text-red-100/80">
            {replay ? 'Es un tramo que ya tenías superado: no pierdes nada.' : 'Vuelves al principio del tramo. La próxima tirada trae otras preguntas.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={onRetry} className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-yellow-300">
              Reintentar el tramo
            </button>
            <button type="button" onClick={onExit} className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:border-gray-400">
              Volver al camino
            </button>
          </div>
        </div>
      ) : (
        answered && (
          <div className="mt-4 flex justify-end">
            <button type="button" onClick={advance} autoFocus className="rounded-lg bg-yellow-400 px-5 py-2 font-semibold text-gray-950 hover:bg-yellow-300">
              {idx + 1 < questions.length ? 'Siguiente pregunta →' : 'Terminar el tramo'}
            </button>
          </div>
        )
      )}
    </div>
  );
}
