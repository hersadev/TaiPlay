// Preguntas para los tests por tema: reúne, para unos temas dados, las
// preguntas reales del banco (con la respuesta de la plantilla oficial),
// las del test de cada ficha del temario y otras generadas a partir de las
// tarjetas de memorización. Todas quedan con la misma forma:
//   { id, source: 'examen'|'ficha'|'tarjeta', text, options, answer (índice), why, label }

import { TARJETAS, RELLENO } from '../../data/legislacion/tarjetas.js';

const shuffle = (list, rng) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
// Una opción falsa no vale si coincide con la buena o una contiene a la otra
// («Mayoría absoluta del Congreso» frente a «… en una votación final»).
// Plazos que significan lo mismo tampoco pueden ir juntos.
const SAME = [['1 mes', '30 días']];
const clashes = (a, b) =>
  norm(a).includes(norm(b)) || norm(b).includes(norm(a)) || SAME.some((pair) => pair.includes(norm(a)) && pair.includes(norm(b)));

export function distractorsFor(card, rng = Math.random, deck = TARJETAS) {
  if (card.wrong) return card.wrong.slice(0, 3);
  const pool = [...new Set([...deck.filter((c) => c.kind === card.kind && c.id !== card.id).map((c) => c.a), ...(RELLENO[card.kind] ?? [])])];
  const picked = [];
  for (const cand of shuffle(pool, rng)) {
    if (picked.length === 3) break;
    if (clashes(cand, card.a) || picked.some((p) => clashes(p, cand))) continue;
    picked.push(cand);
  }
  return picked;
}

export function cardQuestion(card, rng = Math.random, deck = TARJETAS) {
  const options = shuffle([card.a, ...distractorsFor(card, rng, deck)], rng);
  return {
    id: `tarjeta:${card.id}`,
    source: 'tarjeta',
    text: card.q,
    options,
    answer: options.indexOf(card.a),
    why: `${card.a} (${card.src}).`,
    label: 'Dato para memorizar',
  };
}

const LETTERS = 'abcd';

// questions: preguntas del banco (ALL_QUESTIONS); temas: fichas (TEMAS).
export function buildPool(temaIds, { questions = [], temas = [], rng = Math.random } = {}) {
  const want = new Set(temaIds);
  const exam = questions
    .filter((q) => want.has(q.tema) && !q.annulled && q.answer)
    .map((q) => ({
      id: q.id,
      source: 'examen',
      text: q.text,
      options: q.options,
      answer: LETTERS.indexOf(q.answer),
      why: q.explanation,
      label: `${q.examTitle ?? 'Examen'} · ${q.partTitle ?? ''}`.replace(/ · $/, ''),
    }));
  const ficha = temas
    .filter((t) => want.has(t.id))
    .flatMap((t) =>
      t.quiz.map((q, i) => ({ id: `ficha:${t.id}:${i}`, source: 'ficha', text: q.q, options: q.options, answer: q.answer, why: q.why, label: `Ficha ${t.id}` })),
    );
  const cards = TARJETAS.filter((c) => want.has(c.tema)).map((c) => cardQuestion(c, rng));
  return { exam, ficha, cards };
}

// Una ronda: mezcla equilibrada de las tres fuentes (prioridad a las de
// examen), barajada.
export function drawRound(pool, size = 10, rng = Math.random) {
  const exam = shuffle(pool.exam, rng);
  const ficha = shuffle(pool.ficha, rng);
  const cards = shuffle(pool.cards, rng);
  const nExam = Math.min(exam.length, Math.ceil(size * 0.4));
  const nFicha = Math.min(ficha.length, Math.ceil(size * 0.2));
  const picked = [...exam.slice(0, nExam), ...ficha.slice(0, nFicha)];
  const rest = [...cards, ...exam.slice(nExam), ...ficha.slice(nFicha)];
  picked.push(...rest.slice(0, size - picked.length));
  return shuffle(picked, rng);
}
