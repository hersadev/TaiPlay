import { useMemo, useState } from 'react';
import { useProgress } from '../../store/progress';
import { TARJETAS } from '../../data/legislacion/tarjetas.js';
import { sessionQueue, deckStats, INTERVALS, MAX_BOX } from '../../engine/repaso/srs.js';
import { findTema } from '../../data/temario';
import { today } from '../../utils/dates';

const NEW_PER_SESSION = 15;

// Repaso espaciado de las tarjetas de legislación. La cola se calcula al
// empezar la sesión (y al pedir más); las falladas se repiten al final.
export default function Flashcards({ temas }) {
  const states = useProgress((s) => s.cards);
  const reviewCard = useProgress((s) => s.reviewCard);
  const [filter, setFilter] = useState('todos');
  const deck = useMemo(() => TARJETAS.filter((c) => temas.includes(c.tema) && (filter === 'todos' || c.tema === filter)), [temas, filter]);
  const day = today();
  const stats = deckStats(deck, states, day);
  const [queue, setQueue] = useState(null);
  const [shown, setShown] = useState(false);
  const [session, setSession] = useState({ ok: 0, ko: 0 });

  const start = (extraNew = NEW_PER_SESSION) => {
    setQueue(sessionQueue(deck, states, day, extraNew));
    setShown(false);
    setSession({ ok: 0, ko: 0 });
  };

  const card = queue?.[0];
  const answer = (ok) => {
    reviewCard(card.id, ok);
    setSession((s) => ({ ok: s.ok + (ok ? 1 : 0), ko: s.ko + (ok ? 0 : 1) }));
    // Las falladas vuelven a salir unas tarjetas más tarde.
    setQueue((q) => {
      const rest = q.slice(1);
      if (ok) return rest;
      const at = Math.min(rest.length, 3);
      return [...rest.slice(0, at), card, ...rest.slice(at)];
    });
    setShown(false);
  };

  const temaChips = ['todos', ...temas];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2" aria-label="Filtrar por tema">
        {temaChips.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={filter === t}
            onClick={() => {
              setFilter(t);
              setQueue(null);
            }}
            className={`rounded-full border px-3 py-1 text-xs ${filter === t ? 'border-yellow-400 text-yellow-300' : 'border-gray-600 text-gray-300 hover:border-gray-400'}`}
          >
            {t === 'todos' ? 'Todos los temas' : `${t.replace('B1T0', 'Tema ')} · ${findTema(t)?.short ?? ''}`}
          </button>
        ))}
      </div>

      <dl className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
        {[
          ['Para hoy', stats.pendientes],
          ['Nuevas', stats.nuevas],
          ['Vistas', `${stats.vistas}/${stats.total}`],
          ['Dominadas', stats.dominadas],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border border-gray-700 bg-gray-900 p-2">
            <dt className="text-xs text-gray-400">{k}</dt>
            <dd className="text-lg font-semibold text-gray-100">{v}</dd>
          </div>
        ))}
      </dl>

      {!queue && (
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5 text-center">
          <p className="text-gray-300">
            {stats.pendientes + Math.min(stats.nuevas, NEW_PER_SESSION) > 0
              ? `Hoy tocan ${stats.pendientes} tarjeta${stats.pendientes === 1 ? '' : 's'} de repaso y hasta ${Math.min(stats.nuevas, NEW_PER_SESSION)} nueva${Math.min(stats.nuevas, NEW_PER_SESSION) === 1 ? '' : 's'}.`
              : '¡Al día! No te toca ninguna tarjeta. Vuelve mañana.'}
          </p>
          {stats.pendientes + stats.nuevas > 0 && (
            <button type="button" onClick={() => start()} className="mt-3 rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-gray-950 hover:bg-yellow-300">
              Empezar el repaso
            </button>
          )}
        </div>
      )}

      {queue && card && (
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400">
            <span>
              {findTema(card.tema)?.short} · {states[card.id] ? `caja ${states[card.id].box} de ${MAX_BOX}` : 'nueva'}
            </span>
            <span>Quedan {queue.length}</span>
          </div>
          <p className="text-lg font-medium text-gray-100">{card.q}</p>
          {shown ? (
            <>
              <p className="mt-4 rounded-lg bg-gray-800 p-3 text-lg text-yellow-200">{card.a}</p>
              <p className="mt-1 text-xs text-gray-400">{card.src}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => answer(false)} className="rounded-lg border border-red-400 px-3 py-2 text-red-200 hover:bg-red-900/30">
                  ✗ No la sabía
                </button>
                <button type="button" onClick={() => answer(true)} className="rounded-lg border border-green-500 px-3 py-2 text-green-200 hover:bg-green-900/30">
                  ✓ La sabía
                  <span className="block text-xs text-green-300/70">vuelve en {INTERVALS[Math.min(MAX_BOX, (states[card.id]?.box ?? 0) + 1)]} d</span>
                </button>
              </div>
            </>
          ) : (
            <button type="button" onClick={() => setShown(true)} className="mt-4 w-full rounded-lg bg-yellow-400 px-4 py-2 font-semibold text-gray-950 hover:bg-yellow-300">
              Mostrar la respuesta
            </button>
          )}
        </div>
      )}

      {queue && !card && (
        <div className="rounded-xl border border-green-700 bg-green-900/30 p-5 text-center text-green-100">
          <p className="font-semibold">Sesión terminada</p>
          <p className="mt-1 text-sm">
            {session.ok} acierto{session.ok === 1 ? '' : 's'} y {session.ko} fallo{session.ko === 1 ? '' : 's'}. Las que fallaste volverán mañana.
          </p>
          {stats.nuevas > 0 && (
            <button type="button" onClick={() => start(NEW_PER_SESSION)} className="mt-3 rounded-lg border border-green-600 px-4 py-2 text-sm hover:border-green-400">
              Quiero {Math.min(stats.nuevas, NEW_PER_SESSION)} nuevas más
            </button>
          )}
        </div>
      )}
    </section>
  );
}
