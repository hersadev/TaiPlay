import { useState } from 'react';
import { EXAMS, ALL_QUESTIONS } from '../data/exams';
import { useProgress } from '../store/progress';
import { navigate } from '../hooks/useRoute';
import ExamRunner from '../components/exam/ExamRunner';

const PENALTIES = [
  [1 / 3, '−1/3 por error (cada 3 fallos restan un acierto)'],
  [1 / 4, '−1/4 por error'],
  [0, 'Sin penalización'],
];

// Simulacro del ejercicio único: la primera parte completa más UNO de los dos
// supuestos (en el examen real se elige uno), con cronómetro.
export default function SimulacroPage() {
  const { settings, updateSettings, attempts } = useProgress();
  const [examId, setExamId] = useState(EXAMS[0].id);
  const [supuesto, setSupuesto] = useState('supuesto1');
  const [running, setRunning] = useState(false);
  const exam = EXAMS.find((e) => e.id === examId);

  if (running) {
    const questions = ALL_QUESTIONS.filter((q) => q.examId === examId && (q.partId === 'primera' || q.partId === supuesto));
    const partTitle = exam.parts.find((p) => p.id === supuesto).title;
    return (
      <ExamRunner
        title={`Simulacro · ${exam.title} (primera parte + ${partTitle})`}
        questions={questions}
        timeLimitMin={settings.simulacroMin}
        kind="simulacro"
        onExit={() => {
          setRunning(false);
          navigate('simulacro');
        }}
      />
    );
  }

  const history = attempts.filter((a) => a.kind === 'simulacro').slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100">Simulacro de examen</h1>
      <p className="mt-1 text-gray-400">
        El ejercicio completo, en condiciones de examen: las 80 preguntas de la primera parte (más las de reserva) y uno de los dos
        supuestos, contra el reloj.
      </p>

      <div className="mt-6 space-y-5 rounded-xl border border-gray-700 bg-gray-900 p-5">
        <Choice label="Examen" value={examId} onChange={setExamId} options={EXAMS.map((e) => [e.id, e.title])} />
        <Choice
          label="Supuesto"
          value={supuesto}
          onChange={setSupuesto}
          options={exam.parts.filter((p) => p.id !== 'primera').map((p) => [p.id, `${p.title}: ${p.context[0].slice(0, 90)}…`])}
        />
        <details className="text-sm">
          <summary className="cursor-pointer text-gray-300">Ajustes</summary>
          <div className="mt-3 space-y-4">
            <Choice
              label="Penalización por error"
              value={String(settings.penalty)}
              onChange={(v) => updateSettings({ penalty: Number(v) })}
              options={PENALTIES.map(([v, l]) => [String(v), l])}
            />
            <NumberField label="Duración del simulacro (min)" value={settings.simulacroMin} onChange={(v) => updateSettings({ simulacroMin: v })} />
            <NumberField label="Duración de un supuesto suelto (min)" value={settings.supuestoMin} onChange={(v) => updateSettings({ supuestoMin: v })} />
            <p className="text-xs text-gray-500">
              Por defecto, lo que fijan las bases de la convocatoria de 2025 para el ingreso libre: −1/3 por error y 120 minutos para
              el ejercicio completo. En promoción interna son −1/4 y 90 minutos. Ajústalo si tu convocatoria dice otra cosa.
            </p>
          </div>
        </details>
        <button type="button" onClick={() => setRunning(true)} className="rounded-lg bg-yellow-400 px-5 py-2 font-semibold text-gray-950 hover:bg-yellow-300">
          Empezar simulacro ({settings.simulacroMin} min)
        </button>
      </div>

      {history.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 font-semibold text-gray-100">Tus últimos simulacros</h2>
          <ul className="divide-y divide-gray-800 rounded-xl border border-gray-800 text-sm">
            {history.map((a) => (
              <li key={a.at} className="flex flex-wrap justify-between gap-2 px-4 py-2 text-gray-300">
                <span className="min-w-0 truncate">{a.title.replace('Simulacro · ', '')}</span>
                <span className="text-gray-400">
                  {new Date(a.at).toLocaleDateString('es-ES')} · <span className="text-yellow-300">{a.net.toFixed(2)}</span> netos de {a.total}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Choice({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 focus:border-yellow-400 focus:outline-none"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <input
        type="number"
        min={5}
        max={300}
        value={value}
        onChange={(e) => onChange(Math.max(5, Math.min(300, Number(e.target.value) || 5)))}
        className="w-32 rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 focus:border-yellow-400 focus:outline-none"
      />
    </label>
  );
}
