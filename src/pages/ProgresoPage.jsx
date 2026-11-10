import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_LESSONS } from '../lessons';
import { ALL_QUESTIONS } from '../data/exams';
import { BLOQUES, TEMAS } from '../data/temario';
import { useProgress } from '../store/progress';
import { href } from '../hooks/useRoute';
import { repasoStats } from '../engine/repaso/falladas.js';
import { simulacroSeries, weakTemas, coverage } from '../engine/progreso.js';
import { today } from '../utils/dates';

const pct = (x) => `${Math.round(x * 100)} %`;
const fecha = (at) => new Date(at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

// Panel de progreso: evolución en los simulacros, temas más flojos y cuánto
// se ha visto de cada bloque del programa.
export default function ProgresoPage() {
  const { lessons, answers, attempts } = useProgress();
  const series = useMemo(() => simulacroSeries(attempts), [attempts]);
  const weak = useMemo(() => weakTemas(ALL_QUESTIONS, answers, TEMAS), [answers]);
  const cover = useMemo(() => coverage(ALL_QUESTIONS, answers, BLOQUES, lessons), [answers, lessons]);
  const repaso = useMemo(() => repasoStats(ALL_QUESTIONS, answers, today()), [answers]);

  const seen = Object.keys(answers).length;
  const ok = Object.values(answers).filter((a) => a.last === 'ok').length;
  const lessonsDone = ALL_LESSONS.filter((l) => lessons[l.id]?.done).length;
  const fichasDone = TEMAS.filter((t) => lessons[t.id]?.done).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100">Tu progreso</h1>
      <p className="mt-1 text-gray-400">Cómo vas en los simulacros, qué temas te cuestan más y cuánto te queda por ver del programa.</p>

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat value={`${lessonsDone}/${ALL_LESSONS.length}`} label="lecciones completadas" />
        <Stat value={`${fichasDone}/${TEMAS.length}`} label="fichas del temario superadas" />
        <Stat value={`${seen}/${ALL_QUESTIONS.length}`} label="preguntas respondidas alguna vez" />
        <Stat value={seen ? pct(ok / seen) : '—'} label="aciertos en el último intento" />
        <a href={href('preguntas', { estado: 'repaso' })} className="col-span-2 rounded-xl border border-gray-800 bg-gray-900 p-4 hover:border-yellow-400 lg:col-span-1">
          <p className="text-2xl font-semibold text-gray-100">{repaso.pendientes}</p>
          <p className="text-xs text-gray-400">
            falladas para repasar hoy · {repaso.enRepaso} en repaso · {repaso.superadas} superadas
          </p>
        </a>
      </section>

      <section className="mt-8 rounded-xl border border-gray-700 bg-gray-900 p-5">
        <h2 className="font-semibold text-gray-100">Rendimiento en los simulacros</h2>
        <p className="mt-1 text-xs text-gray-500">Aciertos netos (ya restada la penalización) sobre el total de preguntas que puntúan.</p>
        {series.length ? (
          <>
            <LineChart points={series} />
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-gray-400 hover:text-gray-200">Ver como tabla</summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-gray-500">
                    <tr>
                      <th className="py-1 pr-3 font-normal">Fecha</th>
                      <th className="py-1 pr-3 font-normal">Simulacro</th>
                      <th className="py-1 pr-3 text-right font-normal">Netos</th>
                      <th className="py-1 text-right font-normal">Rendimiento</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    {[...series].reverse().map((p) => (
                      <tr key={p.at} className="border-t border-gray-800">
                        <td className="whitespace-nowrap py-1 pr-3">{fecha(p.at)}</td>
                        <td className="py-1 pr-3">{p.title}</td>
                        <td className="whitespace-nowrap py-1 pr-3 text-right font-mono">
                          {p.net.toFixed(2)}/{p.total}
                        </td>
                        <td className="py-1 text-right font-mono">{pct(p.pct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-gray-700 p-6 text-center text-sm text-gray-400">
            Aún no has hecho ningún simulacro.{' '}
            <a href={href('simulacro')} className="text-yellow-300 hover:text-yellow-200">
              Haz el primero
            </a>{' '}
            y aquí verás cómo evoluciona tu nota.
          </p>
        )}
      </section>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <h2 className="font-semibold text-gray-100">Tus temas más flojos</h2>
          <p className="mt-1 text-xs text-gray-500">Porcentaje de acierto en el último intento, entre los temas con al menos 3 preguntas respondidas.</p>
          {weak.length ? (
            <ul className="mt-4 space-y-3">
              {weak.map((w) => (
                <li key={w.tema.id} className="text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <a href={href(`temario/${w.tema.id}`)} className="min-w-0 truncate text-gray-200 hover:text-yellow-300" title={w.tema.title}>
                      <span className="text-gray-500">B{w.tema.bloque}·T{w.tema.n}</span> {w.tema.short}
                    </a>
                    <span className="shrink-0 font-mono text-gray-300">{pct(w.pct)}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-gray-800">
                    <div className="h-1.5 rounded-full bg-yellow-400" style={{ width: `${Math.max(2, w.pct * 100)}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500">
                    <span>
                      {w.ok} de {w.seen} respondidas bien · {w.total} en el banco
                    </span>
                    <a href={href('preguntas', { programa: w.tema.id })} className="text-yellow-300 hover:text-yellow-200">
                      Practicar →
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-gray-400">
              Responde unas cuantas preguntas en el{' '}
              <a href={href('preguntas')} className="text-yellow-300 hover:text-yellow-200">
                banco
              </a>{' '}
              para ver aquí qué temas te cuestan más.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-gray-700 bg-gray-900 p-5">
          <h2 className="font-semibold text-gray-100">Cuánto has visto del programa</h2>
          <p className="mt-1 text-xs text-gray-500">Preguntas del banco respondidas alguna vez y fichas del temario superadas, por bloque.</p>
          <ul className="mt-4 space-y-4">
            {cover.map((c) => (
              <li key={c.bloque.n} className="text-sm">
                <a href={href('temario')} className="text-gray-200 hover:text-yellow-300">
                  Bloque {c.bloque.roman} · {c.bloque.title}
                </a>
                <Meter label="Preguntas" value={c.preguntas.seen} total={c.preguntas.total} />
                <Meter label="Fichas" value={c.fichas.done} total={c.fichas.total} />
              </li>
            ))}
          </ul>
        </section>
      </div>
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

function Meter({ label, value, total }) {
  const frac = total ? value / total : 0;
  return (
    <div className="mt-2 grid grid-cols-[5rem_minmax(0,1fr)_4.5rem] items-center gap-3 text-xs">
      <span className="text-gray-400">{label}</span>
      <div className="h-1.5 rounded-full bg-gray-800" role="meter" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value} aria-label={label}>
        <div className="h-1.5 rounded-full bg-yellow-400" style={{ width: `${frac * 100}%`, minWidth: value ? '4px' : 0 }} />
      </div>
      <span className="text-right font-mono text-gray-300">
        {value}/{total}
      </span>
    </div>
  );
}

// Línea de rendimiento (0-100 %) por simulacro, en orden. Al pasar el ratón
// o el dedo, una guía vertical y una ficha con los datos del más cercano.
const H = 220;
const PAD = { top: 12, right: 16, bottom: 28, left: 40 };

function LineChart({ points }) {
  const box = useRef(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const innerW = width - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => PAD.top + (1 - v) * innerH;
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.pct).toFixed(1)}`).join(' ');

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - r.left;
    let best = 0;
    points.forEach((_, i) => {
      if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    });
    setHover(best);
  };

  const h = hover !== null ? points[hover] : null;
  const last = points[points.length - 1];

  return (
    <div ref={box} className="relative mt-4">
      <svg
        width={width}
        height={H}
        role="img"
        aria-label={`Rendimiento en ${points.length} simulacros; el último, ${pct(last.pct)}.`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        className="block max-w-full touch-pan-y"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(v)} y2={y(v)} stroke="rgb(var(--c-gray-800))" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-gray-500 text-[11px]">
              {v * 100}%
            </text>
          </g>
        ))}
        <text x={PAD.left} y={H - 8} className="fill-gray-500 text-[11px]">
          {fecha(points[0].at)}
        </text>
        {points.length > 1 && (
          <text x={width - PAD.right} y={H - 8} textAnchor="end" className="fill-gray-500 text-[11px]">
            {fecha(last.at)}
          </text>
        )}
        {h && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="rgb(var(--c-gray-600))" strokeWidth="1" />}
        <path d={path} fill="none" stroke="rgb(var(--c-yellow-400))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle
            key={p.at}
            cx={x(i)}
            cy={y(p.pct)}
            r={hover === i ? 5 : 4}
            fill="rgb(var(--c-yellow-400))"
            stroke="rgb(var(--c-gray-900))"
            strokeWidth="2"
          />
        ))}
      </svg>
      {h && (
        <div
          className="pointer-events-none absolute z-10 w-56 rounded-lg border border-gray-700 bg-gray-950 p-2 text-xs shadow-xl"
          style={{
            left: Math.min(Math.max(0, x(hover) - 112), width - 224),
            top: Math.max(0, y(h.pct) - 86),
          }}
        >
          <p className="text-gray-400">{fecha(h.at)}</p>
          <p className="line-clamp-2 text-gray-200">{h.title}</p>
          <p className="mt-1 font-mono text-gray-100">
            {pct(h.pct)} · {h.net.toFixed(2)}/{h.total} netos
          </p>
        </div>
      )}
    </div>
  );
}
