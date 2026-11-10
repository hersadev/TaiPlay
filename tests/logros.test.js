import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOGROS, CATEGORIES, newlyEarned, dayStreak, levelOf, xpOf } from '../src/data/logros.js';
import { today } from '../src/utils/dates.js';

const empty = () => ({ lessons: {}, answers: {}, attempts: [], streak: { current: 0, best: 0 }, days: [], questions: [] });

test('los logros tienen id único, categoría válida y no se conceden sin progreso', () => {
  const ids = LOGROS.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  const cats = new Set(CATEGORIES.map((c) => c.id));
  for (const l of LOGROS) assert.ok(cats.has(l.cat), l.id);
  assert.deepEqual(newlyEarned(empty(), {}), []);
});

test('se conceden al cumplir la condición y no se repiten', () => {
  const ctx = empty();
  ctx.lessons = { 'lx-terminal': { done: true }, B1T01: { done: true } };
  ctx.answers = { a: { ok: 1, ko: 1, last: 'ok' } };
  ctx.streak = { current: 12, best: 12 };
  ctx.days = [today()];
  const got = newlyEarned(ctx, {});
  for (const id of ['primer-paso', 'primera-respuesta', 'primer-dia', 'ficha-1', 'racha-10', 'remontada']) {
    assert.ok(got.includes(id), `falta ${id}`);
  }
  assert.ok(!got.includes('racha-25'));
  assert.deepEqual(newlyEarned(ctx, Object.fromEntries(got.map((id) => [id, 1]))), []);
});

test('tema dominado: todas las preguntas no anuladas del tema acertadas', () => {
  const ctx = empty();
  ctx.questions = [
    { id: 'q1', tema: 'B4T07' },
    { id: 'q2', tema: 'B4T07' },
    { id: 'q3', tema: 'B4T07' },
    { id: 'q4', tema: 'B4T07', annulled: true },
  ];
  ctx.answers = { q1: { last: 'ok' }, q2: { last: 'ok' } };
  assert.ok(!newlyEarned(ctx, {}).includes('tema-dominado'));
  ctx.answers.q3 = { last: 'ok' };
  assert.ok(newlyEarned(ctx, {}).includes('tema-dominado'));
});

test('racha de días: cuenta hasta hoy o hasta ayer', () => {
  const now = new Date(2026, 10, 9);
  const d = (n) => today(new Date(2026, 10, 9 - n));
  assert.equal(dayStreak([d(0), d(1), d(2)], now), 3);
  assert.equal(dayStreak([d(1), d(2)], now), 2); // hoy aún no ha estudiado
  assert.equal(dayStreak([d(0), d(2)], now), 1);
  assert.equal(dayStreak([], now), 0);
});

test('niveles y puntos', () => {
  assert.equal(levelOf(0).n, 1);
  assert.equal(levelOf(100).n, 2);
  assert.equal(levelOf(99999).to, null);
  const ctx = empty();
  ctx.lessons = { 'lx-terminal': { done: true }, B1T01: { done: true } };
  ctx.answers = { a: { last: 'ok' }, b: { last: 'ko' } };
  assert.equal(xpOf(ctx, { x: 1 }), 20 + 15 + 3 + 2 + 10);
});

test('las preguntas propias (no oficiales) no cuentan para los logros de preguntas', () => {
  const ctx = empty();
  ctx.answers = { 'tp-B1T03-01': { ok: 1, ko: 1, last: 'ok' } };
  const got = newlyEarned(ctx, {});
  assert.ok(!got.includes('primera-respuesta') && !got.includes('remontada'));
});

test('simulacros: «Listo para el examen» y «Nivel real» no se ganan con preguntas ya vistas', () => {
  const ctx = empty();
  const sim = (net, seen) => ({ kind: 'simulacro', at: 1, title: 'S', net, total: 100, seen, seenTotal: 100 });
  ctx.attempts = [sim(90, 80), { kind: 'simulacro', at: 2, title: 'Antiguo', net: 95, total: 100 }];
  let got = newlyEarned(ctx, {});
  assert.ok(!got.includes('simulacro-70') && !got.includes('nivel-real'), 'de memoria o sin el dato, no cuenta');
  ctx.attempts = [sim(72, 50)];
  got = newlyEarned(ctx, {});
  assert.ok(got.includes('simulacro-70') && !got.includes('nivel-real'));
  ctx.attempts = [sim(55, 0)];
  got = newlyEarned(ctx, {});
  assert.ok(got.includes('nivel-real') && !got.includes('simulacro-70'));
});

test('repaso: 10 falladas superadas (las propias no cuentan)', () => {
  const ctx = empty();
  const superada = { ok: 3, ko: 1, last: 'ok', box: 4, due: '2030-01-01' };
  ctx.answers = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`q${i}`, superada]));
  ctx.answers['tp-B1T03-01'] = superada;
  ctx.answers.pendiente = { ok: 1, ko: 1, last: 'ok', box: 2, due: '2030-01-01' };
  assert.ok(!newlyEarned(ctx, {}).includes('repaso-10'));
  ctx.answers.q9 = superada;
  assert.ok(newlyEarned(ctx, {}).includes('repaso-10'));
});

test('«Sin calculadora»: las cuatro prácticas de cálculo', () => {
  const ctx = empty();
  ctx.lessons = { 'f-bases': { done: true }, 'f-almacenamiento': { done: true }, 'lx-cron-calc': { done: true } };
  assert.ok(!newlyEarned(ctx, {}).includes('calculos'));
  ctx.lessons['rd-puertos-ipv6'] = { done: true };
  assert.ok(newlyEarned(ctx, {}).includes('calculos'));
});
