import { TRACKS, findTrack } from '../lessons';
import { useProgress } from '../store/progress';
import { href } from '../hooks/useRoute';
import { ALL_QUESTIONS } from '../data/exams';
import { topicLabel } from '../data/topics';
import { findTema } from '../data/temario';

export function TracksPage() {
  const lessons = useProgress((s) => s.lessons);
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100">Aprende</h1>
      <p className="mt-1 max-w-2xl text-gray-400">
        Rutas ordenadas de menos a más. Si nunca has tocado la informática, empieza por «Empieza desde cero». Cada lección enlaza con
        las preguntas reales del examen que cubre.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TRACKS.map((t) => {
          const done = t.lessons.filter((l) => lessons[l.id]?.done).length;
          const nQ = ALL_QUESTIONS.filter((q) => t.topics.includes(q.topic)).length;
          return (
            <a
              key={t.id}
              href={href(`aprende/${t.id}`)}
              className="group flex flex-col rounded-xl border border-gray-700 bg-gray-900 p-5 transition-colors hover:border-yellow-400"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-gray-800 font-mono text-yellow-400">{t.icon}</span>
                <h2 className="font-semibold text-gray-100 group-hover:text-yellow-300">{t.title}</h2>
              </div>
              <p className="mt-3 flex-1 text-sm text-gray-400">{t.description}</p>
              <div className="mt-4 text-xs text-gray-500">
                {t.lessons.length ? (
                  <>
                    <div className="mb-1 flex justify-between">
                      <span>
                        {done}/{t.lessons.length} lecciones
                      </span>
                      <span>{nQ} preguntas de examen</span>
                    </div>
                    <div className="h-1.5 rounded bg-gray-800">
                      <div className="h-1.5 rounded bg-green-500" style={{ width: `${(done / t.lessons.length) * 100}%` }} />
                    </div>
                  </>
                ) : (
                  <span className="rounded bg-gray-800 px-2 py-0.5">Próximamente · ya puedes practicar sus {nQ} preguntas</span>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function TrackPage({ trackId }) {
  const track = findTrack(trackId);
  const lessons = useProgress((s) => s.lessons);
  if (!track) return <NotFound />;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <a href={href('aprende')} className="text-sm text-gray-400 hover:text-gray-200">
        ← Rutas
      </a>
      <h1 className="mt-2 text-2xl font-bold text-gray-100">{track.title}</h1>
      <p className="mt-1 text-gray-400">{track.description}</p>

      <TemasDeLaRuta ids={track.temas} />

      {track.lessons.length > 0 ? (
        <ol className="mt-6 space-y-2">
          {track.lessons.map((l, i) => {
            const done = lessons[l.id]?.done;
            return (
              <li key={l.id}>
                <a
                  href={href(`aprende/${track.id}/${l.id}`)}
                  className="flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-900 p-4 hover:border-yellow-400"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                      done ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-100">{l.title}</p>
                    <p className="text-sm text-gray-400">{l.summary}</p>
                  </div>
                  <span className="ml-auto shrink-0 rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                    {{ terminal: 'práctica', sql: 'práctica SQL', ios: 'práctica Cisco IOS', drill: 'ejercicios', match: 'emparejar' }[l.type] ?? 'lectura + test'}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-gray-700 p-6 text-gray-300">
          <p>Las lecciones prácticas de esta ruta llegarán en una próxima entrega. Mientras tanto, repasa sus fichas del temario (arriba) y practica sus preguntas reales de examen:</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {track.topics.map((t) => (
              <a key={t} href={href('preguntas', { tema: t })} className="rounded-full bg-gray-800 px-3 py-1 text-sm text-yellow-300 hover:bg-gray-700">
                {topicLabel(t)} →
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TemasDeLaRuta({ ids = [] }) {
  const lessons = useProgress((s) => s.lessons);
  const temas = ids.map(findTema).filter(Boolean);
  if (!temas.length) return null;
  return (
    <div className="mt-4 rounded-xl border border-gray-800 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Fichas del temario oficial</p>
      <div className="flex flex-wrap gap-2">
        {temas.map((t) => (
          <a key={t.id} href={href(`temario/${t.id}`)} className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-200 hover:bg-gray-700">
            <span className="font-mono text-yellow-400">{t.roman}.{t.n}</span> {t.short}
            {lessons[t.id]?.done && <span className="ml-1 text-green-400">✓</span>}
          </a>
        ))}
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center text-gray-300">
      <p className="text-lg">No encuentro esta página.</p>
      <a href={href('')} className="mt-4 inline-block text-yellow-400">
        Volver al inicio
      </a>
    </div>
  );
}
