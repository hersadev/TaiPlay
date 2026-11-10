import { useMemo } from 'react';
import { CATEGORIES, LOGROS, dayStreak, xpOf, levelOf } from '../data/logros';
import { useLogrosContext } from '../hooks/useAchievements';

export default function LogrosPage() {
  const { ctx, badges } = useLogrosContext();
  const level = useMemo(() => levelOf(xpOf(ctx, badges)), [ctx, badges]);
  const earned = LOGROS.filter((l) => badges[l.id]).length;
  const pct = level.to ? ((level.xp - level.from) / (level.to - level.from)) * 100 : 100;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100">Logros</h1>
      <p className="mt-1 text-gray-400">Cada lección, ficha, pregunta y simulacro suma. Aquí ves cuánto has avanzado y qué te queda por conseguir.</p>

      <section className="mt-6 grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-yellow-700/60 bg-gray-900 p-4 sm:col-span-2">
          <p className="text-xs uppercase tracking-wide text-gray-500">Nivel {level.n}</p>
          <p className="text-xl font-bold text-yellow-400">{level.name}</p>
          <div className="mt-3 h-2 rounded bg-gray-800">
            <div className="h-2 rounded bg-yellow-400" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {level.xp} puntos{level.to ? ` · ${level.to - level.xp} para el siguiente nivel` : ' · ¡nivel máximo!'}
          </p>
        </div>
        <Stat value={`${earned}/${LOGROS.length}`} label="logros conseguidos" />
        <Stat value={`${dayStreak(ctx.days)} 🔥`} label={`días seguidos estudiando (mejor racha de aciertos: ${ctx.streak.best})`} />
      </section>

      <p className="mt-3 text-xs text-gray-500">
        Puntos: 20 por lección, 15 por ficha del temario, 1 por pregunta respondida y 3 más si la aciertas, 25 por supuesto o
        simulacro, 15 por tramo del Road y 10 por logro.
      </p>

      {CATEGORIES.map((cat) => (
        <section key={cat.id} className="mt-8">
          <h2 className="mb-3 font-semibold text-gray-100">{cat.title}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LOGROS.filter((l) => l.cat === cat.id).map((l) => {
              const got = badges[l.id];
              const [cur, target] = l.progress?.(ctx) ?? [];
              return (
                <li
                  key={l.id}
                  className={`flex gap-3 rounded-xl border p-4 ${got ? 'border-yellow-700/60 bg-gray-900' : 'border-gray-800 bg-gray-900/50'}`}
                >
                  <span className={`text-3xl ${got ? '' : 'opacity-30 grayscale'}`} aria-hidden="true">
                    {l.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-semibold ${got ? 'text-gray-100' : 'text-gray-400'}`}>
                      {l.name}
                      {!got && <span className="sr-only"> (pendiente)</span>}
                    </p>
                    <p className="text-sm text-gray-400">{l.desc}</p>
                    {got ? (
                      <p className="mt-1 text-xs text-green-300">✓ Conseguido el {new Date(got).toLocaleDateString('es-ES')}</p>
                    ) : (
                      target > 1 && (
                        <div className="mt-2">
                          <div className="h-1.5 rounded bg-gray-800">
                            <div className="h-1.5 rounded bg-blue-400" style={{ width: `${(cur / target) * 100}%` }} />
                          </div>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {cur}/{target}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
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
