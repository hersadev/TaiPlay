import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildRoad, drawRun, passStage, failStage, cleanStreak, passedAfterFails, stageCleared, EMPTY_ROAD, RUN, MIN_POOL } from '../src/engine/road.js';
import { LOGROS, newlyEarned } from '../src/data/logros.js';
import { seeded } from '../src/engine/drills/random.js';

const ALL = ['tai2025A', 'tai2025X', 'tai2024A', 'tai2022', 'tai2019'].flatMap((id) => {
  const e = JSON.parse(readFileSync(new URL(`../src/data/exams/${id}.json`, import.meta.url)));
  return e.parts.flatMap((p) => p.questions.map((q) => ({ ...q, examId: e.id, partId: p.id })));
});
const STAGES = buildRoad(ALL);

test('el camino recorre los 4 bloques en orden y acaba en la meta', () => {
  assert.deepEqual([...new Set(STAGES.map((s) => s.bloque))], [1, 2, 3, 4, null]);
  assert.equal(new Set(STAGES.map((s) => s.id)).size, STAGES.length);
  for (let b = 1; b <= 4; b++) {
    const own = STAGES.filter((s) => s.bloque === b);
    assert.equal(own[own.length - 1].kind, 'jefe', `el bloque ${b} acaba en su jefe`);
    // Los tramos de temas cubren cada tema del bloque una sola vez.
    const temas = own.filter((s) => s.kind === 'temas').flatMap((s) => s.temas);
    assert.equal(new Set(temas).size, temas.length);
    assert.deepEqual(temas, own.find((s) => s.kind === 'jefe').temas);
  }
  assert.equal(STAGES[STAGES.length - 1].kind, 'meta');
  for (const s of STAGES) assert.ok(s.pool.length >= MIN_POOL, `${s.id}: ${s.pool.length}`);
  // Solo preguntas de la primera parte con respuesta oficial.
  const byId = new Map(ALL.map((q) => [q.id, q]));
  assert.ok(STAGES.every((s) => s.pool.every((id) => byId.get(id).partId === 'primera' && byId.get(id).answer)));
});

test('cada tirada son 10 preguntas distintas del tramo, primero las no respondidas', () => {
  const rng = seeded(4);
  const stage = STAGES[0];
  const run = drawRun(stage, ALL, {}, rng);
  assert.equal(run.length, RUN);
  assert.equal(new Set(run.map((q) => q.id)).size, RUN);
  assert.ok(run.every((q) => stage.pool.includes(q.id)));
  const answers = Object.fromEntries(stage.pool.slice(0, stage.pool.length - 5).map((id) => [id, { last: 'ok' }]));
  const fresh = stage.pool.slice(-5);
  assert.deepEqual(new Set(drawRun(stage, ALL, answers, rng).slice(0, 5).map((q) => q.id)), new Set(fresh));
});

test('solo cuenta el tramo actual: fallar suma intentos y acertar avanza uno', () => {
  let road = EMPTY_ROAD;
  road = passStage(road, STAGES, STAGES[1].id);
  assert.equal(road.cleared, 0, 'no se puede saltar un tramo');
  road = failStage(road, STAGES, STAGES[0].id);
  road = failStage(road, STAGES, STAGES[0].id);
  road = failStage(road, STAGES, STAGES[0].id);
  road = passStage(road, STAGES, STAGES[0].id);
  assert.deepEqual(road, { cleared: 1, fails: { [STAGES[0].id]: 3 } });
  road = failStage(road, STAGES, STAGES[0].id);
  assert.equal(road.fails[STAGES[0].id], 3, 'repetir uno superado no cambia nada');
  assert.ok(passedAfterFails(road, STAGES, 3));
  for (const s of STAGES.slice(1, 4)) road = passStage(road, STAGES, s.id);
  assert.equal(cleanStreak(road, STAGES), 3);
  assert.ok(stageCleared(road, STAGES, STAGES[3].id) && !stageCleared(road, STAGES, STAGES[4].id));
});

test('logros del Road', () => {
  const ctx = { lessons: {}, answers: {}, attempts: [], streak: { current: 0, best: 0 }, days: [], questions: ALL, road: EMPTY_ROAD };
  assert.ok(!newlyEarned(ctx, {}).some((id) => id.startsWith('road-')));
  const jefe1 = STAGES.findIndex((s) => s.id === 'B1-jefe');
  ctx.road = { cleared: jefe1 + 1, fails: {} };
  const got = newlyEarned(ctx, {});
  for (const id of ['road-1', 'road-limpio', 'road-jefe-1']) assert.ok(got.includes(id), id);
  assert.ok(!got.includes('road-jefe-2') && !got.includes('road-meta') && !got.includes('road-perseverante'));
  ctx.road = { cleared: STAGES.length, fails: { [STAGES[2].id]: 4 } };
  const all = newlyEarned(ctx, {});
  for (const l of LOGROS.filter((x) => x.cat === 'road')) assert.ok(all.includes(l.id), l.id);
  assert.deepEqual(LOGROS.find((l) => l.id === 'road-meta').progress(ctx), [STAGES.length, STAGES.length]);
});
