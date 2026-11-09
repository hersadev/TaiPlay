import { useEffect, useState } from 'react';

// Test corto de comprobación (lecciones de lectura y fichas del temario).
// Se puede reintentar cada pregunta hasta acertarla; cuando están todas
// bien se llama a onComplete una vez.
export default function ConceptQuiz({ quiz, done, onComplete }) {
  const [picks, setPicks] = useState({});
  const allRight = quiz.every((q, i) => picks[i] === q.answer);

  useEffect(() => {
    if (allRight && !done) onComplete();
  }, [allRight, done, onComplete]);

  return (
    <section className="rounded-xl border border-gray-700 bg-gray-900 p-4 sm:p-5">
      <h2 className="font-semibold text-gray-100">Comprueba que lo has entendido</h2>
      <p className="mb-4 text-sm text-gray-400">Acierta todas para completarlo. Si fallas, vuelve a intentarlo.</p>
      <ol className="space-y-5">
        {quiz.map((q, i) => {
          const pick = picks[i];
          return (
            <li key={q.q}>
              <p className="mb-2 font-medium text-gray-100">
                {i + 1}. {q.q}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((o, j) => {
                  const chosen = pick === j;
                  const tone = chosen
                    ? j === q.answer
                      ? 'border-green-500 bg-green-900/40'
                      : 'border-red-400 bg-red-800/30'
                    : 'border-gray-700 hover:border-gray-500';
                  return (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setPicks((p) => ({ ...p, [i]: j }))}
                      disabled={pick === q.answer}
                      className={`rounded-lg border px-3 py-2 text-left text-sm text-gray-200 ${tone}`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              {pick !== undefined && (
                <p className={`mt-2 text-sm ${pick === q.answer ? 'text-green-300' : 'text-red-300'}`}>
                  {pick === q.answer ? `✓ ${q.why}` : '✗ Prueba otra vez.'}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {(allRight || done) && <p className="mt-4 rounded-lg bg-green-900/50 p-2 text-sm text-green-200">¡Completado!</p>}
    </section>
  );
}
