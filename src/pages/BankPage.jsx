import { useMemo, useState } from 'react';
import { ALL_QUESTIONS, EXAMS } from '../data/exams';
import { TOPICS, topicLabel } from '../data/topics';
import { BLOQUES, temaLabel, findTema } from '../data/temario';
import { useProgress } from '../store/progress';
import { navigate } from '../hooks/useRoute';
import QuestionCard from '../components/quiz/QuestionCard';
import { repasoQueue, repasoStats } from '../engine/repaso/falladas.js';
import { today } from '../utils/dates';

// Banco de preguntas reales: filtras por tema, examen y estado, y practicas
// una a una con corrección y explicación inmediatas. Los filtros viven en la
// URL (#/preguntas?tema=so) para poder enlazarlos desde las lecciones.
function shuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function BankPage({ params }) {
  const answers = useProgress((s) => s.answers);
  const tema = params.get('tema') ?? '';
  const programa = params.get('programa') ?? '';
  const examen = params.get('examen') ?? '';
  const parte = params.get('parte') ?? '';
  const estado = params.get('estado') ?? '';
  const orden = params.get('orden') ?? 'aleatorio';
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 233280));
  const [idx, setIdx] = useState(0);

  const set = (patch) => {
    setIdx(0);
    const next = { tema, programa, examen, parte, estado, orden, ...patch };
    navigate('preguntas', next);
  };

  // La lista se fija al cambiar los filtros (no al responder): si no, una
  // pregunta de «falladas» que aciertas desaparecería bajo tus pies.
  const list = useMemo(() => {
    // Repaso: solo las falladas que tocan hoy, las más atrasadas primero.
    if (estado === 'repaso') {
      return repasoQueue(ALL_QUESTIONS, answers, today()).filter(
        (q) =>
          (!tema || q.topic === tema) &&
          (!programa || q.tema === programa) &&
          (!examen || q.examId === examen) &&
          (!parte || (parte === 'primera' ? q.partId === 'primera' : q.partId !== 'primera')),
      );
    }
    const filtered = ALL_QUESTIONS.filter(
      (q) =>
        (!tema || q.topic === tema) &&
        (!programa || q.tema === programa) &&
        (!examen || q.examId === examen) &&
        (!parte || (parte === 'primera' ? q.partId === 'primera' : q.partId !== 'primera')) &&
        (!estado ||
          (estado === 'nuevas' && !answers[q.id]) ||
          (estado === 'falladas' && answers[q.id]?.last === 'ko')),
    );
    return orden === 'aleatorio' ? shuffle(filtered, seed) : filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema, programa, examen, parte, estado, orden, seed]);

  const q = list[Math.min(idx, list.length - 1)];
  const repaso = useMemo(() => repasoStats(ALL_QUESTIONS, answers, today()), [answers]);

  const stats = useMemo(
    () =>
      TOPICS.map((t) => {
        const qs = ALL_QUESTIONS.filter((x) => x.topic === t.id && !x.annulled);
        const seen = qs.filter((x) => answers[x.id]);
        const ok = seen.filter((x) => answers[x.id].last === 'ok').length;
        return { ...t, total: qs.length, seen: seen.length, ok };
      }),
    [answers],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-100">Banco de preguntas</h1>
      <p className="mt-1 text-gray-400">
        {ALL_QUESTIONS.length} preguntas reales de los exámenes TAI con la respuesta de la plantilla oficial definitiva y una explicación.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Filter label="Tema del programa" value={programa} onChange={(v) => set({ programa: v })}>
            <option value="">Todos</option>
            {BLOQUES.map((b) => (
              <optgroup key={b.n} label={`Bloque ${b.roman} · ${b.title}`}>
                {b.temas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {`${t.id.slice(3).replace(/^0/, '')}. ${t.short}`}
                  </option>
                ))}
              </optgroup>
            ))}
          </Filter>
          <Filter label="Materia" value={tema} onChange={(v) => set({ tema: v })}>
            <option value="">Todas las materias</option>
            {TOPICS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Filter>
          <Filter label="Examen" value={examen} onChange={(v) => set({ examen: v })}>
            <option value="">Todos</option>
            {EXAMS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </Filter>
          <Filter label="Parte" value={parte} onChange={(v) => set({ parte: v })}>
            <option value="">Todas</option>
            <option value="primera">Primera parte (teoría)</option>
            <option value="supuestos">Supuestos prácticos</option>
          </Filter>
          <Filter label="Estado" value={estado} onChange={(v) => set({ estado: v })}>
            <option value="">Todas</option>
            <option value="nuevas">Sin responder nunca</option>
            <option value="falladas">Falladas la última vez</option>
            <option value="repaso">Repaso de hoy ({repaso.pendientes})</option>
          </Filter>
          {estado === 'repaso' && (
            <p className="rounded-lg border border-gray-800 p-3 text-xs text-gray-400">
              Cada pregunta que fallas vuelve el mismo día. Si la aciertas, vuelve a los 3 días y después a los 7; al acertarla esas
              tres veces seguidas sale del repaso. Si la fallas, empieza de nuevo. Llevas {repaso.superadas} superada
              {repaso.superadas === 1 ? '' : 's'}.
            </p>
          )}
          <Filter label="Orden" value={orden} onChange={(v) => set({ orden: v })}>
            <option value="aleatorio">Aleatorio</option>
            <option value="examen">Como en el examen</option>
          </Filter>

          <div className="rounded-xl border border-gray-800 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Tu dominio por materia</p>
            <ul className="space-y-1.5">
              {stats.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => set({ tema: t.id })} className="w-full text-left text-xs">
                    <div className="flex justify-between text-gray-300">
                      <span className={tema === t.id ? 'text-yellow-300' : ''}>{t.label}</span>
                      <span className="text-gray-500">
                        {t.ok}/{t.total}
                      </span>
                    </div>
                    <div className="mt-0.5 h-1 rounded bg-gray-800">
                      <div className="h-1 rounded bg-green-500" style={{ width: `${(t.ok / Math.max(1, t.total)) * 100}%` }} />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          {!q ? (
            <div className="rounded-xl border border-dashed border-gray-700 p-8 text-center text-gray-400">
              No hay preguntas con estos filtros.
              {estado === 'falladas' && ' ¡No tienes ninguna fallada pendiente!'}
              {estado === 'repaso' &&
                (repaso.enRepaso
                  ? ` Hoy no te toca repasar ninguna. Tienes ${repaso.enRepaso} en repaso para los próximos días.`
                  : ' No tienes ninguna pregunta en repaso: las que falles entrarán aquí.')}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>
                  {Math.min(idx, list.length - 1) + 1} de {list.length}
                  {tema && ` · ${topicLabel(tema)}`}
                  {programa && ` · ${temaLabel(programa)}: ${findTema(programa)?.short ?? ''}`}
                </span>
                {orden === 'aleatorio' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSeed(Math.floor(Math.random() * 233280));
                      setIdx(0);
                    }}
                    className="text-gray-400 hover:text-gray-200"
                  >
                    ⤨ Barajar
                  </button>
                )}
              </div>
              <QuestionCard key={q.id + seed} question={q} mode="practice" showContext />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => setIdx(idx - 1)}
                  className="rounded-lg border border-gray-600 px-3 py-2 text-sm text-gray-200 disabled:opacity-40"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  disabled={idx >= list.length - 1}
                  onClick={() => setIdx(idx + 1)}
                  className="ml-auto rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-950 hover:bg-yellow-300 disabled:opacity-40"
                >
                  Siguiente →
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function Filter({ label, value, onChange, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:border-yellow-400 focus:outline-none"
      >
        {children}
      </select>
    </label>
  );
}
