import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TARJETAS } from '../src/data/legislacion/tarjetas.js';
import { review, sessionQueue, deckStats, addDays, isDue } from '../src/engine/repaso/srs.js';
import { buildPool, drawRound, distractorsFor } from '../src/engine/repaso/pool.js';
import { seeded } from '../src/engine/drills/random.js';
import { TEMAS } from '../src/data/temario/index.js';
import { ALL_LESSONS } from '../src/lessons/index.js';
import { readFileSync } from 'node:fs';

const exams = ['tai2024A', 'tai2025A'].map((id) => JSON.parse(readFileSync(new URL(`../src/data/exams/${id}.json`, import.meta.url))));
const QUESTIONS = exams.flatMap((e) => e.parts.flatMap((p) => p.questions.map((q) => ({ ...q, examTitle: e.title, partTitle: p.title }))));

test('tarjetas: ids únicos, tema válido y fuente', () => {
  const ids = TARJETAS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  const temas = new Set(TEMAS.map((t) => t.id));
  for (const c of TARJETAS) {
    assert.ok(temas.has(c.tema), c.id);
    assert.ok(c.q && c.a && c.src && c.kind, c.id);
    if (c.wrong) assert.ok(c.wrong.length >= 3 && !c.wrong.includes(c.a), c.id);
  }
});

test('cada tarjeta tiene 3 opciones falsas distintas que no se confunden con la buena', () => {
  const rng = seeded(9);
  for (const c of TARJETAS) {
    for (let k = 0; k < 20; k++) {
      const d = distractorsFor(c, rng);
      assert.equal(d.length, 3, c.id);
      assert.equal(new Set([c.a, ...d]).size, 4, `${c.id}: ${d}`);
      assert.ok(!(['1 mes', '30 días'].every((x) => [c.a, ...d].includes(x))), `${c.id}: 1 mes y 30 días juntos`);
      const low = c.a.toLowerCase();
      if (!c.wrong) for (const x of d) assert.ok(!low.includes(x.toLowerCase()) && !x.toLowerCase().includes(low), `${c.id}: «${x}»`);
    }
  }
});

test('Leitner: sube al acertar, vuelve a la 1 al fallar', () => {
  const day = '2026-11-09';
  let s = review(undefined, true, day);
  assert.deepEqual(s, { box: 1, due: '2026-11-10', ok: 1, ko: 0 });
  s = review(s, true, '2026-11-10');
  assert.equal(s.box, 2);
  assert.equal(s.due, '2026-11-13');
  s = review(s, false, '2026-11-13');
  assert.equal(s.box, 1);
  assert.equal(s.due, '2026-11-13');
  assert.ok(isDue(s, '2026-11-13'));
  for (let k = 0; k < 10; k++) s = review(s, true, day);
  assert.equal(s.box, 5);
  assert.equal(addDays('2026-12-30', 3), '2027-01-02');
});

test('sesión: primero las pendientes y luego las nuevas con tope', () => {
  const cards = TARJETAS.slice(0, 30);
  const states = { [cards[5].id]: { box: 2, due: '2026-11-01' }, [cards[6].id]: { box: 1, due: '2026-11-08' }, [cards[7].id]: { box: 3, due: '2026-12-01' } };
  const q = sessionQueue(cards, states, '2026-11-09', 10);
  assert.deepEqual(q.slice(0, 2).map((c) => c.id), [cards[5].id, cards[6].id]);
  assert.equal(q.length, 12);
  assert.ok(!q.includes(cards[7]));
  const st = deckStats(cards, states, '2026-11-09');
  assert.deepEqual([st.pendientes, st.nuevas, st.vistas], [2, 27, 3]);
});

for (const lesson of ALL_LESSONS.filter((l) => l.type === 'test')) {
  test(`test ${lesson.id}: hay preguntas de las tres fuentes y rondas válidas`, () => {
    const pool = buildPool(lesson.temas, { questions: QUESTIONS, temas: TEMAS, rng: seeded(1) });
    assert.ok(pool.exam.length >= 5 && pool.ficha.length >= 3 && pool.cards.length >= 8, lesson.id);
    for (const q of [...pool.exam, ...pool.ficha, ...pool.cards]) {
      assert.ok(q.answer >= 0 && q.answer < q.options.length, q.id);
      assert.ok(q.options.length >= 3, q.id);
    }
    const r = drawRound(pool, 10, seeded(2));
    assert.equal(r.length, 10);
    assert.equal(new Set(r.map((q) => q.id)).size, 10);
    assert.ok(r.some((q) => q.source === 'examen'));
  });
}

test('el repaso cubre todas las tarjetas de sus temas', () => {
  const l = ALL_LESSONS.find((x) => x.id === 'lg-repaso');
  assert.equal(TARJETAS.filter((c) => l.temas.includes(c.tema)).length, TARJETAS.length);
});

// --- Repaso espaciado de las preguntas falladas del banco.
test('falladas: entran al fallar y salen tras tres aciertos en días distintos', async () => {
  const { nextRepaso, inRepaso, isDueRepaso, repasoQueue, repasoStats } = await import('../src/engine/repaso/falladas.js');
  const answer = (a, ok, day) => ({ ...(a ?? { ok: 0, ko: 0 }), ok: (a?.ok ?? 0) + (ok ? 1 : 0), ko: (a?.ko ?? 0) + (ok ? 0 : 1), ...nextRepaso(a, ok, day) });

  let a = answer(null, true, '2026-11-10');
  assert.ok(!inRepaso(a), 'acertada a la primera: no entra');
  a = answer(a, false, '2026-11-10');
  assert.ok(isDueRepaso(a, '2026-11-10'), 'al fallar toca hoy');
  a = answer(a, true, '2026-11-10');
  assert.equal(a.due, '2026-11-13');
  const same = answer(a, true, '2026-11-10');
  assert.deepEqual([same.box, same.due], [a.box, a.due], 'acertar antes de tiempo no adelanta');
  assert.ok(!isDueRepaso(a, '2026-11-12') && isDueRepaso(a, '2026-11-13'));
  a = answer(a, true, '2026-11-13');
  assert.equal(a.due, '2026-11-20');
  assert.ok(inRepaso(a));
  a = answer(a, true, '2026-11-20');
  assert.ok(!inRepaso(a), 'tres aciertos seguidos: superada');
  a = answer(a, false, '2026-12-01');
  assert.ok(isDueRepaso(a, '2026-12-01'), 'si se vuelve a fallar, vuelve a entrar');

  // Respuestas antiguas, sin caja: si se fallaron, están pendientes ya.
  const answers = { a: { ok: 1, ko: 2, last: 'ok' }, b: { ok: 3, ko: 0, last: 'ok' }, c: { ok: 0, ko: 1, last: 'ko', box: 1, due: '2026-11-15' } };
  const qs = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd', annulled: true }];
  assert.deepEqual(repasoQueue(qs, answers, '2026-11-10').map((q) => q.id), ['a']);
  assert.deepEqual(repasoStats(qs, answers, '2026-11-10'), { pendientes: 1, enRepaso: 2, superadas: 0 });
});
