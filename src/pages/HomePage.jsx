import { ALL_LESSONS, TRACKS } from '../lessons';
import { ALL_QUESTIONS } from '../data/exams';
import { useProgress } from '../store/progress';
import { href } from '../hooks/useRoute';
import { TARJETAS } from '../data/legislacion/tarjetas.js';
import { deckStats } from '../engine/repaso/srs.js';
import { today } from '../utils/dates';
import { SECTIONS } from '../data/secciones';


export default function HomePage() {
  const { lessons, answers, attempts, cards } = useProgress();
  const repaso = deckStats(TARJETAS, cards, today());
  const doneLessons = ALL_LESSONS.filter((l) => lessons[l.id]?.done).length;
  const seen = Object.values(answers);
  const ok = seen.filter((a) => a.last === 'ok').length;
  const nextLesson = ALL_LESSONS.find((l) => !lessons[l.id]?.done);
  const failed = seen.filter((a) => a.last === 'ko').length;
  const isNew = doneLessons === 0 && seen.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="max-w-3xl">
        <p className="font-mono text-sm text-green-400">alumno@taiplay:~$ ./preparar-tai</p>
        <h1 className="mt-2 text-3xl font-bold text-gray-100 sm:text-4xl">Prepara el TAI practicando, aunque partas de cero</h1>
        <p className="mt-3 text-lg text-gray-400">
          Aprende cada tema con explicaciones sencillas y ejercicios guiados, practica con las {ALL_QUESTIONS.length} preguntas reales de
          los últimos exámenes y ensaya los supuestos prácticos en condiciones de examen. Todo se guarda en tu navegador.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {nextLesson && (
            <a
              href={href(`aprende/${nextLesson.trackId}/${nextLesson.id}`)}
              className="rounded-lg bg-yellow-400 px-5 py-2.5 font-semibold text-gray-950 hover:bg-yellow-300"
            >
              {isNew ? 'Empezar por la primera lección' : `Seguir: ${nextLesson.title}`} →
            </a>
          )}
          <a href={href('preguntas')} className="rounded-lg border border-gray-600 px-5 py-2.5 text-gray-200 hover:border-gray-400">
            Ir directo a las preguntas
          </a>
        </div>
      </section>

      {!isNew && (
        <section className="mt-8 grid gap-3 sm:grid-cols-4">
          <Stat value={`${doneLessons}/${ALL_LESSONS.length}`} label="lecciones completadas" />
          <Stat value={`${seen.length}/${ALL_QUESTIONS.length}`} label="preguntas practicadas" />
          <Stat value={seen.length ? `${Math.round((ok / seen.length) * 100)} %` : '—'} label="aciertos (último intento)" />
          <Stat value={attempts.length} label="supuestos y simulacros hechos" />
        </section>
      )}
      {failed > 0 && (
        <a href={href('preguntas', { estado: 'falladas' })} className="mt-3 inline-block text-sm text-red-300 hover:text-red-200">
          Tienes {failed} preguntas falladas pendientes de repasar →
        </a>
      )}
      {repaso.pendientes > 0 && (
        <a href={href('aprende/legislacion/lg-repaso')} className="mt-3 block text-sm text-yellow-300 hover:text-yellow-200">
          Te toca repasar {repaso.pendientes} tarjeta{repaso.pendientes === 1 ? '' : 's'} de legislación hoy →
        </a>
      )}

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <a key={s.path} href={href(s.path)} className="group rounded-xl border border-gray-700 bg-gray-900 p-5 hover:border-yellow-400">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-gray-800 font-mono text-lg text-yellow-400">{s.icon}</span>
            <h2 className="mt-3 font-semibold text-gray-100 group-hover:text-yellow-300">{s.title}</h2>
            <p className="mt-1 text-sm text-gray-400">{s.text}</p>
          </a>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-semibold text-gray-100">Rutas de aprendizaje</h2>
        <div className="flex flex-wrap gap-2">
          {TRACKS.map((t) => (
            <a key={t.id} href={href(`aprende/${t.id}`)} className="rounded-full border border-gray-700 px-3 py-1 text-sm text-gray-300 hover:border-yellow-400">
              <span className="mr-1 font-mono text-yellow-400">{t.icon}</span> {t.title}
              {!t.lessons.length && <span className="ml-1 text-gray-500">(pronto)</span>}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
      <p className="text-2xl font-semibold text-gray-100">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
