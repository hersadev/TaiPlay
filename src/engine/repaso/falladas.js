// Repaso espaciado de las preguntas del banco que se han fallado alguna
// vez. Usa las mismas cajas que las tarjetas (srs.js), guardadas en cada
// respuesta (answers[id].box y .due):
//   - al fallar, la pregunta vuelve a la caja 1 y toca repasarla hoy;
//   - cada acierto, cuando toca, la sube de caja y la aleja (3 días, luego 7);
//   - al llegar a la caja de «dominada» sale del repaso. Son tres aciertos
//     seguidos, en días distintos.
// Las respuestas guardadas antes de existir el repaso no tienen caja: si
// se fallaron alguna vez, cuentan como caja 1 y pendientes ya.

import { MASTERED_BOX, review } from './srs.js';

const boxOf = (a) => a.box ?? (a.ko ? 1 : 0);

export const inRepaso = (a) => Boolean(a) && a.ko > 0 && boxOf(a) < MASTERED_BOX;
export const isDueRepaso = (a, day) => inRepaso(a) && (a.due ?? '') <= day;

// Preguntas que tocan hoy, las más atrasadas primero.
export function repasoQueue(questions, answers, day) {
  return questions
    .filter((q) => !q.annulled && isDueRepaso(answers[q.id], day))
    .sort((a, b) => (answers[a.id].due ?? '').localeCompare(answers[b.id].due ?? ''));
}

export function repasoStats(questions, answers, day) {
  let pendientes = 0;
  let enRepaso = 0;
  let superadas = 0;
  for (const q of questions) {
    const a = answers[q.id];
    if (q.annulled || !a?.ko) continue;
    if (inRepaso(a)) {
      enRepaso++;
      if (isDueRepaso(a, day)) pendientes++;
    } else superadas++;
  }
  return { pendientes, enRepaso, superadas };
}

// Caja y fecha tras contestar (lo usa el store). Acertar una pregunta que
// aún no toca no la adelanta: si no, bastaría con acertarla tres veces
// seguidas el mismo día para sacarla del repaso.
export function nextRepaso(a, ok, day) {
  if (ok && a?.due && a.due > day) return { box: a.box, due: a.due };
  const { box, due } = review({ box: a ? boxOf(a) : 0, ok: 0, ko: 0 }, ok, day);
  return { box, due };
}
